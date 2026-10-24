import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import https from 'node:https';
import { once } from 'node:events';
import { test, after } from 'node:test';
import { createAIUIEverosClient } from '../../skills/aiui-everos-direct/sdk/index.js';

// Real TCP + TLS server, synthetic data only. No requests leave localhost.
const tlsDirectory = await mkdtemp(path.join(tmpdir(), 'rokid-everos-tls-'));
const keyPath = path.join(tlsDirectory, 'key.pem');
const certPath = path.join(tlsDirectory, 'cert.pem');
try {
  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1',
    '-keyout', keyPath, '-out', certPath, '-subj', '/CN=localhost',
    '-addext', 'subjectAltName=DNS:localhost,IP:127.0.0.1'], { stdio: 'ignore' });
} catch (error) {
  await rm(tlsDirectory, { recursive: true, force: true });
  throw new Error('OpenSSL supporting req -addext is required; no system TLS configuration is modified.', { cause: error });
}
const cert = await readFile(certPath);
const key = await readFile(keyPath);
const records = [];
const stored = new Map();
const sockets = new Set();
const server = https.createServer({ key, cert }, (req, res) => {
  let raw = '';
  req.on('data', chunk => { raw += chunk; });
  req.on('end', () => {
    const payload = JSON.parse(raw);
    records.push({ path: req.url, payload, authorization: req.headers.authorization });
    const reply = (code, data, headers = {}) => {
      if (res.destroyed) return;
      res.writeHead(code, { 'Content-Type': 'application/json', ...headers });
      res.end(JSON.stringify({ request_id: 'mock-' + records.length, data }));
    };
    if (req.headers.authorization === 'Bearer reject-synthetic') return reply(401, { status: 'unauthorized' });
    if (payload.query === 'rate-limited') return reply(429, {}, { 'Retry-After': '2' });
    if (payload.query === 'drop-connection') return req.socket.destroy();
    if (payload.query === 'never-respond') return;
    if (payload.query?.startsWith('delay-')) return setTimeout(() => reply(200, { owner: payload.user_id, query: payload.query }), 120);
    if (req.url.endsWith('/add')) {
      if (payload.session_id === 'queued-session') return reply(202, { status: 'queued', task_id: 'synthetic-task' });
      stored.set(payload.session_id, { messages: payload.messages, extracted: false });
      return reply(200, { status: 'accumulated' });
    }
    if (req.url.endsWith('/flush')) {
      const item = stored.get(payload.session_id);
      if (item) item.extracted = true;
      return reply(200, { status: item ? 'extracted' : 'no_extraction' });
    }
    return reply(200, { results: [...stored.values()].filter(x => x.extracted).flatMap(x => x.messages).filter(m => m.sender_id === payload.user_id).map(m => ({ content: m.content })), owner: payload.user_id });
  });
});
server.on('connection', socket => { sockets.add(socket); socket.on('close', () => sockets.delete(socket)); });
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const port = server.address().port;
const baseUrl = 'https://localhost:' + port;
const transportEvents = [];

// Matches the documented portion of wx.request: receiver, JSON serialization,
// JSON/text success for all HTTP statuses, fail on network, RequestTask.abort.
// CA trust is local to each injected https.request; global trust is unchanged.
const wx = { request(options) {
  assert.equal(this, wx);
  const url = new URL(options.url);
  assert.equal(url.hostname, 'localhost');
  assert.equal(url.port, String(port));
  const event = { path: url.pathname, aborts: 0, successes: 0, failures: 0 };
  transportEvents.push(event);
  const req = https.request(url, { method: options.method, headers: options.header, ca: cert, family: 4 }, response => {
    const chunks = [];
    response.on('data', chunk => chunks.push(chunk));
    response.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf8');
      let data = text;
      if (options.dataType === 'json') { try { data = JSON.parse(text); } catch (_) {} }
      event.successes++;
      options.success({ statusCode: response.statusCode, data, header: response.headers });
    });
  });
  req.on('error', error => { event.failures++; options.fail({ errMsg: error.message }); });
  req.setTimeout(options.timeout, () => req.destroy(new Error('request:fail timeout')));
  req.end(JSON.stringify(options.data));
  return { abort() { event.aborts++; req.destroy(new Error('request:fail abort')); } };
} };
const defaults = { wx, baseUrl, scope: { appId: 'synthetic-app', projectId: 'synthetic-project', userId: 'owner-a', assistantId: 'synthetic-coach' }, getAuthorization: () => 'Bearer synthetic-test-only', isCurrent: () => true, timeoutMs: 1000 };
const newClient = overrides => createAIUIEverosClient({ ...defaults, ...overrides });
const report = { service: 'local HTTPS mock EverOS v2; not real EverOS', tls: { host: 'localhost', global_override: false, local_ca_only: true }, scenarios: [], actual_requests: 0 };
const record = name => report.scenarios.push({ name, outcome: 'PASS' });
async function waitForQuery(query) {
  const deadline = Date.now() + 1000;
  while (records.at(-1)?.payload.query !== query) {
    assert.ok(Date.now() < deadline, 'mock server did not receive the expected request');
    await new Promise(resolve => setTimeout(resolve, 2));
  }
}

