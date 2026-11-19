// 최근 강의 일정 티커: 노션 '강의일정' 항목을 히어로 아래에서 계속 흘려 보여줍니다.
(() => {
  const root = document.getElementById("lectureTicker");
  if (!root) return;
  const esc = (v) =>
    String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const md = (iso) => {
    const m = /^\d{4}-(\d{2})-(\d{2})/.exec(iso || "");
    return m ? `${Number(m[1])}/${Number(m[2])}` : "";
  };

  const chip = (i) =>
    `<li class="lt-item"><span class="lt-date">${esc(md(i.date))}</span>${
      i.subCategory ? `<span class="lt-org">${esc(i.subCategory)}</span>` : ""
    }<span class="lt-title">${esc(i.title)}</span></li>`;

  // 한 줄: 같은 목록을 두 번 이어 붙여서 끊김 없이 반복
  const row = (items, reverse) => {
    const html = items.map(chip).join("");
    const secs = Math.max(30, items.length * 4.2);
    return `<div class="lt-row${reverse ? " is-reverse" : ""}" style="--lt-time:${secs}s">
      <ul class="lt-track">${html}</ul>
      <ul class="lt-track" aria-hidden="true">${html}</ul>
    </div>`;
  };

  async function load() {
    try {
      const res = await fetch("/api/items?type=" + encodeURIComponent("강의일정"), { cache: "no-store" });
      const data = await res.json();
      const items = (data.items || [])
        .filter((i) => i.title && i.date)
        .sort((a, b) => (a.date < b.date ? 1 : -1)); // 최근 강의가 먼저
      if (items.length < 4) return; // 너무 적으면 보여주지 않음
      const half = Math.ceil(items.length / 2);
      const rows = items.length >= 12 ? [items.slice(0, half), items.slice(half)] : [items];
      root.querySelector(".lt-rows").innerHTML = rows.map((r, i) => row(r, i === 1)).join("");
      root.querySelector(".lt-count").textContent = `최근 ${items.length}건`;
      root.classList.remove("hidden");
    } catch (e) {
      // 불러오지 못하면 이 띠는 그냥 보이지 않습니다
    }
  }
  load();
})();
