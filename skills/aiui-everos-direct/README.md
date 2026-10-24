# AIUI × EverOS：独立接入 Skill

为 AI 编程助手提供 EverOS v2 接入流程，并随包携带 **JavaScript SDK 0.1.0**。安装 Skill 后，助手按当前工程接认证、身份与生命周期；眼镜运行时复用 SDK。

**[助手入口：SKILL.md](SKILL.md) · [接入方案](references/integration-plan.md) · [SDK 用法](sdk/README.md)**

## 安装完整目录

参照官方 AIUI 开发 Skill 的目录安装方式，在你的项目中运行：

```sh
npx skills add https://github.com/EasonZhu1997/Rokid-EverMind-Skills/tree/main/skills/aiui-everos-direct
```

交互选择你的编程助手。该 CLI 默认安装到当前项目；当前版本需要 Node.js 22.20+。完整 Skill ZIP 见 [独立接入包](https://github.com/EasonZhu1997/Rokid-EverMind-Skills/releases/tag/skills-2026.10.25)。也可下载仓库，将整个 `skills/aiui-everos-direct/` 放到宿主支持的 Skill 目录，或直接让助手读取此目录的 `SKILL.md`。

不要只复制一个 `SKILL.md`，也不需要安装仓库中的另一个 Skill。已有同名 Skill 时先比较版本，再按宿主方式更新，不静默覆盖。

Git 克隆受限时，可用固定日期的完整 ZIP 为 Codex 安装到当前项目（`.agents/skills/`）：

```sh
npx skills@1.7.4 add https://github.com/EasonZhu1997/Rokid-EverMind-Skills/releases/download/skills-2026.10.25/aiui-everos-direct.zip -a codex --copy -y
```

```text
aiui-everos-direct/
├── SKILL.md                    助手入口与按需参考路由
├── README.md                   人读安装说明
├── references/integration-plan.md  接入方案
├── references/                 部署、v2 API、AIUI 适配、验收
├── sdk/                        唯一 JS 实现、类型、版本与许可
├── assets/everos-client.mjs     旧入口的兼容再导出
├── scripts/                    合成离线测试
├── agents/openai.yaml          宿主显示与调用提示
└── LICENSE
```

## 交给助手的任务

```text
使用 $aiui-everos-direct，为我的 AIUI 工程接入 EverOS。
先读取现有项目，确认 Cloud 或受保护自建 v2、宿主版本和业务身份。
按 references/integration-plan.md 接线，复用 sdk/ 的唯一 JavaScript 实现，
只编写应用配置、身份与生命周期接线，不重新生成 HTTP client。
运行相应本地检查，单独列出实服与物理眼镜尚未验证的项目。
```

## 安装 Skill 后还要做什么

1. 准备目标 AIUI 工程、眼镜可达 HTTPS 服务和业务用户隔离；凭据走安全运行时配置。
2. 让助手读 [接入方案](references/integration-plan.md)，将完整 `sdk/` 放进应用 `lib/everos-sdk/` 并直接相对路径导入 `index.js`。
3. 从 `search → 回答 → 获准 add` 开始，按需要接 `flush` 和 `dispose`，保留现有业务行为。
4. 从此 Skill 目录运行 `node --test scripts/*.test.mjs`；应用构建、实服和真机再按 [验收](references/verification.md) 分别确认。

安装 Skill 不会把 SDK 自动注入应用，不会注册云账号、部署后端、写入记忆或发布 AIX。多用户应用共享上游主密钥保留在服务端；SDK 不代替登录、网关或持久队列。

## 可选图文与版本说明

[简体中文](https://github.com/EasonZhu1997/Rokid-EverMind-Skills/blob/main/docs/rokid-memory-skills.md) · [English](https://github.com/EasonZhu1997/Rokid-EverMind-Skills/blob/main/docs/rokid-memory-skills.en.md) · [日本語](https://github.com/EasonZhu1997/Rokid-EverMind-Skills/blob/main/docs/rokid-memory-skills.ja.md) · [Français](https://github.com/EasonZhu1997/Rokid-EverMind-Skills/blob/main/docs/rokid-memory-skills.fr.md)

这些图文可选；复制本目录后，实施所需参考、SDK 和测试均在包内。`sdk/` 保留原已发布 v0.1.0 的五个文件与历史来源元数据；其中的旧 APK 称呼对应当前独立的 `rokid-sdk-everme` 路线。新的 Skill 包更新接入文档，不修改或重发 SDK 版本。

社区接入方案，由上海方披萨软件科技有限公司 / Shanghai Fun Pizza Software Technology Co., Ltd. 分享维护；不是 Rokid 或 EverMind 官方认证。原创说明与实现采用同目录 [MIT](LICENSE)，第三方名称与接口保留各自权利。
