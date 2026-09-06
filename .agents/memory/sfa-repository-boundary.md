---
name: SFA repository boundary
description: Repository ownership rule for the FRAYMUS multi-app SFA workspace.
---

The FRAYMUS multi-app SFA workspace must use the dedicated private GitHub
repository `eyeoverthink/fraymus-sfa`. Never push it to the original shared
engine repository.

**Why:** Multiple contributors are independently working against the original
engine repository, and the multi-app migration will not remain history- or
structure-compatible with their work.

**How to apply:** After the active workspace migration completes and is
verified, configure this workspace's destination remote to the dedicated SFA
repository. Preserve the old remote under an explicitly named read-only
reference only if needed; never push to it by default.