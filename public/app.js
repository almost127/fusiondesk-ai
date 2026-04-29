const providers = [
  {
    id: "openai",
    name: "OpenAI",
    role: "Reasoning lead",
    color: "#32d3a2",
    strength: "长链规划、工具推理、综合总结",
    selected: true
  },
  {
    id: "anthropic",
    name: "Claude",
    role: "Review critic",
    color: "#ffb45c",
    strength: "风险审阅、表达质量、安全边界",
    selected: true
  },
  {
    id: "gemini",
    name: "Gemini",
    role: "Research scout",
    color: "#75a7ff",
    strength: "多模态思路、调研扩展、场景探索",
    selected: true
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    role: "Code builder",
    color: "#fb7185",
    strength: "代码实现、工程拆解、接口细节",
    selected: true
  },
  {
    id: "qwen",
    name: "Qwen",
    role: "Chinese ops",
    color: "#c084fc",
    strength: "中文材料、业务表达、申报措辞",
    selected: true
  },
  {
    id: "local",
    name: "Local RAG",
    role: "Memory keeper",
    color: "#f8d66d",
    strength: "本地上下文、历史证据、离线演示",
    selected: false
  }
];

const fallbackResult = {
  mode: "simulation",
  metrics: {
    qualityScore: 92,
    confidence: 95,
    totalTokens: 8920,
    estimatedLatencyMs: 1420
  },
  providers: [
    {
      provider: "OpenAI",
      providerId: "openai",
      role: "Reasoning lead",
      color: "#32d3a2",
      score: 94,
      latency: 920,
      tokens: { total: 1800 },
      insight: "建立统一任务图谱，先拆目标、约束、验收标准，再合成跨模型决策。",
      recommendation: "建议产出可演示闭环：任务规划、执行记录、模型对比、成本估算和影响力证明。"
    },
    {
      provider: "Claude",
      providerId: "anthropic",
      role: "Review critic",
      color: "#ffb45c",
      score: 91,
      latency: 1130,
      tokens: { total: 1920 },
      insight: "把潜在风险、边界条件和交付口径前置，避免只给出漂亮但不可落地的答案。",
      recommendation: "需要显式展示验证闭环、日志证据和 Key 安全边界。"
    },
    {
      provider: "Gemini",
      providerId: "gemini",
      role: "Research scout",
      color: "#75a7ff",
      score: 90,
      latency: 1280,
      tokens: { total: 1710 },
      insight: "扩展调研维度，补充同类方案、用户场景和可视化证据。",
      recommendation: "把模型协作拓扑和结果矩阵做成第一屏可见的产品体验。"
    }
  ],
  agentTrace: [
    {
      title: "定义核心痛点",
      name: "Strategy Agent",
      detail: "识别复杂任务中上下文分散、结果难验证、成本不透明的问题。",
      evidence: "pain-point-map.json"
    },
    {
      title: "多模型并行推理",
      name: "Model Council",
      detail: "调度多个 AI 生成独立判断，再用评分矩阵合并优势视角。",
      evidence: "model-votes.ndjson"
    },
    {
      title: "输出可提交成果",
      name: "Publisher Agent",
      detail: "生成 GitHub README、Demo 话术、Token plan 和申报材料。",
      evidence: "submission-brief.txt"
    }
  ],
  tokenPlan: [
    { phase: "Task intake", share: 14, tokens: 1249, purpose: "任务理解、约束提取、验收标准" },
    { phase: "Parallel reasoning", share: 42, tokens: 3746, purpose: "多模型独立推理和角色化输出" },
    { phase: "Synthesis", share: 24, tokens: 2141, purpose: "方案融合、冲突消解、质量打分" },
    { phase: "Verification", share: 12, tokens: 1070, purpose: "测试建议、日志证据和风险评估" },
    { phase: "Publishing", share: 8, tokens: 714, purpose: "README、演示说明、申报材料" }
  ],
  submission:
    "我构建了一个多模型 AI Agent 编排工作台 FusionDesk AI，用于解决单一模型上下文不稳定、复杂任务缺少验证闭环、Token 成本不可控的问题。系统融合 OpenAI、Claude、Gemini、DeepSeek、Qwen 等 AI 能力，将不同模型抽象为 Strategy、Builder、Reviewer、Verifier、Publisher 等协作角色，完成任务拆解、方案生成、交叉审阅、风险识别和成果发布。"
};

