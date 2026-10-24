# SDK and integration validation

## Standalone Skill packaging — 2026-10-25

The integration instructions are separately installable from the [Skill center](../skills/README.md). This is a documentation/package update; all five SDK `0.1.0` files are byte-for-byte unchanged, and the original SDK release is retained.

| Check | Observed result |
| --- | --- |
| Official structure review | Pinned AIUI `aiui-dev` at `362fcb7299a44637c19ed7be0e192beb74ebbabf`; short entrypoints route to task-specific references |
| Standalone references | 45 local links stay inside their respective Skill folders; no missing resources |
| Actual project installation | Skills CLI `1.7.4`, Node `24.14.0`, local source path, `-a codex --copy -y`; both Skills installed into an isolated project's `.agents/skills/` with exact file matches and no symlinks |
| Installed package checks | Both Skill validators passed; all 30 existing AIUI SDK tests passed from the installed directory |
| Complete ZIP contents | AIUI: 17 files; Rokid: 9 files. Safe top-level folders, CRC and each extracted file matched final source bytes |

The public GitHub tree-URL discovery command reached Git clone but timed out after 45 seconds in this environment. It was not counted as an installation pass. The install pages also provide fixed full-ZIP URLs that avoid Git clone; the [dated Skill release](https://github.com/EasonZhu1997/Rokid-EverMind-Skills/releases/tag/skills-2026.10.25) carries the archives, `SHA256SUMS`, a per-file manifest and publication checks. SDK version and Skill package date are independent.

| Skill archive | SHA-256 |
| --- | --- |
| `aiui-everos-direct.zip` | `e76de88d324a11ece65a2e6a7932b64e02eb577bb70f5449a6bc1570737962c8` |
| `rokid-sdk-everme.zip` | `957621a7a42c3007bbe4cb299df6631e5fb28f7ff302c92a96e3fc4b0a1012da` |

These checks establish development-Skill installation and bundled SDK consistency. They do not execute EverMe authorization, write real memory, build a new glasses application or validate a physical device. The SDK runtime acceptance below remains dated to its actual execution.

## SDK runtime checks — 2026-10-24

Validated on **2026-10-24**. The AIUI EverOS community SDK `0.1.0` passed the checks below. The Rokid SDK → EverMe Skill describes an integration design; these SDK checks do not validate that separate OAuth/MCP implementation or a physical Rokid SDK channel.

| Check | Observed result | What it proves |
| --- | --- | --- |
| Original release download | Three archives matched the recorded SHA-256 values; runtime/types matched this repository | Delivery integrity and tested-code provenance |
| SDK unit tests | 30 passed, 0 failed | Inputs, callback adapter, HTTP outcomes, owner guards, timeout and lifecycle behavior |
| Real local HTTPS | 9 passed, 11 HTTP requests | Actual loopback TCP/TLS + `wx.request`-shaped bridge; add → flush → search, 202, 401, 429, connection reset, timeout, owner switch, disposal; test CA remains local to the bridge |
| TypeScript 7.0.2 | Strict type check passed, including 4 negative type expectations | Declared interface and typed consumer compatibility |
| Independent consumption | Local TGZ installation, copied directory import and isolated ECMAScript context passed | Package/copy import paths and no SDK dependency on Node/fetch/DOM |
| Official AIUI packaging | `@yodaos-pkg/aix-cli` 0.8.2 packed and read a minimal project containing the SDK; manifest file digests verified | Official AIX packaging and project-local module presence |
| Official browser host | Official preview loaded Ink Web 0.19.1 / QuickJS and rendered `SDK import + owner guard PASS`; console marker confirmed; 480×352; no page errors or failed resources | Packaged SDK import, initialization, stale-owner rejection and disposal in that browser host |

The public verification scripts were run again from this repository: all **30 unit + 9 HTTPS tests passed**. Commands and the minimal fixture are in [verification/sdk](../verification/sdk/README.md). HTTPS responses come from a deterministic mock, not a real EverOS deployment or its extraction model. Official-host checks above use the actual official runtime; the host fixture rejects before network dispatch. The separate HTTPS bridge test does not prove that the browser host or glasses network bridge behaves identically.

## Tested implementation and original release

Original distribution: [AIUI EverOS SDK v0.1.0 in Eason-Agent-Skills](https://github.com/EasonZhu1997/Eason-Agent-Skills/releases/tag/aiui-everos-sdk-v0.1.0), release target commit `2b873fa661f3b6e714ee9c8bbda28a4f139200d3`. This standalone repository reuses that SDK implementation.

| File | SHA-256 |
| --- | --- |
| SDK `index.js` | `84bf32e5c2439f17c03e24939b92aedff6ad6e692f1cdd79fb7c673dc842274b` |
| SDK `index.d.ts` | `c060aec63a5659be5456f04dc9e6a40dc72d4446437f5b558919636b34700553` |
| Original SDK ZIP | `53eba00776b3b7da3a7b12458ac060b9724f7193caa3589f6c818153fe557c46` |
| Original SDK TGZ | `80024e21142189189aa8f034efcd2c04707e03148faee44316a559f8d0f4bcc9` |

The full archive pins and a read-only verification command are provided in [release-provenance.json](../verification/sdk/release-provenance.json) and [verify-release.py](../verification/sdk/verify-release.py). Package metadata may retain the original repository attribution; these pins identify the tested source bytes and original release, not a claim that a new npm package has been published.

## Target-environment work still required

No production keys were read, no real-user memory was written, and no system TLS policy was changed. There was no dedicated empty EverOS sandbox account/deployment available for this check.

- **Real EverOS:** authenticate against the selected deployment; verify provider add/flush/search outcomes, actual memory extraction/retrievability, permissions, async-task handling and owner isolation using an authorized sandbox.
- **Physical glasses:** verify the exact model/firmware, device `wx.request` bridge, network access policy, lifecycle and UI behavior. The AIX engine range is only an installation/reader gate; it does not prove execution on older firmware.
- **Rokid SDK → EverMe:** separately implement and validate the target SDK channel, trusted-browser/conditional App Link return binding, real OAuth, MCP discovery/tool schemas, token rotation, revocation and memory receipts. Renaming the Skill does not constitute an implemented or device-tested SDK integration.

Keep these results separate from live-service, device, installation, deployment and publication evidence.
