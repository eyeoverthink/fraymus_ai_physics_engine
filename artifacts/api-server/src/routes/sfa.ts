import { Router, type IRouter, type Request } from "express";
import { getAuth } from "@clerk/express";
import { desc, eq, sql } from "drizzle-orm";
import {
  CreateChatBody, CreateChatResponse, ExecuteTerminalOperationBody,
  ExecuteTerminalOperationResponse, GetEcsStatusResponse, GetEpisodesResponse,
  GetEventsResponse, GetFileContentQueryParams, GetFileContentResponse,
  GetFilesResponse, GetModelsResponse, GetSessionResponse, GetSystemStatusResponse,
  UpdateFileContentBody, UpdateFileContentResponse,
} from "@workspace/api-zod";
import { db, episodesTable, receiptEventsTable } from "@workspace/db";
import { access, lstat, mkdir, readFile, readdir, realpath, rename, stat, unlink, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { basename, dirname, extname, isAbsolute, join, relative, resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const maxBytes = 1024 * 1024;
const extensions = new Set([".txt", ".md", ".json", ".yaml", ".yml", ".xml", ".java", ".ts", ".tsx", ".js", ".jsx", ".css", ".html", ".properties", ".csv"]);
export interface SfaRouterOptions {
  getUserId?: (req: Request) => string | null;
  dataRoot?: string;
}

export function createSfaRouter(options: SfaRouterOptions = {}): IRouter {
const router: IRouter = Router();
const dataRoot = resolve(options.dataRoot ?? process.env.SFA_DATA_DIR ?? join(process.cwd(), "sfa-data"));
const resolveUserId = options.getUserId ?? ((req: Request) => getAuth(req).userId);

function userId(req: Request): string {
  const id = resolveUserId(req);
  if (!id) throw new Error("Authenticated user is missing");
  return id;
}
function error(res: import("express").Response, message: string, status = 400): void {
  res.status(status).json({ error: message });
}
function validPath(input: string): string | undefined {
  if (isAbsolute(input) || input.includes("\0") || extname(input).toLowerCase() === "" || !extensions.has(extname(input).toLowerCase())) return undefined;
  const target = resolve(dataRoot, input);
  return relative(dataRoot, target).startsWith("..") || relative(dataRoot, target) === "" ? undefined : target;
}
async function safeExisting(input: string): Promise<string | undefined> {
  const target = validPath(input);
  if (!target) return undefined;
  await mkdir(dataRoot, { recursive: true });
  const root = await realpath(dataRoot);
  try {
    const actual = await realpath(target);
    return actual.startsWith(`${root}/`) ? actual : undefined;
  } catch { return undefined; }
}
async function safeWriteTarget(input: string): Promise<string | undefined> {
  const target = validPath(input);
  if (!target) return undefined;
  await mkdir(dataRoot, { recursive: true });
  const root = await realpath(dataRoot);
  let cursor = dirname(target);
  const ancestors: string[] = [];
  while (cursor !== dataRoot) { ancestors.push(cursor); cursor = dirname(cursor); }
  for (const part of ancestors.reverse()) {
    try {
      const info = await lstat(part);
      if (info.isSymbolicLink() || !info.isDirectory()) return undefined;
    } catch { await mkdir(part); }
  }
  return target.startsWith(`${root}/`) ? target : undefined;
}
async function listFiles(): Promise<Array<{ path: string; size: number; modifiedAt: Date }>> {
  await mkdir(dataRoot, { recursive: true });
  const root = await realpath(dataRoot);
  const output: Array<{ path: string; size: number; modifiedAt: Date }> = [];
  async function walk(folder: string): Promise<void> {
    for (const entry of await readdir(folder, { withFileTypes: true })) {
      const candidate = join(folder, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) await walk(candidate);
      else if (entry.isFile() && extensions.has(extname(entry.name).toLowerCase())) {
        const actual = await realpath(candidate);
        const info = await stat(actual);
        if (actual.startsWith(`${root}/`) && info.size <= maxBytes) output.push({ path: relative(root, actual), size: info.size, modifiedAt: info.mtime });
      }
    }
  }
  await walk(root);
  return output.sort((a, b) => a.path.localeCompare(b.path));
}

router.get("/session", (req, res): void => {
  res.json(GetSessionResponse.parse({ userId: userId(req), authenticated: true }));
});
router.get("/system/status", async (_req, res): Promise<void> => {
  let database: "connected" | "unavailable" = "connected";
  try { await db.execute(sql`select 1`); } catch { database = "unavailable"; }
  res.json(GetSystemStatusResponse.parse({ status: database === "connected" ? "ok" : "degraded", database, providers: "disabled" }));
});
router.get("/models", (_req, res): void => {
  res.json(GetModelsResponse.parse([{ id: "gateway", status: "disabled", reason: "No approved live gateway contract is configured." }]));
});
router.post("/chat", async (req, res): Promise<void> => {
  const parsed = CreateChatBody.safeParse(req.body);
  if (!parsed.success) { error(res, "Invalid chat request"); return; }
  const id = userId(req);
  try {
    await db.insert(episodesTable).values({ userId: id, kind: "chat_disabled", metadata: { model: parsed.data.model ?? null } });
    await db.insert(receiptEventsTable).values({ userId: id, type: "chat_provider_disabled", metadata: {} });
  } catch (err) { req.log.error({ err }, "Could not persist chat receipt"); error(res, "Receipt persistence is unavailable", 503); return; }
  res.json(CreateChatResponse.parse({ status: "disabled", message: "Chat is disabled because no approved live gateway contract exists." }));
});
router.get("/episodes", async (req, res): Promise<void> => {
  try {
    const rows = await db.select().from(episodesTable).where(eq(episodesTable.userId, userId(req))).orderBy(desc(episodesTable.createdAt));
    res.json(GetEpisodesResponse.parse(rows.map((row) => ({ ...row, metadata: row.metadata ?? undefined }))));
  } catch (err) { req.log.error({ err }, "Could not read episodes"); error(res, "Episode persistence is unavailable", 503); }
});
router.get("/events", async (req, res): Promise<void> => {
  try {
    const rows = await db.select().from(receiptEventsTable).where(eq(receiptEventsTable.userId, userId(req))).orderBy(desc(receiptEventsTable.createdAt));
    res.json(GetEventsResponse.parse(rows.map((row) => ({ ...row, metadata: row.metadata ?? undefined }))));
  } catch (err) { req.log.error({ err }, "Could not read events"); error(res, "Receipt persistence is unavailable", 503); }
});
router.get("/files", async (req, res): Promise<void> => {
  try { res.json(GetFilesResponse.parse(await listFiles())); } catch (err) { req.log.error({ err }, "Could not list workspace data"); error(res, "Workspace data is unavailable", 503); }
});
router.get("/files/content", async (req, res): Promise<void> => {
  const parsed = GetFileContentQueryParams.safeParse(req.query);
  if (!parsed.success) { error(res, "Invalid file path"); return; }
  const target = await safeExisting(parsed.data.path);
  if (!target) { error(res, "File not found", 404); return; }
  const info = await stat(target);
  if (info.size > maxBytes) { error(res, "File exceeds 1MB limit"); return; }
  const content = await readFile(target, "utf8");
  res.json(GetFileContentResponse.parse({ path: parsed.data.path, content }));
});
router.put("/files/content", async (req, res): Promise<void> => {
  const parsed = UpdateFileContentBody.safeParse(req.body);
  if (!parsed.success || Buffer.byteLength(parsed.data.content, "utf8") > maxBytes) { error(res, "Invalid file content"); return; }
  const target = await safeWriteTarget(parsed.data.path);
  if (!target) { error(res, "Unsafe file path"); return; }
  const temp = join(dirname(target), `.${basename(target)}.${process.pid}.tmp`);
  try { await writeFile(temp, parsed.data.content, { encoding: "utf8", flag: "wx", mode: 0o600 }); await rename(temp, target); }
  catch (err) { await unlink(temp).catch(() => undefined); req.log.error({ err }, "Could not write workspace data"); error(res, "Could not write file", 503); return; }
  res.json(UpdateFileContentResponse.parse(parsed.data));
});
router.post("/terminal/execute", async (req, res): Promise<void> => {
  // Orval currently emits a non-strict Zod object even though the OpenAPI
  // contract declares additionalProperties: false. Enforce that boundary here
  // so command-like fields cannot be smuggled beside an allowed operation.
  const parsed = ExecuteTerminalOperationBody.strict().safeParse(req.body);
  if (!parsed.success) { error(res, "Invalid terminal operation"); return; }
  const operation = parsed.data.operation;
  try {
    let output: string;
    if (operation === "list-files") output = (await listFiles()).map((file) => file.path).join("\n");
    else if (operation === "status") output = "SFA control plane is running; provider gateway is disabled.";
    else { const command = operation === "maven-version" ? "mvn" : "java"; const args = ["--version"]; const result = await execFileAsync(command, args, { timeout: 5000, maxBuffer: 64 * 1024, windowsHide: true }); output = `${result.stdout}${result.stderr}`.trim(); }
    res.json(ExecuteTerminalOperationResponse.parse({ operation, status: "ok", output }));
  } catch { res.json(ExecuteTerminalOperationResponse.parse({ operation, status: "unavailable", output: "The requested read-only operation is unavailable." })); }
});
router.get("/ecs/status", async (_req, res): Promise<void> => {
  let mavenProject: "available" | "unavailable" = "unavailable";
  try { await access(join(process.cwd(), "pom.xml"), constants.R_OK); mavenProject = "available"; } catch { /* unavailable is honest */ }
  res.json(GetEcsStatusResponse.parse({ status: "unavailable", mavenProject, process: "unavailable" }));
});
return router;
}

export default createSfaRouter;