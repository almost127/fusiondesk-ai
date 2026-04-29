import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const publicDir = join(__dirname, "public");
const port = Number(process.env.PORT || 4173);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".ico": "image/x-icon"
};

const providerCatalog = [
  {
    id: "openai",
    name: "OpenAI",
    role: "Reasoning lead",
    env: "OPENAI_API_KEY",
    color: "#32d3a2",
    strength: "long-context planning, synthesis, tool reasoning"
  },
  {
    id: "anthropic",
    name: "Claude",
    role: "Review critic",
    env: "ANTHROPIC_API_KEY",
    color: "#ffb45c",
    strength: "writing, critique, safety review"
  },
  {
    id: "gemini",
    name: "Gemini",
    role: "Research scout",
    env: "GEMINI_API_KEY",
    color: "#75a7ff",
    strength: "multimodal thinking, broad exploration"
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    role: "Code builder",
    env: "DEEPSEEK_API_KEY",
    color: "#fb7185",
    strength: "code generation, implementation detail"
  },
  {
    id: "qwen",
    name: "Qwen",
    role: "Chinese ops",
    env: "DASHSCOPE_API_KEY",
    color: "#c084fc",
    strength: "Chinese business copy, localization"
  },
  {
    id: "local",
    name: "Local RAG",
    role: "Memory keeper",
    env: "",
    color: "#f8d66d",
    strength: "private notes, repo context, offline evidence"
  }
];

function json(res, status, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  res.end(body);
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  return JSON.parse(raw);
}

function selectedProviders(ids = []) {
  const requested = new Set(ids.length ? ids : ["openai", "anthropic", "gemini", "deepseek"]);
  return providerCatalog.filter((provider) => requested.has(provider.id));
}

function getTaskProfile(task, mode) {
  const cleanTask = String(task || "").trim();
  const focus = cleanTask || "构建一个可演示的多 AI Agent 工作台";
  const normalizedMode = mode || "build";
  const keywords = focus
    .replace(/[，。,.!?！？；;：:\n\r]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8);

  return {
    focus,
    mode: normalizedMode,
    keywords,
    complexity: Math.min(96, 64 + Math.max(0, keywords.length - 3) * 4),
    audience: normalizedMode === "review" ? "技术评审" : normalizedMode === "research" ? "方案决策" : "产品落地"
  };
}

function buildMockProviderResult(provider, profile, index) {
  const scoreBase = 86 + ((profile.focus.length + index * 7) % 10);
  const latency = 760 + index * 210 + (profile.focus.length % 11) * 18;
  const tokensIn = 920 + profile.focus.length * 2 + index * 135;
  const tokensOut = 760 + profile.keywords.length * 60 + index * 92;
  const providerAngles = {
    openai: "建立统一任务图谱，先拆目标、约束、验收标准，再合成跨模型决策。",
    anthropic: "把潜在风险、边界条件和交付口径前置，避免只给出漂亮但不可落地的答案。",
    gemini: "扩展调研维度，补充同类方案、用户场景和可视化证据。",
    deepseek: "把方案压成可执行工程任务，强调代码结构、接口契约和测试闭环。",
    qwen: "优化中文表达和申报材料叙述，让结果更适合展示、答辩和项目评审。",
    local: "沉淀本地项目上下文、历史运行日志和文件证据，减少重复输入。"
  };

  return {
    provider: provider.name,
    providerId: provider.id,
    role: provider.role,
    color: provider.color,
    score: scoreBase,
    latency,
    tokens: {
      input: tokensIn,
      output: tokensOut,
      total: tokensIn + tokensOut
    },
    insight: providerAngles[provider.id] || "补充一组独立视角，用于交叉验证最终方案。",
    recommendation: `${provider.name} 建议围绕「${profile.focus}」产出一个可演示闭环：任务规划、执行记录、模型对比、成本估算和影响力证明。`
  };
}

