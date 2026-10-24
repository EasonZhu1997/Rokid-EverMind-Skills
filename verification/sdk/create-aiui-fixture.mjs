import { cp, mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// An isolated local preview fixture, not a deployable product or real service test.
const project = process.argv[2] ? path.resolve(process.argv[2]) : await mkdtemp(path.join(tmpdir(), 'rokid-everos-aiui-'));
if (process.argv[2]) await mkdir(project); // Reject an existing destination.
await mkdir(path.join(project, 'pages/index'), { recursive: true });
await mkdir(path.join(project, 'lib'), { recursive: true });
await cp(fileURLToPath(new URL('../../skills/aiui-everos-direct/sdk/', import.meta.url)), path.join(project, 'lib/everos-sdk'), { recursive: true, errorOnExist: true, force: false });
await writeFile(path.join(project, 'package.json'), JSON.stringify({ name: 'everos-sdk-isolated-acceptance', version: '0.1.0', type: 'module' }));
await writeFile(path.join(project, 'app.json'), JSON.stringify({ pages: ['pages/index/index'], permissions: ['network'], window: { navigationBarTitleText: 'EverOS SDK Acceptance' } }));
await writeFile(path.join(project, 'app.js'), 'export default {};\n');
await writeFile(path.join(project, 'AGENTS.md'), '# EverOS SDK Isolated Acceptance\n\nLocal SDK import/guard test only. No real service credentials.\n');
await writeFile(path.join(project, 'pages/index/index.ink'), `<script def>
{"navigationBarTitleText":"SDK acceptance"}
</script>
<script setup>
import wx from 'wx';
import { createAIUIEverosClient, EVEROS_SDK_VERSION } from '../../lib/everos-sdk/index.js';
export default {
  data: { status: 'Loading SDK...', version: '' },
  async onLoad() {
    try {
      const client = createAIUIEverosClient({
        wx, baseUrl: 'https://localhost',
        scope: { appId: 'isolated', projectId: 'acceptance', userId: 'synthetic', assistantId: 'coach' },
        getAuthorization: () => 'Bearer synthetic-unused-preview',
        isCurrent: () => false,
      });
      let guard = '';
      try { await client.search({ query: 'synthetic preview guard' }); }
      catch (error) { guard = error.message; }
      if (guard !== 'stale_owner' || EVEROS_SDK_VERSION !== '0.1.0') throw new Error('guard_or_version_failed');
      client.dispose();
      this.setData({ status: 'SDK import + owner guard PASS', version: EVEROS_SDK_VERSION });
      console.log('AIUI_SDK_IMPORT_OK 0.1.0 stale_owner disposed');
    } catch (error) {
      this.setData({ status: 'FAIL: ' + error.message });
      console.error('AIUI_SDK_IMPORT_FAIL', error.message);
    }
  },
};
</script>
<page>
  <view class="root"><text>EverOS SDK acceptance</text><text>{{status}}</text><text>Version {{version}}</text><text>Local package / synthetic guard only</text></view>
</page>
<style>
.root { display: flex; flex-direction: column; padding: 24px; gap: 14px; color: #00ff66; }
</style>
`);
console.log(project);
