// 홈: 수강생 질문을 한 줄씩 위로 올려 보여줍니다. 노션 '질문' 유형 중 상태가 '발행'인 것만 나옵니다(이름·연락처는 내려오지 않음).
(() => {
  const list = document.getElementById("qtList");
  const win = document.getElementById("qtWindow");
  if (!list || !win) return;

  const VISIBLE = 3; // 한 번에 보이는 줄 수
  const STEP_MS = 3600; // 한 줄 올라가는 간격
  const esc = (v) =>
    String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const row = (q) =>
    `<li class="qt-item"><span class="qt-cat">${esc(q.subCategory || "질문")}</span><p class="qt-text">${esc(
      q.description || q.title
    )}</p></li>`;

  let index = 0;
  let timer = null;
  let count = 0;

  function go() {
    index += 1;
    list.style.transition = "transform 600ms cubic-bezier(0.22, 1, 0.36, 1)";
    list.style.transform = `translateY(calc(var(--qt-h) * -${index}))`;
    if (index >= count) {
      // 복제한 줄에 닿으면, 눈에 띄지 않게 처음으로 되돌림
      setTimeout(() => {
        list.style.transition = "none";
        list.style.transform = "translateY(0)";
        index = 0;
      }, 650);
    }
  }
  const start = () => {
    if (!timer && count > VISIBLE && !reduce) timer = setInterval(go, STEP_MS);
  };
  const stop = () => {
    clearInterval(timer);
    timer = null;
  };

  async function load() {
    let items = [];
    try {
      const res = await fetch("/api/items?type=" + encodeURIComponent("질문"), { cache: "no-store" });
      const data = await res.json();
      items = (data.items || [])
        .filter((q) => q.description || q.title)
        .sort((a, b) => (a.createdTime < b.createdTime ? 1 : -1))
        .slice(0, 20);
    } catch (e) {
      // 불러오지 못하면 빈 상태 안내만 보입니다
    }
    if (!items.length) {
      list.innerHTML = `<li class="qt-item qt-empty"><p class="qt-text">아직 소개할 질문이 없어요. 첫 질문을 남겨 주세요.</p></li>`;
      win.style.setProperty("--qt-rows", 1);
      return;
    }
    count = items.length;
    const shown = count > VISIBLE;
    // 이어 붙인 앞줄 몇 개는 되감을 때 끊김이 보이지 않게 하는 용도
    list.innerHTML = items.map(row).join("") + (shown ? items.slice(0, VISIBLE).map(row).join("") : "");
    win.style.setProperty("--qt-rows", Math.min(count, VISIBLE));
    if (shown && !reduce) {
      start();
      win.addEventListener("mouseenter", stop);
      win.addEventListener("mouseleave", start);
      win.addEventListener("focusin", stop);
      win.addEventListener("focusout", start);
      document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
    }
  }

  // "질문 남기기": 문의 탭으로 이동한 뒤 질문 폼 위치로
  document.getElementById("askQuestionBtn")?.addEventListener("click", () => {
    setTimeout(() => document.getElementById("questionAnchor")?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
  });

  load();
})();