let mode = "build";
let latestResult = fallbackResult;

const $ = (selector) => document.querySelector(selector);

const elements = {
  providerList: $("#providerList"),
  providerCount: $("#providerCount"),
  runButton: $("#runButton"),
  runState: $("#runState"),
  taskInput: $("#taskInput"),
  routerMode: $("#routerMode"),
  activeAgents: $("#activeAgents"),
  qualityBadge: $("#qualityBadge"),
  qualityMetric: $("#qualityMetric"),
  confidenceMetric: $("#confidenceMetric"),
  tokenMetric: $("#tokenMetric"),
  briefOutput: $("#briefOutput"),
  timeline: $("#timeline"),
  tokenTable: $("#tokenTable"),
  submissionText: $("#submissionText"),
  copyReport: $("#copyReport"),
  toast: $("#toast"),
  mapNodes: $("#mapNodes"),
  mapLines: $("#mapLines")
};

function formatNumber(value) {
  return Number(value || 0).toLocaleString("zh-CN");
}

function compactTokens(value) {
  const number = Number(value || 0);
  if (number >= 1000) return `${(number / 1000).toFixed(1)}k`;
  return String(number);
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  window.setTimeout(() => elements.toast.classList.remove("is-visible"), 2200);
}

function updateProviderCount() {
  const count = providers.filter((provider) => provider.selected).length;
  elements.providerCount.textContent = `${count} selected`;
  elements.activeAgents.textContent = String(Math.max(3, count));
}

function renderProviders() {
  elements.providerList.innerHTML = providers
    .map(
      (provider) => `
        <article class="provider-card ${provider.selected ? "" : "is-disabled"}">
          <span class="provider-swatch" style="background:${provider.color}"></span>
          <div>
            <h3>${provider.name} <span class="muted">${provider.role}</span></h3>
            <p>${provider.strength}</p>
          </div>
          <label class="toggle" aria-label="Toggle ${provider.name}">
            <input type="checkbox" data-provider="${provider.id}" ${provider.selected ? "checked" : ""} />
            <span></span>
          </label>
        </article>
      `
    )
    .join("");

  elements.providerList.querySelectorAll("input[type='checkbox']").forEach((input) => {
    input.addEventListener("change", () => {
      const provider = providers.find((item) => item.id === input.dataset.provider);
      provider.selected = input.checked;
      renderProviders();
      renderMap(latestResult.providers);
      updateProviderCount();
    });
  });

  updateProviderCount();
}

function renderMap(results = []) {
  const selected = providers.filter((provider) => provider.selected);
  const points = [
    { x: 70, y: 70 },
    { x: 248, y: 42 },
    { x: 448, y: 80 },
    { x: 434, y: 228 },
    { x: 246, y: 258 },
    { x: 70, y: 220 }
  ];
  const resultMap = new Map(results.map((result) => [result.providerId, result]));

  elements.mapLines.innerHTML = selected
    .map((_, index) => {
      const point = points[index % points.length];
      return `<path class="map-link" d="M260 150 L${point.x + 42} ${point.y + 24}" />`;
    })
    .join("");

  elements.mapNodes.innerHTML = selected
    .map((provider, index) => {
      const point = points[index % points.length];
      const result = resultMap.get(provider.id);
      const score = result ? result.score : 88 + index;
      return `
        <g class="map-node" transform="translate(${point.x} ${point.y})">
          <rect width="98" height="54" rx="10" stroke="${provider.color}"></rect>
          <text x="49" y="23" text-anchor="middle">${provider.name}</text>
          <text class="node-role" x="49" y="40" text-anchor="middle">${score}/100</text>
        </g>
      `;
    })
    .join("");
}

