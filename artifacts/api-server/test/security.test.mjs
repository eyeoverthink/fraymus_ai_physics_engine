import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

process.env.CLERK_PUBLISHABLE_KEY ||= "pk_test_dummy";
process.env.CLERK_SECRET_KEY ||= "sk_test_dummy";

const { createApp } = await import("../dist/test-app.mjs");

async function withServer(options, run) {
  const app = createApp(options);
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  const request = (path, init = {}) =>
    fetch(`http://127.0.0.1:${port}${path}`, init);
  try {
    await run(request);
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

const protectedRequests = [
  ["GET", "/api/session"],
  ["GET", "/api/system/status"],
  ["GET", "/api/models"],
  ["POST", "/api/chat"],
  ["GET", "/api/episodes"],
  ["GET", "/api/events"],
  ["GET", "/api/files"],
  ["GET", "/api/files/content?path=note.txt"],
  ["PUT", "/api/files/content"],
  ["POST", "/api/terminal/execute"],
  ["GET", "/api/ecs/status"],
];

test("every protected route rejects unauthenticated requests", async () => {
  await withServer({ getUserId: () => null }, async (request) => {
    for (const [method, path] of protectedRequests) {
      const response = await request(path, {
        method,
        headers: method === "GET" ? undefined : { "content-type": "application/json" },
        body: method === "GET" ? undefined : "{}",
      });
      assert.equal(response.status, 401, `${method} ${path}`);
    }
  });
});

test("path traversal and symlink escapes cannot read or write outside the data root", async () => {
  const root = await mkdtemp(join(tmpdir(), "sfa-security-"));
  const dataRoot = join(root, "data");
  const outside = join(root, "outside");
  await mkdir(dataRoot);
  await mkdir(outside);
  await writeFile(join(outside, "secret.txt"), "not reachable");
  await symlink(outside, join(dataRoot, "escape"));

  try {
    await withServer({ getUserId: () => "user-1", dataRoot }, async (request) => {
      const traversalRead = await request("/api/files/content?path=../outside/secret.txt");
      assert.equal(traversalRead.status, 404);

      const symlinkRead = await request("/api/files/content?path=escape/secret.txt");
      assert.equal(symlinkRead.status, 404);

      const traversalWrite = await request("/api/files/content", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ path: "../outside/new.txt", content: "blocked" }),
      });
      assert.equal(traversalWrite.status, 400);

      const symlinkWrite = await request("/api/files/content", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ path: "escape/new.txt", content: "blocked" }),
      });
      assert.equal(symlinkWrite.status, 400);
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("terminal execution rejects arbitrary command payloads", async () => {
  await withServer({ getUserId: () => "user-1" }, async (request) => {
    for (const body of [
      { operation: "rm -rf /" },
      { operation: "status", command: "id" },
      { command: "cat /etc/passwd" },
      { operation: ["status"] },
    ]) {
      const response = await request("/api/terminal/execute", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      assert.equal(response.status, 400);
    }
  });
});

test("rate limiting rejects the 121st request in a user's window", async () => {
  await withServer({ getUserId: () => "rate-user" }, async (request) => {
    for (let index = 0; index < 120; index += 1) {
      assert.equal((await request("/api/session")).status, 200);
    }
    const limited = await request("/api/session");
    assert.equal(limited.status, 429);
  });
});

test("cross-origin requests are rejected before protected route handling", async () => {
  await withServer({ getUserId: () => "user-1" }, async (request) => {
    const response = await request("/api/session", {
      headers: { origin: "https://attacker.example" },
    });
    assert.equal(response.status, 403);
    assert.equal(response.headers.get("access-control-allow-origin"), null);
  });
});

test("model discovery reports the approved live gateway result", async () => {
  const modelGateway = {
    discover: async () => [{
      id: "ollama",
      status: "connected",
      reason: "Discovered from the approved live gateway (ollama).",
      source: "live",
    }],
    chat: async () => {
      throw new Error("not used");
    },
  };
  await withServer({ getUserId: () => "user-1", modelGateway }, async (request) => {
    const response = await request("/api/models");
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), [
      {
        id: "ollama",
        status: "connected",
        reason: "Discovered from the approved live gateway (ollama).",
        source: "live",
      },
    ]);
  });
});

test("model discovery truthfully reports a live gateway outage", async () => {
  const modelGateway = {
    discover: async () => {
      throw new Error("gateway unavailable");
    },
    chat: async () => {
      throw new Error("not used");
    },
  };
  await withServer({ getUserId: () => "user-1", modelGateway }, async (request) => {
    const response = await request("/api/models");
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), [{
      id: "gateway",
      status: "disconnected",
      reason: "The approved live gateway is currently unreachable.",
      source: "live",
    }]);
  });
});