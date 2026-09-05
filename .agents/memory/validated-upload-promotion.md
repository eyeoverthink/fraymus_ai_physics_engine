---
name: Validated upload promotion
description: Integrity rule for accepting direct-to-storage uploads after server validation.
---

Never expose a validated staging object as the permanent downloadable object while its presigned write URL may still be valid. Promote the exact verified bytes into a new server-controlled, create-only object and serve only that final object.

**Why:** A client holding the staging URL can overwrite the staging object after validation, invalidating MIME, size, parser, and content checks.

**How to apply:** For any direct upload that requires server validation, treat the presigned destination as temporary, atomically claim validation, copy the validated byte buffer to a fresh final key, apply owner access, then delete the staging object.