function buildAgentTrace(profile, providers) {
  const names = providers.map((provider) => provider.name).join(" / ");
  return [
    {
      id: "strategy",
      name: "Strategy Agent",
      title: "定义核心痛点",
      status: "done",
      detail: `识别目标为「${profile.focus}」，优先解决复杂任务中上下文分散、结果难验证、成本不透明的问题。`,
      evidence: "pain-point-map.json"
    },
    {
      id: "council",
      name: "Model Council",
      title: "多模型并行推理",
      status: "done",
      detail: `调度 ${names} 生成独立判断，再用评分矩阵合并优势视角。`,
      evidence: "model-votes.ndjson"
    },
    {
      id: "builder",
      name: "Builder Agent",
      title: "生成执行方案",
      status: "done",
      detail: "将结论拆成 UI、API、Provider Adapter、验证证据和发布材料五条产线。",
      evidence: "implementation-plan.md"
    },
    {
      id: "reviewer",
      name: "Reviewer Agent",
      title: "交叉审阅与风险标注",
      status: "done",
      detail: "检查是否存在单模型偏见、Token 浪费、无日志证据、Key 泄漏和演示不可复现的问题。",
      evidence: "risk-register.csv"
    },
    {
      id: "publisher",
      name: "Publisher Agent",
      title: "输出可提交成果",
      status: "done",
      detail: "生成 GitHub README、Demo 话术、Token plan 和申报表可直接粘贴的中文成果描述。",
      evidence: "submission-brief.txt"
    }
  ];
}

function buildTokenPlan(providerResults) {
  const total = providerResults.reduce((sum, result) => sum + result.tokens.total, 0);
  return [
    {
      phase: "Task intake",
      share: 14,
      tokens: Math.round(total * 0.14),
      purpose: "任务理解、约束提取、验收标准"
    },
    {
      phase: "Parallel reasoning",
      share: 42,
      tokens: Math.round(total * 0.42),
      purpose: "多模型独立推理和角色化输出"
    },
    {
      phase: "Synthesis",
      share: 24,
      tokens: Math.round(total * 0.24),
      purpose: "方案融合、冲突消解、质量打分"
    },
    {
      phase: "Verification",
      share: 12,
      tokens: Math.round(total * 0.12),
      purpose: "测试建议、日志证据和风险评估"
    },
    {
      phase: "Publishing",
      share: 8,
      tokens: Math.round(total * 0.08),
      purpose: "README、演示说明、申报材料"
    }
  ];
}

function buildSubmission(profile, providerResults) {
  const providers = providerResults.map((result) => result.provider).join("、");
  const totalTokens = providerResults.reduce((sum, result) => sum + result.tokens.total, 0);
  const avgScore = Math.round(providerResults.reduce((sum, result) => sum + result.score, 0) / providerResults.length);
  return `我构建了一个多模型 AI Agent 编排工作台 FusionDesk AI，核心解决「${profile.focus}」过程中单一模型上下文不稳定、复杂任务缺少验证闭环、Token 成本不可控的问题。系统融合 ${providers} 等 AI 能力，将不同模型抽象为 Strategy、Builder、Reviewer、Verifier、Publisher 等协作角色：先由 Strategy Agent 拆解目标和痛点，再由多个模型并行生成方案，Reviewer Agent 进行交叉审阅和风险标注，Verifier Agent 输出测试与日志证据，最后由 Publisher Agent 生成 GitHub 展示材料、Token plan 和可提交的成果说明。当前 Demo 可在无 API Key 模式下稳定演示，也支持配置真实 Key 后调用多家模型服务；一次任务会生成约 ${totalTokens.toLocaleString("zh-CN")} tokens 的执行计划、模型评分矩阵和影响力证明，综合质量评分约 ${avgScore}/100。`;
}

function simulateOrchestration(payload) {
  const profile = getTaskProfile(payload.task, payload.mode);
  const providers = selectedProviders(payload.providers);
  const providerResults = providers.map((provider, index) => buildMockProviderResult(provider, profile, index));
  const avgScore = Math.round(providerResults.reduce((sum, result) => sum + result.score, 0) / providerResults.length);
  const maxLatency = Math.max(...providerResults.map((result) => result.latency));
  const totalTokens = providerResults.reduce((sum, result) => sum + result.tokens.total, 0);

  return {
    mode: "simulation",
    generatedAt: new Date().toISOString(),
    profile,
    metrics: {
      qualityScore: avgScore,
      confidence: Math.min(98, avgScore + 3),
      estimatedLatencyMs: maxLatency,
      totalTokens,
      tokenBudgetFit: totalTokens < 12000 ? "healthy" : "watch"
    },
    providers: providerResults,
    agentTrace: buildAgentTrace(profile, providers),
    tokenPlan: buildTokenPlan(providerResults),
    artifacts: [
      "GitHub README",
      "多模型评分矩阵",
      "Agent 执行链路",
      "Token plan",
      "申报表成果描述"
    ],
    submission: buildSubmission(profile, providerResults)
  };
}

function getSystemPrompt(profile) {
  return [
    "You are one member of a multi-model AI agent council.",
    "Return concise JSON with insight, recommendation, risks, and evidence ideas.",
    `User task: ${profile.focus}`,
    `Mode: ${profile.mode}`,
    "The answer must be practical, demo-friendly, and suitable for GitHub project documentation."
  ].join("\n");
}

