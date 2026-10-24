# Standalone Rokid SDK / EverMe Integration Plan

Use this plan to turn an existing Rokid glasses application into an account-bound memory client. It specifies implementation and acceptance routes; it is not a ready-made backend, an official Rokid binary SDK, or evidence of a completed deployment.

## 1. Establish the Project Inputs

Inspect the project before asking for information it already contains. Record only the missing decisions and keep credentials out of the plan.

| Input | Decision it enables |
|---|---|
| Rokid model, firmware, application package, Android build variant | Identifies the application that will actually run on the glasses |
| Selected development path, SDK artifact/version, API documentation | Establishes where each SDK executes and which device channel really exists |
| Business login and stable owner identity | Binds memory access to the application's existing account |
| Backend stack, database, workers, HTTPS domain, test environment | Places OAuth, MCP, durable queues, and callback handling in maintainable modules |
| Glasses/account binding and optional companion sessions | Defines which device generations and sessions must invalidate old work |
| Data disclosure and consent | Selects permitted reading, model context, and optional writing |
| EverMe onboarding status | Identifies registered exact callbacks, agreed fixed client name, and available test account |
| Requested delivery stage | Separates a plan, implementation, isolated tests, live integration, package build, deployment, and glasses testing |

Use replaceable placeholders for unknown configuration. Missing provider onboarding or hardware should block only the dependent validation stage, not unrelated implementation. Never copy a reference product's client ID, callback, private server, or user data.

## 2. Choose the Actual Runtime Route

```text
Rokid glasses Android application
        │ existing business login and bounded requests
        ▼
Application backend / MemoryGateway
        │ account-bound provider authorization
        ▼
EverMe hosted OAuth MCP

Authorization UI: trusted external browser bound to the same business owner
Optional companion: only where the selected SDK and product require it
```

Confirm the chosen path against [sources.md](./sources.md) and the actual SDK package. The standalone glasses Android route and phone-side CXR libraries have different execution locations; renaming a phone relay does not move it onto the glasses. Check the target's real network and communication capabilities rather than inventing hardware API calls.

Keep voice input, TTS/HUD, sensors, and connection lifecycle in the existing application and SDK modules. EverMe supplies memory access, not these device functions. If a companion is required, add its real verified channel and owner/session/device binding as a separate component.

This is the hosted **EverMe OAuth MCP** route. Open-source EverOS HTTP, desktop/local MCP plugins, and CLI Device Flow are different integration contracts even where tool names resemble each other.

## 3. Select One Supported Authorization Return Branch

### Default: owner-bound trusted external browser

The glasses requests a controlled business connection page. A phone or desktop browser can open that page through a link or QR code, sign in to the same business owner, and bind its authenticated session to the original valid glasses attempt before OAuth begins. The backend callback validates that original browser session and attempt before activating the grant. The glasses then reads its own connection status using its existing business login.

A QR scan, anonymous cookie, a transferred authorization URL, or status polling alone cannot establish this binding. This connection page is an application-backend design, not a claim that EverMe supports OAuth Device Grant.

### Conditional: verified Android App Link completion

Choose this branch only after proving that the authorization device supports the external browser and verified domain/application association. It may be a capable glasses application or an explicitly selected, bound companion application. Keep the callback grant unusable until the original application completes the documented owner/session/attempt-secret and independent one-time-handle handshake. If that return cannot be verified, keep the grant inactive; changing to the browser branch requires a new attempt.

Implement either branch from [android-backend.md → 授权回程与激活](./android-backend.md#授权回程与激活); use [oauth-mcp.md](./oauth-mcp.md) for provider discovery, registration, PKCE, and token exchanges. Those references own the protocol details. Do not replace them with a callback-only shortcut or a generic mobile OAuth example.

## 4. Assign Backend and Application Work

| Module | Implementation responsibility | Detailed contract |
|---|---|---|
| Glasses connection UI | Disclosure, connect/disconnect, bounded status/context display, same-owner local fallback | [Android/backend](./android-backend.md) |
| Identity and attempt service | Business login, device binding, browser/app return, consent and authorization generations | [Android/backend](./android-backend.md) |
| OAuth provider adapter | Trusted discovery, persisted environment-specific registration, encrypted tokens, refresh single-flight | [OAuth/MCP](./oauth-mcp.md) |
| Memory adapter | Authenticated tool discovery, allowlisted calls, schema/receipt checks, bounded untrusted context | [OAuth/MCP](./oauth-mcp.md) |
| Durable workers | Atomic outbox claims, unknown outcomes, revocation that survives account deletion | [Android/backend](./android-backend.md), [OAuth/MCP](./oauth-mcp.md) |
| Configuration and operations | Replaceable callback/client settings, HTTPS routing, secret storage, redacted logs | [Sources and version boundaries](./sources.md), [OAuth/MCP](./oauth-mcp.md) |

Reuse existing backend and account modules. The example business routes in the backend reference are application-owned; they are not EverMe endpoints. Do not introduce a new generic HTTP client on the glasses for provider secrets or expose arbitrary upstream URLs through the gateway.

Start with one owner-bound read path and connection lifecycle, then add authorized writing if requested. A read-only product does not need `mem:write`. Treat every real-service action according to the user's current scope; sharing or installing the skill does not authorize uploading user data.

## 5. Verify and Hand Off by Stage

Use [acceptance.md](./acceptance.md) as the maintained test matrix. Select actual project commands and record observable results rather than marking the matrix as already passed.

| Stage | Required evidence |
|---|---|
| Plan or skill only | Consistent runtime and authorization branch, reachable bundled references, identified inputs and acceptance commands |
| Backend/application implementation | Changed modules, replaceable configuration, isolated identity/OAuth/MCP/queue tests with real command output |
| Live test integration, when authorized | Target discovery/schema, same-owner authorization return, read/search, permitted write receipts and separate recall, refresh/disconnect/revoke results |
| Glasses Android package | Actual build variant/version and artifact SHA-256; a build is not an installation result |
| Deployment, when requested | Deployed version, health response, HTTPS callback routing, durable worker operation |
| Rokid SDK and hardware | Named model/firmware/SDK, installed application build, observed voice→memory→model→TTS/HUD path and any selected companion channel |

Keep unresolved stages explicit. A successful backend request cannot prove the device channel; an accepted write cannot prove extraction or recall. Deliver the receipt format from the acceptance reference with exact next inputs for any remaining stage.
