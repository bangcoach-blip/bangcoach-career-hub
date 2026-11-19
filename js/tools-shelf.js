// 내 AI로 해보는 도구: 어드민에 등록된 도구(노션 '도구' 유형)를 홈과 프롬프트 도구 탭 위쪽에 보여줍니다.
(() => {
  const esc = (v) =>
    String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const safeHref = (u) => (/^(\/(?!\/)|https:\/\/)/.test(u) ? esc(u) : "#");

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
      <h3 class="ai-tool-title">${esc(t.title)}</h3>
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

  async function load() {
    const targets = [
      document.getElementById("toolShelfGrid"),
      document.getElementById("homeToolGrid"),
    ].filter(Boolean);
    const sections = [document.getElementById("toolsShelf"), document.getElementById("homeTools")].filter(Boolean);
    try {
      const res = await fetch("/api/items?type=" + encodeURIComponent("도구"), { cache: "no-store" });
      const data = await res.json();
      const tools = (data.items || []).filter((i) => i.tool);
      sections.forEach((s) => s.classList.toggle("hidden", tools.length === 0));
      targets.forEach((el) => (el.innerHTML = tools.map(card).join("")));
    } catch (e) {
      sections.forEach((s) => s.classList.add("hidden"));
    }
  }
  load();
})();