test('test CA is not globally trusted', async () => {
  await assert.rejects(new Promise((resolve, reject) => { const req = https.get(baseUrl, { family: 4 }, resolve); req.on('error', reject); }), /self-signed certificate/);
  assert.equal(process.env.NODE_TLS_REJECT_UNAUTHORIZED, undefined);
  record('Default TLS trust rejects test self-signed certificate');
});
test('real TLS add -> flush -> search returns synthetic extracted content', async () => {
  const c = newClient();
  const before = records.length;
  const add = await c.add({ sessionId: 'synthetic-session', messages: [{ role: 'user', timestamp: Date.now(), content: 'synthetic preference: concise coaching' }] });
  assert.equal(add.httpStatus, 200); assert.equal(add.data.status, 'accumulated');
  const flush = await c.flush({ sessionId: 'synthetic-session' });
  assert.equal(flush.data.status, 'extracted');
  const found = await c.search({ query: 'synthetic preference', topK: 3 });
  assert.deepEqual(found.data.results, [{ content: 'synthetic preference: concise coaching' }]);
  assert.deepEqual(records.slice(before).map(x => x.path), ['/api/v2/memory/add', '/api/v2/memory/flush', '/api/v2/memory/search']);
  for (const entry of records.slice(before)) { assert.equal(entry.payload.app_id, 'synthetic-app'); assert.equal(entry.payload.project_id, 'synthetic-project'); }
  assert.equal(records[before].payload.messages[0].sender_id, 'owner-a');
  assert.equal(records[before].payload.async_mode, false);
  c.dispose(); record('add -> flush -> search over TCP/TLS with v2 JSON payloads');
});
test('HTTP 202 remains queued and never auto-flushes/retries', async () => {
  const c = newClient(); const before = records.length;
  const result = await c.add({ sessionId: 'queued-session', messages: [{ role: 'assistant', timestamp: Date.now(), content: 'synthetic response' }] });
  assert.equal(result.httpStatus, 202); assert.equal(result.data.status, 'queued'); assert.ok(result.requestId.startsWith('mock-'));
  assert.equal(records.length, before + 1); c.dispose(); record('202 receipt preserved; no implicit flush or retry');
});
test('HTTP 401 surfaces auth error without retry', async () => {
  const c = newClient({ getAuthorization: () => 'Bearer reject-synthetic' }); const before = records.length;
  await assert.rejects(c.search({ query: 'synthetic' }), /^Error: http_401$/);
  assert.equal(records.length, before + 1); c.dispose(); record('401 rejects once');
});
test('HTTP 429 exposes Retry-After without scheduling a request', async () => {
  const c = newClient(); const before = records.length;
  await assert.rejects(c.search({ query: 'rate-limited' }), error => error.message === 'http_429' && error.retryAfterMs === 2000);
  assert.equal(records.length, before + 1); c.dispose(); record('429 retry delay exposed; no auto-retry');
});
test('connection reset maps to network outcome unknown', async () => {
  const c = newClient(); const before = records.length;
  await assert.rejects(c.search({ query: 'drop-connection' }), /^Error: network_outcome_unknown$/);
  assert.equal(records.length, before + 1); c.dispose(); record('TCP connection reset rejects with unknown outcome');
});
test('unresponsive real socket expires and aborts exactly once', async () => {
  const c = newClient({ timeoutMs: 80 }); const before = transportEvents.length;
  await assert.rejects(c.search({ query: 'never-respond' }), /^Error: timeout_outcome_unknown$/);
  assert.equal(transportEvents[before].aborts, 1);
  c.dispose(); record('SDK timeout bounds real hanging network request and aborts once');
});
test('owner change suppresses late old data while new owner succeeds', async () => {
  let epoch = 1;
  const old = newClient({ isCurrent: () => epoch === 1 });
  const pending = old.search({ query: 'delay-owner-change' });
  const rejected = assert.rejects(pending, /^Error: stale_owner$/);
  // The server receives the old request before the owner change.
  await waitForQuery('delay-owner-change');
  epoch = 2;
  const next = newClient({ scope: { ...defaults.scope, userId: 'owner-b' }, isCurrent: () => epoch === 2 });
  const result = await next.search({ query: 'synthetic preference' });
  assert.equal(result.data.owner, 'owner-b'); assert.deepEqual(result.data.results, []);
  await rejected;
  const before = records.length;
  await assert.rejects(old.flush({ sessionId: 'synthetic-session' }), /^Error: stale_owner$/);
  assert.equal(records.length, before); old.dispose(); next.dispose(); record('Owner epoch switch rejects stale response; new owner remains isolated');
});
test('dispose cancels sent operation and prevents later dispatch', async () => {
  const c = newClient(); const before = transportEvents.length;
  const pending = c.search({ query: 'delay-dispose' });
  const rejected = assert.rejects(pending, /^Error: client_disposed_outcome_unknown$/);
  await waitForQuery('delay-dispose');
  c.dispose(); c.dispose(); await rejected;
  assert.equal(transportEvents[before].aborts, 1);
  const count = transportEvents.length;
  await assert.rejects(c.search({ query: 'synthetic' }), /^Error: client_disposed$/);
  assert.equal(transportEvents.length, count); record('Dispose aborts pending request once and blocks future dispatch');
});
after(async () => {
  report.actual_requests = records.length;
  report.transport_requests = transportEvents.length;
  report.transport_events = transportEvents;
  report.request_paths = records.map(x => x.path);
  report.synthetic_data_only = true;
  report.real_everos_credentials_used = false;
  for (const socket of sockets) socket.destroy();
  await new Promise(resolve => server.close(resolve));
  await rm(tlsDirectory, { recursive: true, force: true });
  console.log('LOCAL_HTTPS_VERIFICATION ' + JSON.stringify(report));
});
