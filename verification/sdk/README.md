# Reproduce SDK checks

Run commands from the repository root. Requirements: Node.js 24+, npm, Python 3, and OpenSSL with `req -addext` support. The SDK itself has no npm dependencies. These checks use synthetic data and require no EverOS account.

## 30 unit tests + 9 local HTTPS tests

```sh
node --test skills/aiui-everos-direct/scripts/everos-client.test.mjs skills/aiui-everos-direct/scripts/everos-sdk.test.mjs verification/sdk/network.test.mjs
```

Expected: **39 tests passed**, including 9 local HTTPS scenarios. The network test starts a loopback-only TLS server, creates a temporary self-signed certificate/key, trusts that certificate only in the injected request bridge, and deletes its temporary directory after the tests. It never changes system trust, browser TLS settings, or `NODE_TLS_REJECT_UNAUTHORIZED`; run with normal TLS validation enabled. The fake service models EverOS v2 response shapes deterministically. It does not run EverOS memory extraction.

The bridge follows the documented `wx.request` subset: JSON serialization, `success` for HTTP responses, `fail` for transport failures, response headers, timeout, and `RequestTask.abort`. Eleven HTTP requests cover add → flush → search, 202, 401, 429, connection reset, timeout, owner change and disposal; the ninth scenario separately checks that the test certificate is not globally trusted.

## Independent consumption and types

```sh
node --experimental-vm-modules verification/sdk/consumer.mjs
npm exec --yes --package=typescript@7.0.2 -- tsc --noEmit --strict --target ES2022 --module NodeNext --moduleResolution NodeNext verification/sdk/consumer.mts
```

The consumer packs the repository SDK locally, installs that TGZ into a temporary consumer with npm lifecycle scripts disabled, imports a separate directory copy, and evaluates the SDK in an ECMAScript context without Node, fetch or DOM globals. All three modes use synthetic callbacks; the HTTPS test above covers actual transport. The type fixture contains normal usage and four `@ts-expect-error` cases. The consumer removes its temporary directory. npm may use its normal dependency cache for TypeScript.

## Original release provenance

The original `0.1.0` SDK was published in the author's earlier repository. Keep the original source attribution distinct from this standalone integration repository:

```sh
SDK_VERIFY_DIR="$(mktemp -d)"
gh release download aiui-everos-sdk-v0.1.0 --repo EasonZhu1997/Eason-Agent-Skills --pattern aiui-everos-sdk-v0.1.0.zip --pattern eason-aiui-everos-0.1.0.tgz --pattern aiui-everos-direct.zip --dir "$SDK_VERIFY_DIR"
python3 verification/sdk/verify-release.py "$SDK_VERIFY_DIR"
```

This optional check requires GitHub CLI/download access. It verifies all three archive hashes against [release-provenance.json](release-provenance.json), ZIP CRCs, five TGZ entries, and the repository runtime/type bytes against all three archives. It reads archives without extracting or installing them. The downloaded archives remain in the printed/selected temporary directory; remove that directory when no longer needed. Runtime and type SHA-256 values intentionally pin the tested implementation; if code changes, review the change and update provenance together with a new validation record.

## Official AIUI package/host check

```sh
SDK_AIX_DIR="$(node verification/sdk/create-aiui-fixture.mjs)"
npm exec --yes --package=@yodaos-pkg/aix-cli@0.8.2 -- aix pack "$SDK_AIX_DIR" -o "$SDK_AIX_DIR/sdk-check.aix" --engine '>=0.17.0'
npm exec --yes --package=@yodaos-pkg/aix-cli@0.8.2 -- aix list "$SDK_AIX_DIR/sdk-check.aix"
npm exec --yes --package=@yodaos-pkg/aix-cli@0.8.2 -- aix preview "$SDK_AIX_DIR/sdk-check.aix" --launch
```

The generator creates an isolated temporary AIUI project containing the copied SDK, app registration and one Ink Page. The AIX is a local validation artifact. In the official preview, confirm `SDK import + owner guard PASS`, version `0.1.0`, and console marker `AIUI_SDK_IMPORT_OK 0.1.0 stale_owner disposed`. Close the preview server after checking. The page performs no SDK network call: `isCurrent()` deliberately rejects before dispatch.

The original run resolved the official browser runtime to `@yodaos-pkg/ink@0.19.1`; the CLI's preview entry resolves a dynamic Ink version, so record the version actually loaded on each new run. The package engine range only tests the reader gate and does not establish old-device compatibility. Running this command does not establish glasses installation, real EverOS access or a usable device network bridge.

See [validation scope and results](../../docs/validation.md) for the dated evidence and remaining target-environment checks.
