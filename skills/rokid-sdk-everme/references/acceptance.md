# Rokid SDK 接入 EverMe：验收矩阵

将项目实际命令、版本和可观察结果填入交付记录。下面是要验证的行为，不是已通过的结果；既有项目的历史测试也不能替代新接入。

## 先做隔离测试

| 场景 | 通过标准 |
|---|---|
| 目标开发路径 | 记录 Rokid 型号、固件、眼镜端 Android 工程、实际 SDK/版本与运行位置；CXR-L 手机库不能冒称眼镜端库；所需 SDK 通道实际存在且有设备证据 |
| PKCE | RFC 7636 S256 向量正确；verifier 长度/字符验证；每次新 state/verifier |
| 回调重放 | 过期、错误 state、二次回调不能触发第二次 token 交换 |
| 可信浏览器与眼镜绑定 | 扫码打开连接页后先登录同一业务 owner，OAuth 发起前绑定该浏览器 session 与原眼镜 attempt；错误 owner、原眼镜会话过期、解绑或换代拒绝；成功仅允许原 owner 的眼镜查看连接状态 |
| 发起端绑定 | 把 A 的合法 authorization_url 转给另一浏览器/设备并完成模拟授权，不能激活 A 的连接；未匹配原可信浏览器 session 或原应用 attempt 的回程被拒绝；仅扫码、匿名 cookie 或轮询不能激活 |
| App Link 完成（采用时） | 先证实目标设备的外部浏览器与域关联/签名验证可用，不支持时不能启用此分支。handle 为后端独立 CSPRNG 产生的至少 128 位随机值，不能由发起者已知信息推导；只绑定同一 pending grant。未完成握手的 grant 不能读写；轮询取不到 handle；错误 owner/原会话/眼镜绑定代次/attempt 秘密/handle、重复完成、过期均拒绝；原应用正常握手只激活一次；超时或取消持久排队撤销 pending grant |
| DCR | 先验证各环境精确 callback 白名单与约定固定 client_name；同环境复用已持久 client_id；不同环境隔离；结果未知不循环注册 |
| 实际 scope | 支持读权限子集；省略 scope 依已确认默认值处理；token 响应减权后同步更新读写资格；无 mem:write 不允许写入，不能用申请集或 discovery 支持集补齐 |
| refresh 并发 | 多 worker 只 claim 一次轮换；成功原子更新；超时与重启不重复使用旧 token |
| 晚到 token | 换号/断开/删除账号期间返回的 token 不恢复连接，保留必要撤销任务 |
| 账号隔离 | 请求体伪造 owner 无效；授权 A 的 attempt、队列或 MCP session 不可被 B 使用 |
| 同意/绑定变化 | 网络期间撤同意、换绑、重新授权后，旧记忆不进入模型或 HUD，旧 pending 不能发送 |
| MCP JSON/SSE | 正确匹配 request ID，支持多行 SSE；错误、超大响应、超时和未知 schema 明确失败 |
| MCP 鉴权错误 | 分别处理 401/30301 无效、401/30302 已撤、401/30305 过期和 403/30303 缺 scope；只有过期走 refresh，不触发眼镜/伴随应用自身登出 |
| MCP session | 有会话 ID 时后续携带；404 重新初始化；新会话不重放未知写入 |
| 工具限制 | 拒绝未知工具、任意 upstream URL/header、无权限写入和 schema 不符参数 |
| 记忆回执 | accepted/saved 不直接显示 Profile 已更新；no_extraction 不宣称记住、不自动重写；未提取 transcript 不当确认事实 |
| outbox | 并发不重复 claim；保存与入队同事务；进程崩溃后 sending 变 unknown，无自动重放 |
| revoke | 网络/503 可持久恢复；连接立即禁用；删除账号后任务仍存在；确认完成的 token 清除待撤秘密，refresh 结果未知的授权链不能仅凭旧 token 的 200 关闭追踪 |
| 眼镜端 Android | 外部浏览器缺失时可显示受控连接入口，不能假定 Custom Tabs/App Link 存在；授权拒绝/离线/返回刷新/换号时状态正确；回调不泄漏凭据 |
| 可选伴随端 | 仅按实际 SDK 与业务需要引入；原伴随端 session、业务 owner 与眼镜绑定代次一致，换绑后旧授权回程/消息/记忆结果被拒绝 |
| 日志 | 测试凭据标记不会出现在日志、crash、截图、HTTP 访问日志及提交内容中 |

PKCE 标准向量（公开测试数据，不是凭据）：

```text
verifier:  dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
challenge: E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
```

## 再做已授权测试账号联调

按当前任务授权使用隔离账号，不将分享 Skill 当作自动授权真实用户数据上传。记录端点来源、日期、协议版本、schema 摘要哈希及去秘密的结果：

1. 公开 discovery 与配置一致，各环境精确回调白名单与固定 client_name 已完成供应方登记，回调 HTTPS 可达且路由正确。
2. 用户完成授权及原可信浏览器/原应用回程验证，眼镜查询后确认正确业务 owner 的连接和实际授权 scope；单独验证完成前不能读写。二维码打开的是受控业务连接页，不是 EverMe Device Grant。
3. `initialize`、`tools/list`、最小记忆读取与搜索成功；schema 与适配器一致。
4. 写入用户同意的合成事实或短对话，检查 HTTP、JSON-RPC、`isError` 和业务回执；按服务处理时延做检索回读，分别记录“接收”和“可检索”。
5. 在允许的测试范围内验证 refresh 轮换、断开与 revoke；断开后不能再读取/写入。
6. 验证眼镜应用账号切换、进程重启和设备解绑；采用伴随端时覆盖其会话与绑定变化；旧云结果不能显示给新 owner。
7. 在指定 Rokid 型号、固件、实际 SDK 与眼镜端 APK 构建上完成语音→记忆→模型→TTS/HUD 流程。记录眼镜与后端的实际网络通道；没有设备则明确保持实机项未验证。

不要为测试撤销或重放生产用户的现有授权链。外部失败有明确错误就分类处理；相同方式连续失败且没有新证据时，换方式或带具体缺口交接，不用无穷重试补验收。

## 交付回执格式

```text
实现：commit / 涉及模块
离线测试：实际命令、通过数、失败项
构建：variant、versionName/versionCode、产物 SHA-256
部署：环境、版本、健康检查与 callback 路由
OAuth：测试账号已脱敏、授权/refresh/revoke 分项结果
MCP：协议/schema、读取/接收/可检索分别记录
Rokid SDK 与眼镜：设备型号、固件、SDK版本/运行位置、眼镜端APK构建、测试过程及观察
可选伴随端：采用理由、SDK通道、应用构建、同owner与眼镜绑定证据
仍未验证：具体项目、原因、下一步所需输入
```

如任务只要求 Skill/方案，验证其结构、来源、示例和边界即可；不得写成 Rokid SDK 通道、眼镜端 APK 或实机已验收。
