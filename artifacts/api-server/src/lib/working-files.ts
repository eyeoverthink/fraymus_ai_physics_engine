import { fileTypeFromBuffer } from "file-type";
import yauzl from "yauzl";
import { extname } from "node:path";

export const MAX_WORKING_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_PARSED_CHARS = 200_000;
const MAX_ARCHIVE_ENTRIES = 200;
const MAX_ARCHIVE_EXPANDED_BYTES = 20 * 1024 * 1024;

const allowed = new Map<string, Set<string>>([
  [".txt", new Set(["text/plain"])],
  [".md", new Set(["text/markdown", "text/plain"])],
  [".csv", new Set(["text/csv", "text/plain", "application/csv"])],
  [".json", new Set(["application/json", "text/json", "text/plain"])],
  [".yaml", new Set(["application/yaml", "application/x-yaml", "text/yaml", "text/plain"])],
  [".yml", new Set(["application/yaml", "application/x-yaml", "text/yaml", "text/plain"])],
  [".xml", new Set(["application/xml", "text/xml", "text/plain"])],
  [".pdf", new Set(["application/pdf"])],
  [".docx", new Set(["application/vnd.openxmlformats-officedocument.wordprocessingml.document"])],
  [".zip", new Set(["application/zip", "application/x-zip-compressed"])],
]);

export function validateWorkingFileMetadata(name: string, size: number, contentType: string): string | undefined {
  const extension = extname(name).toLowerCase();
  if (!allowed.has(extension)) return "File type is not approved";
  if (!Number.isSafeInteger(size) || size < 1 || size > MAX_WORKING_FILE_BYTES) return "File exceeds the 10MB limit";
  if (!allowed.get(extension)?.has(contentType.toLowerCase())) return "File extension and declared MIME type do not match";
  if (name.includes("/") || name.includes("\\") || name.includes("\0")) return "File name is unsafe";
  return undefined;
}

export async function validateStoredBytes(name: string, declaredType: string, bytes: Buffer): Promise<string | undefined> {
  if (bytes.length < 1 || bytes.length > MAX_WORKING_FILE_BYTES) return "Stored file size is invalid";
  const extension = extname(name).toLowerCase();
  const detected = await fileTypeFromBuffer(bytes);
  if ([".pdf", ".docx", ".zip"].includes(extension)) {
    const expected = extension === ".pdf" ? "pdf" : "zip";
    if (detected?.ext !== expected) return "Stored bytes do not match the approved file type";
  } else {
    if (detected) return "A binary file cannot be uploaded as text";
    if (bytes.includes(0)) return "Text files cannot contain NUL bytes";
    const decoded = bytes.toString("utf8");
    if (Buffer.from(decoded, "utf8").compare(bytes) !== 0) return "Text files must use valid UTF-8";
  }
  return validateWorkingFileMetadata(name, bytes.length, declaredType);
}

export function safeArchivePath(name: string): boolean {
  const normalized = name.replaceAll("\\", "/");
  return !normalized.startsWith("/") && !/^[A-Za-z]:/.test(normalized) &&
    !normalized.split("/").some((part) => part === ".." || part === "\0");
}

async function inspectZip(bytes: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(bytes, { lazyEntries: true }, (openError, zip) => {
      if (openError || !zip) { reject(openError ?? new Error("Invalid archive")); return; }
      let count = 0;
      let expanded = 0;
      const names: string[] = [];
      zip.on("entry", (entry) => {
        count += 1;
        expanded += entry.uncompressedSize;
        if (!safeArchivePath(entry.fileName)) { zip.close(); reject(new Error("Archive contains an unsafe path")); return; }
        if (count > MAX_ARCHIVE_ENTRIES || expanded > MAX_ARCHIVE_EXPANDED_BYTES) {
          zip.close(); reject(new Error("Archive exceeds parser limits")); return;
        }
        names.push(entry.fileName);
        zip.readEntry();
      });
      zip.on("end", () => resolve(`Archive manifest (${count} entries):\n${names.join("\n")}`.slice(0, MAX_PARSED_CHARS)));
      zip.on("error", reject);
      zip.readEntry();
    });
  });
}

export async function parseWorkingFile(name: string, bytes: Buffer): Promise<{ parseStatus: "parsed" | "unsupported" | "failed"; parsedContent?: string }> {
  const extension = extname(name).toLowerCase();
  try {
    if ([".txt", ".md", ".csv", ".json", ".yaml", ".yml", ".xml"].includes(extension)) {
      return { parseStatus: "parsed", parsedContent: bytes.toString("utf8").slice(0, MAX_PARSED_CHARS) };
    }
    if (extension === ".zip") return { parseStatus: "parsed", parsedContent: await inspectZip(bytes) };
    return { parseStatus: "unsupported" };
  } catch {
    return { parseStatus: "failed" };
  }
}