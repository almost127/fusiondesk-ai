# FusionDesk AI

FusionDesk AI 是一个可直接放到 GitHub 展示的多模型 Agent 编排工作台。它把 OpenAI、Claude、Gemini、DeepSeek、Qwen 等模型抽象成可协作的专家角色，围绕同一个任务生成规划、执行链路、Token 预算、风险评估和最终成果描述。

项目默认不依赖任何第三方包，克隆后即可运行。没有 API Key 时会进入本地模拟模式，适合录屏、截图和演示；配置 Key 后可以通过服务端适配层调用真实模型。

## 亮点

- 多 AI Provider 编排：OpenAI / Claude / Gemini / DeepSeek / Qwen / Local RAG。
- Agent 工作流：Strategy、Builder、Reviewer、Verifier、Publisher 五类角色协作。
- Token plan：按阶段估算 token、延迟、成本和置信度。
- 申报材料生成：自动输出适合填写“AI 驱动构建成果”的中文描述。
- 零依赖启动：只需要 Node.js 20+。
- Key 安全：真实 API Key 只在服务端读取，不暴露到浏览器。

## 快速开始

```bash
npm start
```

打开浏览器访问：

```text
http://localhost:4173
```

## 使用真实模型

复制环境变量模板：

```bash
cp .env.example .env
```

填入需要的模型 Key，并设置：

```text
FUSION_USE_REAL_AI=true
```

再启动：

```bash
npm start
```

## 项目结构

```text
.
├── public/
│   ├── app.js
│   ├── favicon.svg
│   ├── index.html
│   └── styles.css
├── docs/
│   └── architecture.md
├── server.mjs
├── .env.example
├── package.json
└── README.md
```

## 适合提交材料的描述

> 我构建了一个多模型 AI Agent 编排工作台 FusionDesk AI，用于解决单一大模型在复杂任务中容易遗漏上下文、缺少验证闭环、Token 成本不可控的问题。系统将 OpenAI、Claude、Gemini、DeepSeek、Qwen 等模型抽象为协作型专家，通过 Strategy、Builder、Reviewer、Verifier、Publisher 等 Agent 角色完成任务拆解、方案生成、交叉审阅、风险识别和成果发布。项目支持本地模拟与真实 API 两种模式，可自动生成 Token plan、执行链路和影响力证明，适合用于 AI 驱动开发、方案评审、代码改造和申报材料整理。

## License

MIT
