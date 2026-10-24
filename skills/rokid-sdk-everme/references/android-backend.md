# Rokid SDK、眼镜端 Android 与业务后端

## 组件职责

```text
Rokid 眼镜端 Android 应用（目标型号实际支持的 Rokid 开发路径）
        │ 自身业务登录凭据、受限业务请求
        ▼
自有后端 / MemoryGateway  ←  同一 owner 的可信浏览器会话
├── 业务账号、同意、眼镜绑定     （可在手机/桌面完成 OAuth 授权）
├── OAuth 加密存储与撤销任务
├── 受限 MCP 适配器
└── 同一 owner 的持久 outbox
        │ 用户授权的 EverMe token
        ▼
EverMe 托管 OAuth MCP

可选：已绑定伴随应用 ← 目标 SDK 已验证的通信通道 → 眼镜应用
```

眼镜应用处理自身交互，并按业务需要连接后端。EverMe 不负责建立蓝牙连接、麦克风采集、TTS、传感器同步或 HUD 绘制；逐项验证对应 SDK 与实体设备，不能由 OAuth 成功推断它们可用。

先按 [Rokid 官方 SDK 总览](https://developerdoc.rokid.com/sdk?lang=en) 选择运行位置：公开眼镜裸机路径是 YodaOS-Sprite 上的独立 Android 应用；CXR-L 运行在手机并依赖 Rokid AI App，CXR-M 为商务手机 SDK，可配合眼镜端 CXR-S。需要这些通信库时，使用目标型号与已获取版本的真实依赖和方法；本方案不定义 Rokid 硬件 API。这里的 EverMe 授权和业务后端是接入方实现。

Rokid 官方总览并未承诺眼镜一定有可用的系统浏览器、Custom Tabs 或已验证 App Link。AOSP/Android API 等级也不能证明这些组件存在。默认把授权交互放到与同一 owner 绑定的可信外部浏览器；若选用眼镜自身浏览器/应用回程，先检查实际处理器、域名验证与回调可达性，再对指定型号/固件做实测。伴随端仅在实际 SDK、联网或交互需要时采用，并单独验证业务 owner、眼镜绑定与传输通道。

## 业务 API 示例（由接入方实现，并非 EverMe 官方路由）

下表业务路由要求自身登录认证；owner 从认证上下文取值，不信任客户端提交的 user_id。下面路径可按既有架构调整：

| 方法与路径 | 建议返回/行为 |
|---|---|
| `GET /integrations/everme` | 状态、读写资格、授权可用性、当前 owner 的队列计数 |
| `POST /integrations/everme/authorize` | 确认产品披露版本并登记原眼镜 owner/会话后，返回受控连接页 URL 与不含秘密的 attempt_id；可信浏览器分支在浏览器身份校验后才建立 OAuth 重定向 |
| `GET /integrations/everme/attempts/{id}` | 只读本人授权尝试状态 |
| `POST /integrations/everme/complete` | 仅采用已验证 App Link 方案时，验证当前 owner、原应用 attempt 秘密与一次性 completion_handle 后激活 |
| `DELETE /integrations/everme` | 立即停用并排队 revoke |
| `GET /integrations/everme/tools` | 返回经过 allowlist 的工具名与 inputSchema |
| `POST /integrations/everme/context`、`/search`、`/save-fact`、`/save-turn` | 固定映射一个工具，后端检查授权、同意及参数 |

浏览器 OAuth callback 是另一条受控入口，不能依赖眼镜/伴随应用的 Authorization header。它只接受已登记的精确 HTTPS 回调，通过一次性 state、PKCE 与持久 attempt 的 owner/环境/授权代次关联验证；query 中的 owner、user_id 或登录标记不能替换该关联。还需完成下面的发起端回程验证，之后眼镜应用才能查询到已激活的连接。

### 授权回程与激活

选择已有架构能支持的一种绑定方式，不能只靠回调后轮询：

- **受信浏览器 session（默认）**：眼镜发起的连接页可以通过二维码或受控链接在手机/桌面外部浏览器打开；连接页要求业务登录，验证浏览器 owner 与原眼镜 attempt 的 owner/有效绑定一致，且原眼镜会话仍有效，然后将该浏览器登录 session 与 attempt 一次性关联，再发起 OAuth。callback 必须再次匹配原浏览器 session、owner 与 attempt；成功后眼镜仅以自身业务身份查询本人状态。转发的连接页/授权 URL、扫码本身、新建匿名 cookie 或 `connected=true` 都不证明绑定成立。这是后端授权页流程，不是声称 EverMe 支持 OAuth Device Grant。
- **已验证 Android App Link（条件方案）**：仅当授权所在设备已验证外部浏览器与本应用 App Link 可用时采用；可以是具备这些能力的眼镜应用，或经授权并已绑定的伴随应用。原应用为本次 attempt 生成随机秘密，仅将其摘要绑定到后端 attempt，并在本机按 owner/session generation 保存秘密。伴随端另绑定其会话及眼镜绑定代次。后端 callback 换码后加密保管 grant，状态为 `completion_pending`，禁止 MCP 读取、写入及后台同步。仅通过已验证、由本产品控制的 App Link 将短期一次性 `completion_handle` 回传同一原应用；状态接口、轮询、普通回调页面和日志都不能提供 handle。原应用必须有匹配的原本地 attempt，随后以当前业务登录身份提交 attempt_id、原秘密与 handle；后端原子验证 owner、原会话/眼镜绑定代次、授权代次、秘密摘要、handle、有效期及未消费状态后才激活。其他设备收到链接、换号或原 attempt 丢失均不能完成。App Link 无法验证或无法交给原应用时保持未激活；切换到可信浏览器方案须启动新的授权 attempt，不能回退成凭轮询确认。

待完成 grant 与 handle 必须有短期失效时间；超时、取消、退出或账号/授权变化时禁用并清除 handle，持久排队撤销 grant，按撤销结果保留追踪。EverMe callback code、token 和 PKCE verifier 不经过 App Link，也不交给眼镜/伴随应用。这里的 App Link 完成握手是接入方保护业务账号的设计，不是 EverMe 新增的协议端点。

`completion_handle` 必须由后端独立使用密码学安全随机数生成器产生，至少包含 128 位随机熵；只存摘要并绑定同一 attempt 的 pending grant。不能使用 attempt_id、state、原应用秘密或它们的可计算派生值代替，否则发起者无需收到回程也能自行完成。原应用 attempt 秘密同样使用密码学安全随机数。App Link 的 host/path 由可信配置固定，不接收请求中的任意 return URL。

建议产品状态：`disconnected`、`authorizing`、`completion_pending`、`connected`、`reauthorization_required`、`revocation_pending`、`unavailable`。内部 `refreshing` 状态可映射为暂不可操作。`connected` 说明回程验证后授权已激活；`read_active`/`write_active` 由实际授权 scope 与当前产品同意共同决定；`synced` 说明收到本次约定的写入回执，各自不要混用。

刷新结果未知且无法确认整条远程授权已撤销时，另保留 `revocation_unconfirmed`；界面明确本应用已停用、远程撤授权仍待确认。不要把这种状态渲染为“全部撤销成功”。

后端的 OAuth 错误不能伪装成本应用登录失效：例如用业务错误码/409 提示重新连接 EverMe，只有自己的登录凭据失效才触发眼镜/伴随应用登出。生产与测试环境由可信服务器配置选择，不由请求体传入任意环境。

## Rokid SDK 眼镜端连接界面

1. 披露哪些数据会发送给 EverMe，以及相关片段是否进入另一个模型；连接操作不能默默打开独立的数据共享许可。
2. 通过业务 API 申请受控连接页，URL 的 HTTPS host/port/path 来自可信业务配置；二维码/链接只承载短期、限用途的入口，不包含业务登录 token 或 EverMe 凭据。真正 OAuth 端点另按受信 discovery 校验，拒绝 userinfo、fragment、控制字符和未许可重定向。
3. 默认显示二维码/受控入口，由手机或桌面可信浏览器完成前述同 owner 登录和授权。若目标眼镜具备并实测通过外部浏览器能力，也可在眼镜打开；打开页面本身不表示授权成功。不要使用内嵌 WebView 收集 EverMe 登录信息。
4. 采用 App Link 条件方案时，先验证目标设备的浏览器处理器、域关联、签名和 App Link 路由，再以原应用的匹配 attempt 完成握手；不相信链接里的 `connected=true`。`onResume` 或眼镜状态轮询只查询后端，不能代替任何必需的完成握手。
5. 查询和页面异步回调须检查发起操作时的 owner 和本地 session generation；换号、退出或页面销毁后丢弃旧响应。缺字段/离线时显示待确认，不默认成功。

以下是与框架无关的伪代码，需要接到实际 API、生命周期和主线程：

```text
// 以下均为业务伪代码，不是 Rokid SDK API；两个分支只选择一个
ticket = snapshot(currentOwner, loginGeneration, glassesBindingGeneration)
if configuredMode == trustedBrowser:
    result = backend.beginTrustedBrowserConnection(disclosureVersion)
    if ticket != currentOwnerSnapshot(): discard result
    validateBusinessConnectUrl(result.connect_url)
    showConnectionQrOrLink(result.connect_url)
    // 浏览器在 OAuth 发起前登录同一 owner，后端绑定原浏览器 session + attempt
    // callback 核对同一 session、owner、state、PKCE 和原眼镜绑定后才激活
else if configuredMode == appLink and targetCapabilitiesAlreadyVerified:
    attemptSecret = cryptographicallyRandomSecret()
    result = backend.beginVerifiedAppLinkConnection(disclosureVersion, hash(attemptSecret))
    if ticket != currentOwnerSnapshot(): discard result
    persistLocalAttempt(result.attempt_id, ticket, attemptSecret)
    validateAuthorizationUrlAgainstTrustedDiscovery(result.authorization_url)
    openVerifiedExternalBrowser(result.authorization_url)
else:
    showUnavailableWithoutStartingOAuth()

onVerifiedAppLink(attemptId, completionHandle):
    attempt = requireMatchingLocalAttempt(attemptId, currentOwnerSnapshot())
    backend.complete(attempt.id, attempt.secret, completionHandle)
    // 后端使用当前登录身份核 owner，原子验证后才允许读写

onResumeOrBoundedStatusPoll:
    status = backend.status() // 后端从本次业务登录认证取 owner
    if ticket == currentOwnerSnapshot(): render(status)
```

## 服务端隔离与队列

建议最小记录：

| 记录 | 关键字段 |
|---|---|
| OAuth client | 环境、issuer、client_id、精确 callback、registration 状态 |
| Connection | owner、client、authorization_id、revision、加密 grant、实际授权 scope、有效期、状态 |
| Attempt | state 摘要、owner、原眼镜/应用会话与绑定代次、授权代次、加密 verifier、原可信浏览器 session 或原应用秘密摘要、条件方案的完成 handle 摘要、失效时间、一次性 claim/完成状态 |
| Memory outbox | owner、环境、授权代次、同意版本、源记录 ID、payload hash、状态、attempts、lease |
| Revoke job | client 与授权关联、加密待撤 token、重试时间；不随用户级联删除 |

加密密钥通过部署环境的秘密管理注入，与业务 JWT 密钥分离。密文同时绑定 owner、environment、client_id 和 authorization_id；解密后也验证这些上下文，避免记录被错配。为每个异步任务保留发起时身份，不能在发送时重新“找当前账号”。

```text
snapshot = (owner, environment, authorization_id, consent_version, device_generation)
assertStillAllowed(snapshot)
memory = readMcpWithBoundedDeadline()
assertStillAllowed(snapshot)
context = boundedUntrustedMemory(memory)
assertStillAllowed(snapshot)
return context to model / current owner's glasses
```

将本地对话保存和 outbox 入队放在同一事务；发送前用原子 claim 防止两个 worker 同时发：

```text
pending（从未发送）→ sending（claim 已持久化）→ synced（约定成功回执）
                                     └→ unknown（可能已提交、无可靠回执）
pending → canceled（owner、许可、授权代次已变化）
```

只有从未发送的 `pending` 可以重启后继续；崩溃遗留的 `sending` 进入 `unknown`，不重新领取。当地幂等键防重复入队，不证明上游 exactly-once。若未来上游提供正式幂等键/查询回执合同，再有针对性地加入安全重试。

收到读取结果后再检查权限；发送写入前再检查权限。已发出的 HTTP 请求无法靠本地取消保证远端未执行，UI 和记录必须保留这一不确定性。未知写入不能转给旧数据库、共享凭据或新账号重发。

## 日志与运行行为

日志仅保留必要 request ID、阶段、耗时、状态和脱敏错误码。不要写入 token、verifier、code、state、attempt 秘密、completion_handle、Authorization、记忆正文、查询全文、用户对话或可泄露秘密的完整 URL。网络读取设截止预算；超时保留同 owner 的本地能力，不阻塞眼镜的正常运动流程。
