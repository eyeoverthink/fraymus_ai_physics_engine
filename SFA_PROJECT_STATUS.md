# FRAYMUS SFA Project Status

**Updated:** 2026-09-05  
**Current milestone:** Secure control-plane foundation and first security regression pass complete; live gateway integration is next.

## Repository boundary

This multi-artifact SFA workspace belongs in the private repository:

`https://github.com/eyeoverthink/fraymus-sfa`

Do not push this workspace to the original shared physics-engine repository. The original engine remains a historical and behavioral reference.

## What is complete

### Secure SFA control plane

- Replit-managed Clerk authentication is provisioned and wired into the web app and API.
- The API protects every SFA route except the health check.
- Clerk instance selection uses deployment-controlled configuration, not request Host or forwarded-host headers.
- Same-origin API policy, request size limits, structured redacted logging, and per-user rate limiting are active.
- The dashboard has responsive navigation and dedicated views for:
  - Overview and system state
  - Chat and model status
  - Episodes and receipt events
  - Workspace files and text/code editing
  - Controlled terminal operations
  - Read-only Java/ECS status
- The dashboard uses generated typed API hooks rather than handwritten request contracts.
- Provider/model controls report an honest disconnected state until the approved live HTTPS gateway contract is supplied.
- No random telemetry, fake events, fake receipts, or simulated provider success is shown as live activity.

### Controlled operations and accountability

- Terminal access is deny-by-default and limited to four read-only capabilities:
  - `status`
  - `list-files`
  - `maven-version`
  - `java-version`
- Workspace file access is confined to a dedicated data directory.
- Path traversal and symlink escapes are blocked.
- Text/code reads and atomic writes are limited to 1 MB and approved extensions.
- Chat attempts create user-scoped Episode and receipt metadata in PostgreSQL, including honest disconnected outcomes.
- Java/ECS status is read-only and labels unavailable information rather than inventing it.

### Verified checks

- Generated OpenAPI clients and Zod schemas: passed.
- Shared library TypeScript check: passed.
- API TypeScript check: passed.
- Frontend TypeScript check: passed.
- Frontend production build: passed.
- Maven clean verification: passed.
- PostgreSQL schema push: passed.
- API and frontend managed workflows: running.
- Protected Clerk sign-in view: rendered in the Replit preview.
- Fresh completion security review: passed after removing untrusted host-header influence from Clerk configuration.

## Current step

### Prove protected controls cannot be reached without permission

This follow-up is implemented and awaiting normal project reconciliation/merge handling. It adds focused regression coverage for the security boundaries already implemented:

1. Every protected route rejects unauthenticated requests.
2. Forged `Host` and `X-Forwarded-Host` values cannot change Clerk configuration.
3. Path traversal and symlink escape attempts are rejected.
4. Arbitrary terminal commands fail validation.
5. Cross-origin requests and request floods are handled by the configured policy.
6. Chat remains explicitly disconnected until a provider is configured.

## What comes next

### 1. Connect the approved live model gateway

Blocked until the exact HTTPS OpenClaw/Ollama/Hermes gateway contract and authentication method are confirmed. The implementation must remain server-side and must not expose private ports, provider credentials, or secret endpoints to browser code.

### 2. Add protected persistent uploads and downloads

Extend the current safe text workspace with authenticated App Storage uploads/downloads, per-user authorization, MIME and size validation, parser limits, and archive traversal protection.

### 3. Continue the engine milestones

The SFA control plane should remain separate from renderer-independent Core work. Existing proposed engine milestones include camera/entity inspection, deterministic physics, golden-check diffs, approved outcome pinning, and framebuffer/debug rendering.

### 4. Continue API hardening

Two additional security/reliability follow-ups are proposed:

- Keep abuse limits consistent when the API runs on multiple servers.
- Reject undeclared fields in every generated API request.

## Operating rules for the next session

- Read this file and `FRAYMUS_BUILD_ORDER.md` before changing the engine or SFA architecture.
- Use the private `fraymus-sfa` repository for this workspace.
- Verify external claims independently before calling them live or complete.
- Preserve Episode accountability: trigger → evidence → proposal → human review → outcome → later learning.
- Do not duplicate the VPS model backend, OpenClaw, Ollama, dispatcher, or SSH infrastructure inside Replit.
- Do not expose secrets, private model ports, unrestricted shell access, or provider credentials to browser code.
- Reconcile the implemented security task, then move to the live gateway task and protected persistent file transfer unless Vaughn changes priority.