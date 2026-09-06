---
name: GitHub publishing path
description: How to publish this workspace safely when direct Git transport is not authenticated.
---

Use the authorized GitHub integration to publish the SFA repository when direct HTTPS Git authentication is unavailable. An empty GitHub repository must first be bootstrapped through the Contents API before Git Data blob/tree calls will work.

**Why:** The workspace's direct Git transport has no reusable GitHub credential, and GitHub returns a repository-empty conflict for Git Data operations before the first branch exists. High-volume connector writes also enforce a strict requests-per-second limit.

**How to apply:** Never repoint or push the original engine remote. Target the dedicated private SFA repository, bootstrap an empty `main` branch with one file, use bounded tree batches and sequential binary blobs below the connector rate limit, then verify the remote commit SHA and file count through the GitHub API.