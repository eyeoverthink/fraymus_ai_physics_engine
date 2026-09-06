import { Router, type IRouter, type Request } from "express";
import { getAuth } from "@clerk/express";
import { and, desc, eq, inArray, lt, sql } from "drizzle-orm";
import {
  CreateChatBody, CreateChatResponse, ExecuteTerminalOperationBody,
  ExecuteTerminalOperationResponse, GetEcsStatusResponse, GetEpisodesResponse,
  GetEventsResponse, GetFileContentQueryParams, GetFileContentResponse,
  GetFilesResponse, GetModelsResponse, GetSessionResponse, GetSystemStatusResponse,
  UpdateFileContentBody, UpdateFileContentResponse,
  CompleteWorkingFileUploadBody, CompleteWorkingFileUploadResponse,
  DownloadWorkingFileParams, GetWorkingFilesResponse,
  RequestWorkingFileUploadUrlBody, RequestWorkingFileUploadUrlResponse,
} from "@workspace/api-zod";
import { db, episodesTable, receiptEventsTable, workingFilesTable } from "@workspace/db";
import { access, lstat, mkdir, readFile, readdir, realpath, rename, stat, unlink, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { basename, dirname, extname, isAbsolute, join, relative, resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createModelGateway, type ModelGateway } from "../lib/model-gateway";
import { ObjectNotFoundError, ObjectStorageService } from "../lib/objectStorage";
import { parseWorkingFile, validateStoredBytes, validateWorkingFileMetadata } from "../lib/working-files";

const execFileAsync = promisify(execFile);
const maxBytes = 1024 * 1024;
const extensions = new Set([".txt", ".md", ".json", ".yaml", ".yml", ".xml", ".java", ".ts", ".tsx", ".js", ".jsx", ".css", ".html", ".properties", ".csv"]);
export interface SfaRouterOptions {
  getUserId?: (req: Request) => string | null;
  dataRoot?: string;
  modelGateway?: ModelGateway;
}

export function createSfaRouter(options: SfaRouterOptions = {}): IRouter {
const router: IRouter = Router();
const dataRoot = resolve(options.dataRoot ?? process.env.SFA_DATA_DIR ?? join(process.cwd(), "sfa-data"));
const resolveUserId = options.getUserId ?? ((req: Request) => getAuth(req).userId);
const modelGateway = options.modelGateway ?? createModelGateway();
const objectStorage = new ObjectStorageService();

async function cleanupExpiredUploads(req: Request): Promise<void> {
  const expired = await db.select().from(workingFilesTable).where(and(
    inArray(workingFilesTable.state, ["pending", "validating"]),
    lt(workingFilesTable.createdAt, new Date(Date.now() - 60 * 60 * 1000)),
  ));
  for (const record of expired) {
    try {
      const object = await objectStorage.getObjectEntityFile(record.objectPath);
      await object.delete();
    } catch (err) {
      if (!(err instanceof ObjectNotFoundError)) {
        req.log.warn({ err, fileId: record.id }, "Could not clean expired working file object");
        continue;
      }
    }
    await db.delete(workingFilesTable).where(eq(workingFilesTable.id, record.id));
  }
}

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
  let providers: "connected" | "disconnected" = "connected";
  try { await modelGateway.discover(); } catch { providers = "disconnected"; }
  res.json(GetSystemStatusResponse.parse({ status: database === "connected" && providers === "connected" ? "ok" : "degraded", database, providers }));
});
router.get("/models", async (req, res): Promise<void> => {
  try {
    res.json(GetModelsResponse.parse(await modelGateway.discover()));
  } catch (err) {
    req.log.warn({ err }, "Live model discovery failed");
    res.json(GetModelsResponse.parse([{
      id: "gateway",
      status: "disconnected",
      reason: "The approved live gateway is currently unreachable.",
      source: "live",
    }]));
  }
});
router.post("/chat", async (req, res): Promise<void> => {
  const parsed = CreateChatBody.safeParse(req.body);
  if (!parsed.success) { error(res, "Invalid chat request"); return; }
  const id = userId(req);
  const result = await modelGateway.chat(parsed.data.message);
  try {
    await db.transaction(async (tx) => {
      await tx.insert(episodesTable).values({
        userId: id,
        kind: result.status === "succeeded" ? "chat_completed" : "chat_failed",
        metadata: {
          trigger: "user_chat",
          requestedModel: parsed.data.model ?? null,
          actualModel: result.model ?? null,
          fallback: result.fallback,
          source: result.source,
          outcome: result.status,
          upstreamStatus: result.upstreamStatus ?? null,
        },
      });
      await tx.insert(receiptEventsTable).values({
        userId: id,
        type: result.status === "succeeded" ? "chat_gateway_succeeded" : "chat_gateway_failed",
        metadata: {
          actualModel: result.model ?? null,
          fallback: result.fallback,
          source: result.source,
          upstreamStatus: result.upstreamStatus ?? null,
        },
      });
    });
  } catch (err) { req.log.error({ err }, "Could not persist chat receipt"); error(res, "Receipt persistence is unavailable", 503); return; }
  res.json(CreateChatResponse.parse(result));
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
router.get("/working-files", async (req, res): Promise<void> => {
  try {
    await cleanupExpiredUploads(req);
    const rows = await db.select().from(workingFilesTable)
      .where(and(eq(workingFilesTable.userId, userId(req)), eq(workingFilesTable.state, "ready")))
      .orderBy(desc(workingFilesTable.createdAt));
    res.json(GetWorkingFilesResponse.parse(rows.map(({ objectPath: _objectPath, state: _state, ...row }) => row)));
  } catch (err) { req.log.error({ err }, "Could not list working files"); error(res, "Working file storage is unavailable", 503); }
});
router.post("/working-files/uploads/request-url", async (req, res): Promise<void> => {
  const parsed = RequestWorkingFileUploadUrlBody.strict().safeParse(req.body);
  if (!parsed.success) { error(res, "Invalid upload request"); return; }
  const validationError = validateWorkingFileMetadata(parsed.data.name, parsed.data.size, parsed.data.contentType);
  if (validationError) { error(res, validationError); return; }
  try {
    await cleanupExpiredUploads(req);
    const uploadURL = await objectStorage.getObjectEntityUploadURL();
    const objectPath = objectStorage.normalizeObjectEntityPath(uploadURL.split("?")[0]);
    await db.insert(workingFilesTable).values({
      userId: userId(req), objectPath, name: parsed.data.name, size: parsed.data.size,
      contentType: parsed.data.contentType, state: "pending", parseStatus: "unsupported",
    });
    res.json(RequestWorkingFileUploadUrlResponse.parse({ uploadURL, objectPath, expiresInSeconds: 900 }));
  } catch (err) { req.log.error({ err }, "Could not prepare working file upload"); error(res, "Could not prepare upload", 503); }
});
router.post("/working-files/uploads/complete", async (req, res): Promise<void> => {
  const parsed = CompleteWorkingFileUploadBody.strict().safeParse(req.body);
  if (!parsed.success) { error(res, "Invalid upload completion"); return; }
  const id = userId(req);
  const [intent] = await db.select().from(workingFilesTable)
    .where(and(eq(workingFilesTable.userId, id), eq(workingFilesTable.objectPath, parsed.data.objectPath), eq(workingFilesTable.state, "pending")));
  if (!intent || intent.name !== parsed.data.name || intent.size !== parsed.data.size || intent.contentType !== parsed.data.contentType) {
    error(res, "Upload request does not match", 404); return;
  }
  const [claimed] = await db.update(workingFilesTable).set({ state: "validating" })
    .where(and(eq(workingFilesTable.id, intent.id), eq(workingFilesTable.state, "pending"))).returning();
  if (!claimed) { error(res, "Upload is already being processed", 409); return; }
  let finalObjectPath: string | undefined;
  try {
    const objectFile = await objectStorage.getObjectEntityFile(intent.objectPath);
    const [metadata] = await objectFile.getMetadata();
    const actualSize = Number(metadata.size);
    if (actualSize !== intent.size || metadata.contentType !== intent.contentType) throw new Error("Stored object metadata does not match");
    const [bytes] = await objectFile.download();
    const byteError = await validateStoredBytes(intent.name, intent.contentType, bytes);
    if (byteError) throw new Error(byteError);
    const parsedFile = await parseWorkingFile(intent.name, bytes);
    if (parsedFile.parseStatus === "failed") throw new Error("Archive or document parser rejected the file");
    finalObjectPath = await objectStorage.saveValidatedObject(bytes, intent.contentType);
    try {
      await objectStorage.trySetObjectEntityAclPolicy(finalObjectPath, { owner: id, visibility: "private" });
    } catch (err) {
      await (await objectStorage.getObjectEntityFile(finalObjectPath)).delete().catch(() => undefined);
      throw err;
    }
    await objectFile.delete().catch(() => undefined);
    const [ready] = await db.update(workingFilesTable).set({ state: "ready", objectPath: finalObjectPath, ...parsedFile })
      .where(eq(workingFilesTable.id, intent.id)).returning();
    const { objectPath: _objectPath, state: _state, ...response } = ready;
    res.json(CompleteWorkingFileUploadResponse.parse(response));
  } catch (err) {
    if (finalObjectPath) {
      try { await (await objectStorage.getObjectEntityFile(finalObjectPath)).delete(); } catch { /* final object may not exist */ }
    }
    try { (await objectStorage.getObjectEntityFile(intent.objectPath)).delete().catch(() => undefined); } catch { /* object may not exist */ }
    await db.delete(workingFilesTable).where(eq(workingFilesTable.id, intent.id));
    req.log.warn({ err }, "Rejected working file upload");
    error(res, err instanceof ObjectNotFoundError ? "Uploaded object was not found" : "Uploaded file failed server validation");
  }
});
router.get("/working-files/:fileId/download", async (req, res): Promise<void> => {
  const parsed = DownloadWorkingFileParams.safeParse(req.params);
  if (!parsed.success) { error(res, "Invalid file id"); return; }
  const [record] = await db.select().from(workingFilesTable)
    .where(and(eq(workingFilesTable.id, parsed.data.fileId), eq(workingFilesTable.userId, userId(req)), eq(workingFilesTable.state, "ready")));
  if (!record) { error(res, "File not found", 404); return; }
  try {
    const file = await objectStorage.getObjectEntityFile(record.objectPath);
    if (!await objectStorage.canAccessObjectEntity({ userId: userId(req), objectFile: file })) { error(res, "File not found", 404); return; }
    res.setHeader("Content-Type", record.contentType);
    res.setHeader("Content-Length", String(record.size));
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(record.name)}`);
    res.setHeader("Cache-Control", "private, no-store");
    file.createReadStream().on("error", (err) => { req.log.error({ err }, "Working file stream failed"); res.destroy(); }).pipe(res);
  } catch (err) { req.log.error({ err }, "Could not download working file"); error(res, "File not found", 404); }
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
    else if (operation === "status") output = "SFA control plane is running; provider gateway status is available from /api/models.";
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