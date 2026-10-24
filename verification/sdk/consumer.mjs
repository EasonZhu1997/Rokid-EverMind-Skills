import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import vm from 'node:vm';

const sdkDirectory = fileURLToPath(new URL('../../skills/aiui-everos-direct/sdk/', import.meta.url));
const temporary = await mkdtemp(path.join(tmpdir(), 'rokid-everos-consumer-'));
try {
  const copiedDirectory = path.join(temporary, 'copied-sdk');
  await cp(sdkDirectory, copiedDirectory, { recursive: true });
  const [packed] = JSON.parse(execFileSync('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', temporary], { cwd: sdkDirectory, encoding: 'utf8' }));
  assert.equal(packed.entryCount, 5);
  const consumer = path.join(temporary, 'consumer');
  await mkdir(consumer);
  await writeFile(path.join(consumer, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
  execFileSync('npm', ['install', '--prefix', consumer, '--ignore-scripts', '--no-audit', '--no-fund', path.join(temporary, packed.filename)], { stdio: 'pipe' });
  const installedSource = path.join(consumer, 'node_modules/@eason/aiui-everos/index.js');
  const source = await readFile(path.join(sdkDirectory, 'index.js'), 'utf8');
  assert.equal(await readFile(installedSource, 'utf8'), source);
  const installed = await import(pathToFileURL(installedSource).href);
  const copied = await import(pathToFileURL(path.join(copiedDirectory, 'index.js')).href);
  const context = vm.createContext({ setTimeout, clearTimeout, TextDecoder });
  const module = new vm.SourceTextModule(source, { context });
  await module.link(() => { throw new Error('SDK has an unexpected external import'); });
  await module.evaluate();
  for (const global of ['process', 'Buffer', 'require', 'fetch', 'document']) {
    assert.equal(vm.runInContext('typeof ' + global, context), 'undefined');
  }
  for (const factory of [installed.createAIUIEverosClient, copied.createAIUIEverosClient, module.namespace.createAIUIEverosClient]) {
    let calls = 0;
    const wx = { request(options) {
      assert.equal(this, wx); calls++;
      options.success({ statusCode: 200, data: { data: { results: [], marker: 'synthetic' } } });
      return { abort() { throw new Error('completed request must not abort'); } };
    } };
    const client = factory({ wx, baseUrl: 'https://synthetic.invalid', scope: { appId: 'a', projectId: 'p', userId: 'u', assistantId: 'coach' }, getAuthorization: () => 'Bearer synthetic-unused', isCurrent: () => true });
    assert.equal((await client.search({ query: 'synthetic' })).data.marker, 'synthetic');
    client.dispose(); assert.equal(calls, 1);
  }
  assert.equal(installed.EVEROS_SDK_VERSION, '0.1.0');
  console.log(JSON.stringify({ locally_packed_tgz_install: 'PASS', copied_directory_import: 'PASS', isolated_ecmascript_context: 'PASS', sdk_external_dependencies: false, modes_exercised: 3, sdk_network_requests: 0 }));
} finally {
  await rm(temporary, { recursive: true, force: true });
}
