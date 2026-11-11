// 상단 메뉴 N 표시: 최근 2주 안에 올라온 글·자료를 이 방문자가 아직 안 봤으면 표시하고, 메뉴를 열면 지웁니다.
(() => {
  const NEW_DAYS = 14;
  const NOTION_TYPES = { 영상: "videos", 자료: "materials", 프롬프트: "prompts" };
  const latest = {};

  const seenKey = (tab) => `bc_seen_${tab}`;
  function getSeen(tab) {
    try {
      return Number(localStorage.getItem(seenKey(tab))) || 0;
    } catch (e) {
      return 0;
    }
  }
  function setSeen(tab, time) {
    try {
      localStorage.setItem(seenKey(tab), String(time));
    } catch (e) {
      // 저장이 막힌 브라우저에서는 이번 방문 동안만 지웁니다
    }
  }

  const tabButton = (tab) => document.querySelector(`.nav-tab[data-tab="${tab}"]`);

  function setBadge(tab, on) {
    const btn = tabButton(tab);
    if (!btn) return;
    const badge = btn.querySelector(".nav-new");
    if (on && !badge) {
      btn.insertAdjacentHTML("beforeend", '<span class="nav-new" aria-label="새 콘텐츠 있음">N</span>');
    } else if (!on && badge) {
      badge.remove();
    }
  }

  function note(tab, time) {
    if (Number.isFinite(time) && time > (latest[tab] || 0)) latest[tab] = time;
  }

  function markSeen(tab) {
    if (!latest[tab]) return;
    setSeen(tab, latest[tab]);
    setBadge(tab, false);
  }

  function render() {
    const cutoff = Date.now() - NEW_DAYS * 24 * 60 * 60 * 1000;
    const active = document.querySelector(".nav-tab.active")?.dataset.tab;
    Object.keys(latest).forEach((tab) => {
      if (tab === active) markSeen(tab);
      else setBadge(tab, latest[tab] >= cutoff && latest[tab] > getSeen(tab));
    });
  }

  document.addEventListener("site:tab", (e) => markSeen(e.detail));

  async function load() {
    const [items, posts] = await Promise.all([
      getSiteItems(),
      fetch("/api/posts").then((r) => r.json()).catch(() => null),
    ]);
    (items || []).forEach((i) => {
      if (NOTION_TYPES[i.type]) note(NOTION_TYPES[i.type], Date.parse(i.createdTime));
    });
    // 블로그는 노션의 '날짜' 칸 기준. 앞날짜로 예약해 둔 글은 그날이 되기 전까지 새 글로 치지 않습니다
    (posts?.posts || []).forEach((p) => {
      const time = Date.parse(`${p.date}T00:00:00+09:00`);
      if (time <= Date.now()) note("blog", time);
    });
    render();
  }
  load();
})();
