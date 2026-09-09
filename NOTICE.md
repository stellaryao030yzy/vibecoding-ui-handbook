# 第三方来源与许可证说明

本文件说明 VIBE/INDEX 引用了哪些上游项目、各自的许可证，以及哪些内容不随本仓库分发。

## 随本仓库分发的内容（MIT）

以下来源为标准 MIT 许可证，其组件元数据与演示截图已包含在本仓库中：

| 来源 | 许可证 | 仓库 | 收录内容 |
| --- | --- | --- | --- |
| Magic UI | MIT | https://github.com/magicuidesign/magicui | 77 个组件的元数据、预览图 |
| Motion Primitives | MIT | https://github.com/ibelick/motion-primitives | 33 个组件的元数据、预览图 |

组件条目保留 `docsUrl`、`sourceUrl`、`license` 字段，逐条可溯源到上游文档与源码文件。

## 不随本仓库分发的内容

以下内容**不在**本仓库中，需在本地自行同步。公开分发它们存在许可证风险，因此刻意排除：

| 来源 | 许可证 | 不分发的原因 |
| --- | --- | --- |
| better-web-ui | 自定义 source-available，**不是 MIT** | 第 2 条要求分发或 fork 时必须以同协议公开完整对应源码；第 3 条禁止作为闭源或付费产品分发。具有传染性，无法与干净的 MIT 仓库共存。 |
| Animate UI | MIT + Commons Clause | Commons Clause 禁止销售，非标准 MIT。 |
| Base UI | MIT | 可再分发，但为保持「仓库内不含第三方文档正文」这一清晰边界，统一归入本地同步。 |
| React Aria | Apache-2.0 | 同上。 |
| Impeccable | Apache-2.0 | 同上。 |

### 为什么本地使用是允许的

better-web-ui 许可证第 5 条明确允许「将本软件用于内部工作流、客户工作或更广泛的开源项目」，只要不违反针对该软件本身的上述条件。因此把它同步到自己的机器、用于个人参考，完全合规。风险只出现在**公开再分发**这一环节。

### 如何同步到本地

```bash
node tools/sync-playbook.mjs      # better-web-ui 的 33 个技能与 172 篇参考
node tools/sync-supplements.mjs   # Animate UI、Base UI、React Aria、Impeccable 快照
```

产物写入 `site/data/local/`，该目录已被 `.gitignore` 排除。若你要公开 fork 本仓库，请确认 `site/data/local/` 未被提交。

## 组件预览图说明

`site/assets/` 下的预览图由上游项目公开文档中的真实 Demo 渲染生成，仅用于检索与识别，遵循各上游项目的 MIT 许可。若你是上游作者且不希望出现在此处，请提交 issue 或邮件联系，会在 72 小时内移除。

## 社区上传内容

用户上传组件的版权归上传者所有。上传即表示你同意以所选许可证授权他人查看与使用，并确认你拥有相应权利。详见 `CONTRIBUTING.md`。
