# 独立 Skill 接入中心

**给编程助手的接入方案，按目录独立安装。** 展示首页与四语图解用于了解项目；这里的每个目录包含自己的 `SKILL.md`、实施计划、技术参考和许可证。无需把整本展示文档放进模型上下文。

| 你的工程 | 独立接入首页 | 助手入口 | 实施计划 |
| --- | --- | --- | --- |
| AIUI Page / Widget / Agent Worker → EverOS | [AIUI × EverOS](aiui-everos-direct/README.md) | [aiui-everos-direct](aiui-everos-direct/SKILL.md) | [身份、SDK 与生命周期接线](aiui-everos-direct/references/integration-plan.md) |
| Rokid 眼镜端 Android 应用 → 自有后端 → EverMe | [Rokid SDK × EverMe](rokid-sdk-everme/README.md) | [rokid-sdk-everme](rokid-sdk-everme/SKILL.md) | [SDK 路径、授权回程与后端分工](rokid-sdk-everme/references/integration-plan.md) |

AIUI 包内保留唯一的 [JavaScript SDK 0.1.0](aiui-everos-direct/sdk/README.md)，助手只实现当前应用的配置与接线。Rokid SDK 包是开发指导与参考合同；目标硬件 SDK 由现有工程提供。

## 按官方 AIUI 的方式安装

在目标项目目录运行其中一条，按提示选择你的编程助手：

```sh
npx skills add https://github.com/EasonZhu1997/Rokid-EverMind-Skills/tree/main/skills/aiui-everos-direct
```

```sh
npx skills add https://github.com/EasonZhu1997/Rokid-EverMind-Skills/tree/main/skills/rokid-sdk-everme
```

当前 Skills CLI 需要 Node.js 22.20+。默认是项目级安装；目录与加载方式由所选助手决定。无需同时安装两条路线，也不要只下载 `SKILL.md`。更新已有同名 Skill 前先比较版本，按宿主支持的方式更新。

若 Git 克隆受网络影响，可从[独立 Skill 发布页](https://github.com/EasonZhu1997/Rokid-EverMind-Skills/releases/tag/skills-2026.10.25)下载对应 ZIP，完整解压后按助手的安装方式放入 Skill 目录。发布包带 SHA-256 清单；不包含展示图片或品牌附件。完整目录也可交给不支持自动安装的助手直接读取，但手动阅读不等于宿主已加载 Skill。

也可直接从固定日期的 ZIP 安装。例如为 Codex 安装到**当前项目**，以下两条按需选择：

```sh
npx skills@1.7.4 add https://github.com/EasonZhu1997/Rokid-EverMind-Skills/releases/download/skills-2026.10.25/aiui-everos-direct.zip -a codex --copy -y
```

```sh
npx skills@1.7.4 add https://github.com/EasonZhu1997/Rokid-EverMind-Skills/releases/download/skills-2026.10.25/rokid-sdk-everme.zip -a codex --copy -y
```

该 CLI 版本的 Codex 项目目录为 `.agents/skills/`；`--copy` 保留完整文件副本。其他助手请使用交互选择或其支持的安装方法。

## 交给助手

```text
使用 $aiui-everos-direct，先检查我的 AIUI 工程，读取此 Skill 的
references/integration-plan.md，复用包内 SDK，为现有业务身份和生命周期接线。
先列出修改点与验收，再实现并跑本地检查；实服和物理眼镜结果分别报告。
```

```text
使用 $rokid-sdk-everme，先检查我的眼镜端工程、实际 Rokid SDK 和业务后端，
读取此 Skill 的 references/integration-plan.md，确定授权浏览器与回程，
再按本次授权范围实现和验证 EverMe 接入，分别报告本地、实服和眼镜结果。
```

安装 Skill 不会自动把 SDK 注入应用或完成供应方登记。账号、服务、当前 SDK 能力和用户数据权限仍需根据工程确认；验证方法随各目录提供。

## 结构参考与延伸阅读

采用官方 [AIUI `aiui-dev`](https://github.com/yodaos-project/AIUI/blob/362fcb7299a44637c19ed7be0e192beb74ebbabf/skills/aiui-dev/SKILL.md) 的短入口和按任务加载 `references/` 的组织方式；官方 [README 的安装入口](https://github.com/yodaos-project/AIUI/blob/362fcb7299a44637c19ed7be0e192beb74ebbabf/README.md)使用同类目录 URL。本次核对快照为 `362fcb7`（2026-10-25），用户提供的 `jsar-project/AIUI` 当前重定向至 `yodaos-project/AIUI`。本仓库的内容为社区原创接入说明，不代表官方认证。

[项目展示](../README.md) · [中文图解](../docs/rokid-memory-skills.md) · [English](../docs/rokid-memory-skills.en.md) · [日本語](../docs/rokid-memory-skills.ja.md) · [Français](../docs/rokid-memory-skills.fr.md) · [验证记录](../docs/validation.md)