async function callOpenAICompatible({ apiKey, baseUrl, model, profile, providerName }) {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: getSystemPrompt(profile) },
        { role: "user", content: `Analyze and improve this task: ${profile.focus}` }
      ],
      temperature: 0.4
    })
  });

  if (!response.ok) {
    throw new Error(`${providerName} returned ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

async function callAnthropic(profile) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest",
      max_tokens: 900,
      system: getSystemPrompt(profile),
      messages: [{ role: "user", content: `Analyze and improve this task: ${profile.focus}` }]
    })
  });

  if (!response.ok) {
    throw new Error(`Claude returned ${response.status}`);
  }

  const data = await response.json();
  return data.content?.map((part) => part.text).filter(Boolean).join("\n") || "";
}

async function callGemini(profile) {
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: `${getSystemPrompt(profile)}\n\nAnalyze and improve this task: ${profile.focus}` }]
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini returned ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.map((part) => part.text).filter(Boolean).join("\n") || "";
}

async function callRealProviders(payload) {
  const profile = getTaskProfile(payload.task, payload.mode);
  const providers = selectedProviders(payload.providers).filter((provider) => provider.id !== "local");
  const calls = providers.map(async (provider, index) => {
    let text = "";
    if (provider.id === "openai" && process.env.OPENAI_API_KEY) {
      text = await callOpenAICompatible({
        apiKey: process.env.OPENAI_API_KEY,
        baseUrl: "https://api.openai.com/v1",
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        profile,
        providerName: "OpenAI"
      });
    } else if (provider.id === "deepseek" && process.env.DEEPSEEK_API_KEY) {
      text = await callOpenAICompatible({
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseUrl: "https://api.deepseek.com/v1",
        model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
        profile,
        providerName: "DeepSeek"
      });
    } else if (provider.id === "qwen" && process.env.DASHSCOPE_API_KEY) {
      text = await callOpenAICompatible({
        apiKey: process.env.DASHSCOPE_API_KEY,
        baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
        model: process.env.QWEN_MODEL || "qwen-plus",
        profile,
        providerName: "Qwen"
      });
    } else if (provider.id === "anthropic" && process.env.ANTHROPIC_API_KEY) {
      text = await callAnthropic(profile);
    } else if (provider.id === "gemini" && process.env.GEMINI_API_KEY) {
      text = await callGemini(profile);
    }

    const mock = buildMockProviderResult(provider, profile, index);
    return {
      ...mock,
      live: Boolean(text),
      insight: text ? text.slice(0, 420) : mock.insight,
      recommendation: text || mock.recommendation
    };
  });

  const settled = await Promise.allSettled(calls);
  const providerResults = settled.map((result, index) => {
    if (result.status === "fulfilled") return result.value;
    return {
      ...buildMockProviderResult(providers[index], profile, index),
      live: false,
      insight: `真实调用失败，已回退到本地模拟：${result.reason.message}`
    };
  });

  const simulated = simulateOrchestration({ ...payload, providers: providers.map((provider) => provider.id) });
  return {
    ...simulated,
    mode: "hybrid",
    providers: providerResults,
    tokenPlan: buildTokenPlan(providerResults),
    submission: buildSubmission(profile, providerResults)
  };
}

async function handleApi(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/providers") {
    json(res, 200, {
      providers: providerCatalog.map((provider) => ({
        ...provider,
        configured: provider.env ? Boolean(process.env[provider.env]) : true
      })),
      realAiEnabled: process.env.FUSION_USE_REAL_AI === "true"
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/orchestrate") {
    try {
      const payload = await readJson(req);
      const useReal = process.env.FUSION_USE_REAL_AI === "true";
      const result = useReal ? await callRealProviders(payload) : simulateOrchestration(payload);
      json(res, 200, result);
    } catch (error) {
      json(res, 500, { error: error.message });
    }
    return;
  }

  json(res, 404, { error: "API route not found" });
}

async function serveStatic(req, res, url) {
  const pathname = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const safePath = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(publicDir, safePath);

  if (!filePath.startsWith(publicDir) || !existsSync(filePath)) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  const ext = extname(filePath);
  const body = await readFile(filePath);
  res.writeHead(200, {
    "content-type": mimeTypes[ext] || "application/octet-stream",
    "cache-control": "no-cache"
  });
  res.end(body);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }
    await serveStatic(req, res, url);
  } catch (error) {
    json(res, 500, { error: error.message });
  }
});

server.listen(port, () => {
  console.log(`FusionDesk AI running at http://localhost:${port}`);
});
