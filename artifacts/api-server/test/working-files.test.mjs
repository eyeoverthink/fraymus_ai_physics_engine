import assert from "node:assert/strict";
import test from "node:test";

const {
  MAX_WORKING_FILE_BYTES,
  safeArchivePath,
  validateStoredBytes,
  validateWorkingFileMetadata,
} = await import("../dist/test-working-files.mjs");

test("working file metadata enforces names, size, extensions, and matching MIME", () => {
  assert.equal(validateWorkingFileMetadata("notes.md", 20, "text/markdown"), undefined);
  assert.match(validateWorkingFileMetadata("../notes.md", 20, "text/markdown"), /unsafe/);
  assert.match(validateWorkingFileMetadata("payload.exe", 20, "application/octet-stream"), /not approved/);
  assert.match(validateWorkingFileMetadata("notes.md", 20, "application/pdf"), /do not match/);
  assert.match(validateWorkingFileMetadata("notes.md", MAX_WORKING_FILE_BYTES + 1, "text/markdown"), /10MB/);
});

test("stored byte validation rejects disguised binary and invalid UTF-8", async () => {
  assert.equal(await validateStoredBytes("notes.txt", "text/plain", Buffer.from("safe utf-8")), undefined);
  assert.match(await validateStoredBytes("notes.txt", "text/plain", Buffer.from([0x00, 0x01])), /NUL|binary/);
  assert.match(await validateStoredBytes("notes.txt", "text/plain", Buffer.from([0xff, 0xfe])), /UTF-8/);
  assert.match(await validateStoredBytes("document.pdf", "application/pdf", Buffer.from("not a pdf")), /do not match/);
});

test("archive entry paths cannot escape their virtual root", () => {
  for (const path of ["../secret.txt", "folder/../../secret.txt", "/etc/passwd", "C:\\secret.txt"]) {
    assert.equal(safeArchivePath(path), false, path);
  }
  assert.equal(safeArchivePath("folder/safe.txt"), true);
});