function renderBrief(result) {
  elements.qualityMetric.textContent = result.metrics.qualityScore;
  elements.confidenceMetric.textContent = `${result.metrics.confidence}%`;
  elements.tokenMetric.textContent = compactTokens(result.metrics.totalTokens);
  elements.qualityBadge.textContent = `${result.metrics.qualityScore} / 100`;
  elements.routerMode.textContent = result.mode === "hybrid" ? "Hybrid" : "Mock";

  elements.briefOutput.innerHTML = result.providers
    .map(
      (item) => `
        <article class="model-result">
          <div class="result-head">
            <div>
              <strong style="color:${item.color}">${item.provider}</strong>
              <span>${item.role}</span>
            </div>
            <span>${item.score}/100 · ${formatNumber(item.tokens.total)} tokens · ${item.latency}ms</span>
          </div>
          <p>${item.insight}</p>
        </article>
      `
    )
    .join("");
}

function renderTrace(result) {
  elements.timeline.innerHTML = result.agentTrace
    .map(
      (item, index) => `
        <article class="timeline-item">
          <span class="timeline-index">${String(index + 1).padStart(2, "0")}</span>
          <div>
            <h3>${item.title} <span class="muted">${item.name}</span></h3>
            <p>${item.detail}</p>
          </div>
          <span class="evidence-tag">${item.evidence}</span>
        </article>
      `
    )
    .join("");
}

function renderTokens(result) {
  elements.tokenTable.innerHTML = result.tokenPlan
    .map(
      (item) => `
        <article class="token-row">
          <div>
            <strong>${item.phase}</strong>
            <div class="token-purpose">${item.purpose}</div>
          </div>
          <div class="token-bar"><span style="width:${item.share}%"></span></div>
          <span>${formatNumber(item.tokens)}</span>
        </article>
      `
    )
    .join("");
}

function renderSubmission(result) {
  elements.submissionText.value = result.submission;
}

function renderResult(result) {
  latestResult = result;
  renderBrief(result);
  renderTrace(result);
  renderTokens(result);
  renderSubmission(result);
  renderMap(result.providers);
}

async function orchestrate() {
  const selected = providers.filter((provider) => provider.selected).map((provider) => provider.id);
  if (!selected.length) {
    showToast("至少选择一个 AI Provider");
    return;
  }

  elements.runButton.disabled = true;
  elements.runState.textContent = "Running";
  elements.runState.classList.add("is-running");

  try {
    const response = await fetch("/api/orchestrate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        task: elements.taskInput.value,
        mode,
        tokenFocus: Number($("#tokenFocus").value),
        providers: selected
      })
    });

    if (!response.ok) {
      throw new Error("API request failed");
    }

    const result = await response.json();
    renderResult(result);
    showToast("多模型协作结果已生成");
  } catch (error) {
    renderResult(fallbackResult);
    showToast(`已切换到本地演示结果：${error.message}`);
  } finally {
    elements.runButton.disabled = false;
    elements.runState.textContent = "Ready";
    elements.runState.classList.remove("is-running");
  }
}

function bindTabs() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((item) => item.classList.remove("is-active"));
      document.querySelectorAll(".tab-view").forEach((view) => view.classList.remove("is-active"));
      tab.classList.add("is-active");
      $(`#${tab.dataset.tab}Tab`).classList.add("is-active");
    });
  });
}

function bindSegments() {
  document.querySelectorAll(".segment").forEach((segment) => {
    segment.addEventListener("click", () => {
      document.querySelectorAll(".segment").forEach((item) => item.classList.remove("is-selected"));
      segment.classList.add("is-selected");
      mode = segment.dataset.mode;
    });
  });
}

async function loadProviderStatus() {
  try {
    const response = await fetch("/api/providers");
    const data = await response.json();
    elements.routerMode.textContent = data.realAiEnabled ? "Hybrid" : "Mock";
  } catch {
    elements.routerMode.textContent = "Static";
  }
}

function bindCopy() {
  elements.copyReport.addEventListener("click", async () => {
    const text = elements.submissionText.value || latestResult.submission;
    try {
      await navigator.clipboard.writeText(text);
      showToast("成果描述已复制");
    } catch {
      elements.submissionText.select();
      showToast("可手动复制已选中文本");
    }
  });
}

elements.runButton.addEventListener("click", orchestrate);
renderProviders();
renderResult(fallbackResult);
bindTabs();
bindSegments();
bindCopy();
loadProviderStatus();
