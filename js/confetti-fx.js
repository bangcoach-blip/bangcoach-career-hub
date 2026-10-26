// 축하 효과 (canvas-confetti): 문의 접수, 프롬프트 복사, 자료 받기 때 짧게 터진다
(() => {
  if (typeof confetti !== "function") return;

  const COLORS = ["#4f46e5", "#2563eb", "#818cf8", "#a5b4fc", "#38bdf8"];
  const base = { colors: COLORS, disableForReducedMotion: true, zIndex: 1000 };

  // 요소 위치를 화면 비율(0~1)로 바꿔 그 자리에서 터지게 한다
  function originOf(el) {
    if (!el || !el.getBoundingClientRect) return { x: 0.5, y: 0.6 };
    const r = el.getBoundingClientRect();
    return {
      x: (r.left + r.width / 2) / window.innerWidth,
      y: (r.top + r.height / 2) / window.innerHeight,
    };
  }

  // 작은 폭죽: 버튼 자리에서 퐁
  function pop(el) {
    confetti({ ...base, origin: originOf(el), particleCount: 40, spread: 60, startVelocity: 28, scalar: 0.8, ticks: 120 });
  }

  // 큰 축하: 양쪽에서 두 번 쏘아 올리기
  function party() {
    const shot = (x, angle) =>
      confetti({ ...base, origin: { x, y: 0.75 }, angle, particleCount: 70, spread: 65, startVelocity: 55, ticks: 220 });
    shot(0.15, 60);
    shot(0.85, 120);
    setTimeout(() => {
      shot(0.3, 70);
      shot(0.7, 110);
    }, 250);
  }

  document.addEventListener("site:celebrate", (e) => {
    const { kind, el } = e.detail || {};
    if (kind === "inquiry") party();
    else pop(el);
  });

  // 자료 내려받기: 누른 버튼 자리에서 터뜨린다 (새 탭은 그대로 열림)
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".file-download, .material-download");
    if (btn) pop(btn);
  });
})();
