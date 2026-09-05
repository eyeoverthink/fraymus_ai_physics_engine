import assert from "node:assert/strict";
import test from "node:test";

const { createModelGateway } = await import("../dist/test-model-gateway.mjs");

test("gateway discovery uses the approved HTTPS health contract", async () => {
  const requests = [];
  const gateway = createModelGateway({
    baseUrl: "https://gateway.example",
    fetch: async (url, init) => {
      requests.push({ url, init });
      return Response.json({ ok: true, llm: "ollama", dispatcherConfigured: false });
    },
  });

  assert.deepEqual(await gateway.discover(), [{
    id: "ollama",
    status: "connected",
    reason: "Discovered from the approved live gateway (ollama).",
    source: "live",
  }]);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, "https://gateway.example/api/health");
  assert.equal(requests[0].init.headers.accept, "application/json");
  assert.equal("authorization" in requests[0].init.headers, false);
});

test("gateway chat sends only the approved message body and returns live metadata", async () => {
  const requests = [];
  const gateway = createModelGateway({
    baseUrl: "https://gateway.example",
    fetch: async (url, init) => {
      requests.push({ url, init });
      return Response.json({
        ok: true,
        reply: "gateway-ok",
        model: "ollama",
        fallback: true,
      });
    },
  });

  assert.deepEqual(await gateway.chat("hello"), {
    status: "succeeded",
    message: "gateway-ok",
    model: "ollama",
    fallback: true,
    source: "live",
    upstreamStatus: 200,
  });
  assert.equal(requests[0].url, "https://gateway.example/api/chat");
  assert.deepEqual(JSON.parse(requests[0].init.body), { message: "hello" });
  assert.equal("authorization" in requests[0].init.headers, false);
});

test("gateway chat turns upstream contract failures into honest failed results", async () => {
  const gateway = createModelGateway({
    baseUrl: "https://gateway.example",
    fetch: async () => Response.json(
      { ok: false, error: "private upstream detail" },
      { status: 502 },
    ),
  });

  assert.deepEqual(await gateway.chat("hello"), {
    status: "failed",
    message: "The live model gateway could not complete the request (HTTP 502).",
    fallback: false,
    source: "live",
    upstreamStatus: 502,
  });
});

test("gateway configuration rejects non-HTTPS and embedded credentials", () => {
  assert.throws(() => createModelGateway({ baseUrl: "http://gateway.example" }));
  assert.throws(() => createModelGateway({ baseUrl: "https://user:secret@gateway.example" }));
});