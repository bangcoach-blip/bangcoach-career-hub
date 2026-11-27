// 내 AI로 해보는 도구: 어드민에 등록된 도구(노션 '도구' 유형)를 홈과 프롬프트 도구 탭 위쪽에 보여줍니다.
(() => {
  const esc = (v) =>
    String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const safeHref = (u) => (/^(\/(?!\/)|https:\/\/)/.test(u) ? esc(u) : "#");

  const clean = (v) => String(v || "").replace(/\s*시험지\s*메이커/g, " 연습").trim();

  function card(t) {
    const tool = t.tool;
    const lock = t.locked ? ' data-lock="1"' : "";
    const samples = tool.samples.length
      ? `<p class="ai-tool-samples"><span>샘플 보기</span>${tool.samples
          .map((s) => `<a href="${safeHref(s.href)}" target="_blank" rel="noopener"${lock}>${esc(s.name)}</a>`)
          .join("")}</p>`
      : "";
    const claude = tool.claude
      ? `<a class="ai-tool-btn" href="${safeHref(tool.claude)}" target="_blank" rel="noopener">Claude로 하기 ↗</a>`
      : "";
    return `<article class="ai-tool-card">
      <div class="ai-tool-card-head">
        <span class="ai-tool-cat">${esc(t.subCategory || "AI 도구")}</span>${Access.lockTag(t.locked)}
        <span class="ai-tool-like">${Likes.button(t.id, "item", t.likes)}</span>
      </div>
      <h3 class="ai-tool-title">${esc(clean(t.title))}</h3>
      <p class="ai-tool-desc">${esc(t.description || "")}</p>
      ${samples}
      <div class="ai-tool-actions">
        <a class="ai-tool-btn ai-tool-btn--primary" href="${safeHref(tool.href)}" target="_blank" rel="noopener"${lock}>시작하기 →</a>
        ${claude}
      </div>
    </article>`;
  }

  // 코드가 필요한 도구: 코드를 입력받은 뒤 같은 창에서 엽니다(새 창은 팝업으로 막힐 수 있음)
  document.addEventListener("click", async (e) => {
    const a = e.target.closest("a[data-lock]");
    if (!a || Access.unlocked) return;
    e.preventDefault();
    if (await Access.ensure()) location.href = a.href;
  });

  // 프롬프트 도구 탭의 흐름도. 어드민에 등록된 도구는 주소(href)로 찾아 제목·샘플·좋아요를 함께 보여줍니다.
  const TRACKS = [
    {
      id: "resume",
      name: "자기소개서 작성",
      steps: [
        { label: "경험 정리", href: "/spark-map.html", title: "SPARK 경험 지도", desc: "내 경험을 정리하고 어느 항목에 쓸지 연결합니다.", next: "[자기소개서 작성하기]를 누르면 정리한 내용이 2단계로 넘어갑니다." },
        { label: "자기소개서 작성", href: "/tools/cover-letter.html", title: "자기소개서 작성 도구", desc: "1차 초안을 바탕으로 기본 항목과 기업별 문항을 다듬습니다. 분석 자료도 올려 쓸 수 있습니다." },
      ],
    },
    {
      id: "interview",
      name: "면접 준비",
      steps: [
        { label: "1분 자기소개", href: "/tools/self-intro.html", title: "1분 자기소개 메이커", desc: "면접의 첫 답변을 먼저 만듭니다." },
        { label: "인성면접", href: "/tools/personality-interview.html", title: "인성면접 연습", desc: "자주 묻는 인성 질문의 답변을 준비합니다." },
        { label: "경험면접", href: "/tools/experience-interview.html", title: "경험면접 연습", desc: "내 경험을 파고드는 꼬리 질문에 대비합니다." },
        { label: "상황면접", href: "/tools/situational-interview.html", title: "상황면접 연습", desc: "상황형 질문에 판단과 행동으로 답하는 연습을 합니다." },
        { label: "PT면접", href: "/tools/pt-interview.html", title: "PT면접 연습", desc: "발표 과제를 풀고 해설로 점검합니다." },
      ],
    },
  ];
  const flow = document.getElementById("toolFlow");
  let track = "resume";

  const pad = (n) => String(n).padStart(2, "0");

  function step(s, t, i) {
    const tool = t && t.tool;
    const lock = t && t.locked ? ' data-lock="1"' : "";
    const samples = tool && tool.samples.length
      ? `<p class="ai-tool-samples"><span>샘플</span>${tool.samples
          .map((x) => `<a href="${safeHref(x.href)}" target="_blank" rel="noopener"${lock}>${esc(x.name)}</a>`)
          .join("")}</p>`
      : "";
    const claude = tool && tool.claude
      ? `<a class="flow-sub" href="${safeHref(tool.claude)}" target="_blank" rel="noopener">Claude로 하기 ↗</a>`
      : "";
    return `<li class="flow-step">
      <article class="flow-card">
        <div class="flow-head">
          <span class="flow-num">${pad(i + 1)}</span>
          <span class="flow-label">${esc(s.label)}</span>${t ? Access.lockTag(t.locked) : ""}
        </div>
        <h3 class="flow-title">${esc(s.title)}</h3>
        <p class="flow-desc">${esc(s.desc)}</p>
        ${s.next ? `<p class="flow-next">${esc(s.next)}</p>` : ""}
        ${samples}
        <div class="flow-foot">
          <a class="flow-go" href="${safeHref(s.href)}" target="_blank" rel="noopener"${lock}>시작하기<span aria-hidden="true">→</span></a>
          ${claude}
          <span class="flow-like">${t ? Likes.button(t.id, "item", t.likes) : ""}</span>
        </div>
      </article>
    </li>`;
  }

  function renderFlow(tools = []) {
    if (!flow) return;
    const byHref = new Map(tools.map((t) => [t.tool.href, t]));
    const known = new Set(TRACKS.flatMap((k) => k.steps.map((s) => s.href)));
    const others = tools.filter((t) => !known.has(t.tool.href));
    const tabs = TRACKS.map(
      (k) => `<button type="button" data-track="${k.id}" aria-pressed="${k.id === track}">${k.name}<small>${k.steps.length}단계</small></button>`
    ).join("");
    const panels = TRACKS.map((k) => {
      const jump = k.id === "resume"
        ? `<button type="button" class="flow-jump" data-track="interview">
            <span><small>자기소개서를 마쳤다면</small>면접 준비로 이어가기</span><i aria-hidden="true">→</i>
          </button>`
        : "";
      return `<div class="flow-panel${k.id === track ? "" : " hidden"}" data-panel="${k.id}">
        <ol class="flow-list" style="--n:${k.steps.length}">${k.steps.map((s, i) => step(s, byHref.get(s.href), i)).join("")}</ol>${jump}
      </div>`;
    }).join("");
    const rest = others.length
      ? `<h3 class="flow-others">그 밖의 도구</h3><div class="ai-tool-grid">${others.map(card).join("")}</div>`
      : "";
    flow.innerHTML = `<div class="flow-tabs">${tabs}</div>${panels}${rest}`;
  }

  if (flow) {
    flow.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-track]");
      if (!b) return;
      track = b.dataset.track;
      flow.querySelectorAll(".flow-tabs button").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.track === track)));
      flow.querySelectorAll("[data-panel]").forEach((x) => x.classList.toggle("hidden", x.dataset.panel !== track));
    });
  }

  async function load() {
    const targets = [document.getElementById("homeToolGrid")].filter(Boolean);
    const sections = [document.getElementById("homeTools")].filter(Boolean);
    renderFlow();
    try {
      const res = await fetch("/api/items?type=" + encodeURIComponent("도구"), { cache: "no-store" });
      const data = await res.json();
      const tools = (data.items || []).filter((i) => i.tool);
      sections.forEach((s) => s.classList.toggle("hidden", tools.length === 0));
      targets.forEach((el) => (el.innerHTML = tools.map(card).join("")));
      renderFlow(tools);
    } catch (e) {
      sections.forEach((s) => s.classList.add("hidden"));
    }
  }
  load();
})();
