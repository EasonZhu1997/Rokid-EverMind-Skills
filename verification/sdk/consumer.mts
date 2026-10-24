import {
  createAIUIEverosClient, createEverosClient, EVEROS_SDK_VERSION,
  type AIUIRequestOptions, type EverosClient, type EverosResult, type EverosError,
} from '../../skills/aiui-everos-direct/sdk/index.js';

const wx = {
  request(options: AIUIRequestOptions) {
    options.success({ statusCode: 202, data: { data: { status: 'queued' } } });
    return { abort() {} };
  },
};
const configuration = {
  baseUrl: 'https://memory.example.com',
  scope: { appId: 'demo', projectId: 'test', userId: 'owner', assistantId: 'assistant' },
  getAuthorization: () => 'Bearer synthetic-only',
  isCurrent: () => true,
};
const version: '0.1.0' = EVEROS_SDK_VERSION;
const client: EverosClient = createAIUIEverosClient({ ...configuration, wx });
const result: EverosResult = await client.search({ query: 'preference', method: 'hybrid', topK: 3 });
const status: 200 | 202 = result.httpStatus;
const unknownPayload: unknown = result.data.status;
await client.add({ sessionId: 'test', messages: [
  { role: 'user', content: 'Synthetic fact', timestamp: Date.now() },
] });
await client.flush({ sessionId: 'test' });
client.dispose();
const manual = createEverosClient({ ...configuration, request: wx.request });
manual.dispose();

if (false) {
  // @ts-expect-error asynchronous credential suppliers are not supported
  createAIUIEverosClient({ ...configuration, wx, getAuthorization: async () => 'token' });
  // @ts-expect-error only user and assistant message roles are supported
  client.add({ sessionId: 'test', messages: [{ role: 'tool', timestamp: Date.now(), content: 'x' }] });
  // @ts-expect-error search methods must be an explicit supported enum value
  client.search({ query: 'x', method: 'invented' });
  // @ts-expect-error the wx request adapter is required
  createAIUIEverosClient(configuration);
  const error = new Error('http_429') as EverosError;
  const delay: number | undefined = error.retryAfterMs;
}
