# Rokid × EverMind

<p>
  <img src="docs/assets/brand/rokid-logo-black-on-white.svg" height="64" alt="Rokid" />
  &nbsp;&nbsp;
  <img src="docs/assets/brand/evermind-logo.png" height="64" alt="EverMind" />
</p>

面向 Rokid 眼镜开发者的长期记忆接入方案：**AIUI JavaScript SDK** 与 **Rokid SDK × EverMe Skill**。

Reusable memory integration for Rokid glasses: an **AIUI JavaScript SDK** and an **EverMe development Skill for Rokid SDK apps**.

Rokidグラス開発向けの **AIUI JavaScript SDK** と **Rokid SDK用EverMe連携Skill**。

**图文入门 / Illustrated guides / 図解ガイド：** [简体中文](docs/rokid-memory-skills.md) · [English](docs/rokid-memory-skills.en.md) · [日本語](docs/rokid-memory-skills.ja.md)

![选择 AIUI JS SDK 或 Rokid SDK 接入路线](docs/assets/blue-ink/zh/01-route-v1.png)

## 选择开发路线

| 路线 | 直接入口 | 提供什么 |
| --- | --- | --- |
| **AIUI JavaScript SDK → EverOS** | [SDK 与用法](skills/aiui-everos-direct/sdk/README.md) · [下载 v0.1.0](https://github.com/EasonZhu1997/Rokid-EverMind-Skills/releases/tag/aiui-everos-sdk-v0.1.0) | 复用 `wx.request` 适配器、类型与 `add/search/flush/dispose`，统一请求、身份检查、超时和清理 |
| **Rokid SDK → EverMe OAuth MCP** | [Rokid SDK Skill](skills/rokid-sdk-everme/SKILL.md) | 为眼镜端应用接线：自有后端、用户授权、MCP 工具发现、账号隔离、刷新与解绑 |
| AIUI 开发指导（可选） | [AIUI Skill](skills/aiui-everos-direct/SKILL.md) | 帮助编程助手配置和集成现成 SDK，不在每个项目重新生成 HTTP client |

Rokid SDK 路线按目标型号区分眼镜端 Android 与手机侧 SDK。OAuth 浏览器、App Link 和跨设备账号绑定均需核对实际能力；详见图文指南。本项目提供的是社区接入实现与开发指导，不代表官方 SDK 内置 EverMe。

## AIUI：几步接入

1. [下载 SDK](https://github.com/EasonZhu1997/Rokid-EverMind-Skills/releases/tag/aiui-everos-sdk-v0.1.0)，或复制整个 `skills/aiui-everos-direct/sdk/` 到项目 `lib/everos-sdk/`。
2. 提供自己的服务配置、已验证用户身份、运行时认证回调与生命周期回调。
3. 导入同一份实现：

```js
import wx from 'wx';
import { createAIUIEverosClient } from '../../lib/everos-sdk/index.js';

// memoryConfig is supplied by the app; see the SDK README.
const memory = createAIUIEverosClient({ wx, ...memoryConfig });
const result = await memory.search({ query: 'preferred coaching style' });
// Call memory.dispose() when this owner/session/page ends.
```

完整配置、状态与错误处理见 [SDK README](skills/aiui-everos-direct/sdk/README.md)。公开 AIX 不内置共享 Cloud key；多用户应用通过自己的认证网关固定用户范围。

## Rokid SDK：交给编程助手实施

下载仓库后，将整个 `skills/rokid-sdk-everme/` 目录交给支持 Skill 的助手，保留 references、agents 和 LICENSE：

```text
使用 $rokid-sdk-everme，为我的 Rokid SDK 眼镜应用接入 EverMe。
先读取现有工程并核对目标型号、SDK、登录和授权浏览器能力。
沿用业务账号和后端，验证 OAuth、MCP、账号切换、撤销和未知写入结果。
先完成本地实现与测试，分别报告服务联调和眼镜实测证据。
```

本路线是一份实施 Skill，未附通用 Android 二进制 SDK 或可直接安装的 APK。具体 Rokid SDK 由开发者按 [官方入口](https://developerdoc.rokid.com/sdk?lang=en) 选择。

## 有源码可参考

[AIUI Sport](https://github.com/EasonZhu1997/AIUI-Sports-Agents) 提供跑步、骑行与室内划船三个公开 AIUI 工程。三语指南标出了记忆适配边界和新 SDK 的拟接线；公开快照尚未迁移到此 SDK。

## 已验证到哪一步

- SDK 发布包的 30 项测试与严格类型检查通过。
- 本机真实 HTTPS 的 9 项场景通过，覆盖读写、202、401、429、断流、超时、切账号和清理。
- 官方 AIX CLI 0.8.2 打包、Ink Web 0.19.1 / QuickJS 实际导入与初始化通过。
- 真实 EverOS 服务、EverMe OAuth 账号联调和物理眼镜尚未验证。

详见 [验证记录与复验方法](docs/validation.md)。本地测试命令：

```sh
node --test skills/aiui-everos-direct/scripts/*.test.mjs
```

## 来源、插图与许可

接口设计参考 EverMind 官方 Skill 和文档，逐项固定版本来源见各 Skill 的 references。18 张中英日插图用蓝墨纸绘重新生成：暖白纸铺满画布，无桌面、深色边框与拍照阴影。[插图来源与提示词](docs/assets/blue-ink/README.md)。

原创 SDK 与说明采用 [MIT](LICENSE)。Rokid / EverMind Logo 保持原始比例与独立留白，**不在 MIT 授权范围内**；参见 [品牌来源](docs/assets/brand/README.md) 和 [第三方说明](THIRD_PARTY_NOTICES.md)。本项目为 Eason（[EasonZhu1997](https://github.com/EasonZhu1997)）维护的社区项目，不表示官方认证或商业合作背书。
