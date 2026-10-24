# Rokid SDK · EverMe 接入 Skill

面向 **Rokid 眼镜端 Android 应用 → 自有业务后端 → EverMe OAuth MCP** 的社区接入 Skill，帮助开发助手先确定真实 SDK 与运行位置，再实现账号绑定、授权回程、记忆调用和验证。

这是开发指导与参考合同，**不是 Rokid 官方发布的二进制 SDK，也不是可直接部署的后端**。眼镜的语音、HUD、传感器与通信能力仍由所选官方开发路径和现有工程提供。

## 获取与安装

**完整的 `rokid-sdk-everme/` 文件夹才是安装单元。** `SKILL.md` 是助手入口，详细实施计划和协议约束在 `references/`；只下载 `SKILL.md` 会丢失接入资料。

可在项目目录使用与官方 AIUI Skill 相同形式的 Skills CLI 安装，并按提示选择开发助手：

```sh
npx skills add https://github.com/EasonZhu1997/Rokid-EverMind-Skills/tree/main/skills/rokid-sdk-everme
```

当前 Skills CLI 需要 Node.js 22.20+。Git 克隆受限时，可用固定日期的完整 ZIP 为 Codex 安装到当前项目（`.agents/skills/`）：

```sh
npx skills@1.7.4 add https://github.com/EasonZhu1997/Rokid-EverMind-Skills/releases/download/skills-2026.10.25/rokid-sdk-everme.zip -a codex --copy -y
```

也可以手动安装：

1. 下载[完整仓库](https://github.com/EasonZhu1997/Rokid-EverMind-Skills/archive/refs/heads/main.zip)，取出 `skills/rokid-sdk-everme/`；或在[独立 Skill 发布页](https://github.com/EasonZhu1997/Rokid-EverMind-Skills/releases/tag/skills-2026.10.25)下载 `rokid-sdk-everme.zip`，解压后保留完整目录。该日期版是 Skill 文档包，与 AIUI JS SDK 版本分开管理。
2. 按所用开发助手的 Skill 安装方式，复制整个文件夹到它支持的 Skill 目录，或使用其受支持的仓库导入功能。不同助手的配置路径可能不同。
3. 按助手要求重新加载或启动会话，确认可识别 `$rokid-sdk-everme`。不会加载 Skill 的工具也可以手动阅读下面的实施计划，但这不等于安装成功。

```text
rokid-sdk-everme/
├── SKILL.md                     助手的按需加载入口
├── README.md                    本文件：获取与使用
├── agents/openai.yaml           助手界面元数据
├── references/
│   ├── integration-plan.md      可单独阅读的接入实施计划
│   ├── oauth-mcp.md             EverMe OAuth / MCP 合同
│   ├── android-backend.md       眼镜、后端与授权回程
│   ├── acceptance.md            测试矩阵与交付回执
│   └── sources.md               一手来源及版本边界
└── LICENSE
```

## 开始前准备

- 眼镜型号、固件、眼镜端 Android 工程，以及实际使用的 Rokid 开发路径、SDK 依赖和版本；采用伴随端时一并提供其工程与通信方式。
- 自有后端与业务账号登录、眼镜绑定、HTTPS 域名和测试环境。
- EverMe 接入登记信息：精确回调白名单、约定的固定产品名称，以及获准使用的测试账号。不要把 token、密码或完整回调链接放进提示词或仓库。
- 本次需要交付的层级：先做方案、实现与隔离测试，还是还要已授权的线上联调、APK 构建、部署和指定眼镜实测。

缺少设备或供应方登记时，仍可先完成方案和隔离实现；依赖这些输入的联调与实机项目应明确保留未验证。

## 使用示例

```text
使用 $rokid-sdk-everme。先检查我的 Rokid 眼镜端 Android 工程和现有后端，
把 EverMe 接入实施计划独立列出来，说明实际 SDK 运行位置、授权浏览器与回程方案、
账号隔离、需要修改的模块和验收命令。本次只做方案，不执行真实授权或上传。
```

```text
使用 $rokid-sdk-everme，基于已经确认的接入计划，复用我的业务登录和后端，
实现 EverMe 连接、只读记忆检索、断开和持久撤销任务，并跑隔离测试。
写入权限、真实账号联调和眼镜实测按本次已授权范围分别交付证据。
```

从[独立接入实施计划](./references/integration-plan.md)开始；实现时由 [SKILL.md](./SKILL.md)按任务选择参考。先验证同一业务 owner 的可信浏览器回程；只有目标设备确实支持外部浏览器和已验证 App Link 时，才采用原应用完成握手的分支。

## 延伸图文说明

以下仓库指南用于理解整体方案，不是安装后必须访问的依赖；本目录内的引用在复制后仍可独立使用。

[中文](https://github.com/EasonZhu1997/Rokid-EverMind-Skills/blob/main/docs/rokid-memory-skills.md) · [English](https://github.com/EasonZhu1997/Rokid-EverMind-Skills/blob/main/docs/rokid-memory-skills.en.md) · [日本語](https://github.com/EasonZhu1997/Rokid-EverMind-Skills/blob/main/docs/rokid-memory-skills.ja.md) · [Français](https://github.com/EasonZhu1997/Rokid-EverMind-Skills/blob/main/docs/rokid-memory-skills.fr.md)

源文件许可见 [LICENSE](./LICENSE)。本 Skill 不代表已获 EverMe 接入批准，也不证明任何应用、SDK 通道或物理眼镜已经验收。
