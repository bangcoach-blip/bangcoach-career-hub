// 사이트 전체 움직임 (Motion): 히어로 등장, 스크롤 등장, 제목 올라오기, 탭 전환, 상단 메뉴, 읽기 진행 막대
import { animate, inView, scroll } from "https://cdn.jsdelivr.net/npm/motion@13.4.6/+esm";

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const EASE = [0.22, 1, 0.36, 1];

// 애니메이션이 끝나면 인라인 스타일을 지워 기존 CSS hover 효과가 그대로 동작하게 한다
function settle(controls, els) {
  controls.finished.then(() =>
    requestAnimationFrame(() =>
      [].concat(els).forEach((el) => {
        el.style.opacity = "";
        el.style.transform = "";
      })
    )
  );
}

// 화면에 들어오면 한 번 실행. 빠르게 스크롤해서 지나쳐 버린 요소도 놓치지 않는다
const pending = new Map();
function onceSeen(el, fn, amount = 0.2) {
  const run = () => {
    if (!pending.has(el)) return;
    pending.delete(el);
    stop();
    fn();
  };
  pending.set(el, run);
  const stop = inView(el, run, { amount });
}
let checking = false;
window.addEventListener(
  "scroll",
  () => {
    if (checking || !pending.size) return;
    checking = true;
    requestAnimationFrame(() => {
      checking = false;
      pending.forEach((run, el) => {
        const r = el.getBoundingClientRect();
        if (r.height && r.bottom < 0) run();
      });
    });
  },
  { passive: true }
);

function rise(el, delay = 0, y = 24) {
  settle(animate(el, { opacity: [0, 1], y: [y, 0] }, { duration: 0.7, delay, ease: EASE }), el);
}

if (!reduce) {
  // ── 1. 히어로 첫 등장 ─────────────────────────────────────────
  const heroParts = [
    ".hero3-eyebrow",
    ".hero3-title",
    ".hero3-sub",
    ".hero3-actions",
    ".hero3-stats",
    ".hero3-note",
  ]
    .map((s) => document.querySelector(s))
    .filter(Boolean);
  heroParts.forEach((el, i) => rise(el, 0.1 + i * 0.08, 28));
  const photo = document.querySelector(".hero3-photo img");
  if (photo) {
    settle(
      animate(photo, { opacity: [0, 1], y: [40, 0], scale: [0.96, 1] }, { duration: 1.1, delay: 0.25, ease: EASE }),
      photo
    );
  }

  // ── 2. 섹션 제목이 아래에서 올라오기 ─────────────────────────
  document.querySelectorAll(".section-title").forEach((title) => {
    const inner = document.createElement("span");
    inner.className = "mfx-line-inner";
    inner.append(...title.childNodes);
    title.append(inner);
    title.classList.add("mfx-line");
    inner.style.transform = "translateY(105%)";
    onceSeen(title, () => settle(animate(inner, { y: ["105%", "0%"] }, { duration: 0.8, ease: EASE }), inner), 0.6);
  });

  // ── 3. 스크롤하면 떠오르는 블록 ───────────────────────────────
  const BLOCKS = ".section-sub, .link-more, .photo-strip, .prompt-banner, .about-hero, .about-numbers, .expertise-col, .signature-card, .client-group, .ai-timeline li, .pillar-card, .process-step, .contact-form, .external-link-card";
  document.querySelectorAll(BLOCKS).forEach((el) => {
    el.style.opacity = "0";
    onceSeen(el, () => rise(el, 0.05));
  });

  // 노션에서 늦게 들어오는 카드들: 화면에 들어올 때 순서대로 떠오르기
  const CARDS = ".home-post, .blog-card, .video-card, .material-card, .program-card, .lecture-row, .category-card, .prompt-card";
  const seen = new WeakSet();
  let batch = [];
  let timer = 0;
  const flush = () => {
    batch.forEach((el, i) => rise(el, Math.min(i, 6) * 0.07, 20));
    batch = [];
  };
  function watchCard(el) {
    if (seen.has(el)) return;
    seen.add(el);
    el.style.opacity = "0";
    onceSeen(
      el,
      () => {
        batch.push(el);
        clearTimeout(timer);
        timer = setTimeout(flush, 30);
      },
      0.15
    );
  }
  const scan = (root) => root.querySelectorAll?.(CARDS).forEach(watchCard);
  scan(document);
  new MutationObserver((records) => {
    records.forEach((r) =>
      r.addedNodes.forEach((n) => {
        if (n.nodeType !== 1) return;
        if (n.matches(CARDS)) watchCard(n);
        scan(n);
      })
    );
  }).observe(document.body, { childList: true, subtree: true });

  // ── 4. 탭 전환: 새 화면이 부드럽게 나타나기 ─────────────────
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".nav-tab, [data-goto]");
    if (!btn) return;
    requestAnimationFrame(() => {
      const panel = document.querySelector(".tab-panel:not(.hidden)");
      if (!panel) return;
      settle(animate(panel, { opacity: [0, 1], y: [14, 0] }, { duration: 0.45, ease: EASE }), panel);
    });
  });
}

// ── 5. 상단 메뉴: 내리면 작아지고 숨고, 올리면 다시 나타남 ─────
const nav = document.querySelector(".site-nav");
if (nav) {
  let lastY = window.scrollY;
  let hidden = false;
  window.addEventListener(
    "scroll",
    () => {
      const y = window.scrollY;
      nav.classList.toggle("is-scrolled", y > 24);
      const goingDown = y > lastY + 4;
      const goingUp = y < lastY - 4;
      if (goingDown && y > 320 && !hidden) {
        hidden = true;
        nav.classList.add("is-hidden");
      } else if ((goingUp || y < 320) && hidden) {
        hidden = false;
        nav.classList.remove("is-hidden");
      }
      if (goingDown || goingUp) lastY = y;
    },
    { passive: true }
  );
}

// ── 6. 맨 위 읽기 진행 막대 ─────────────────────────────────────
const bar = document.createElement("div");
bar.className = "mfx-progress";
bar.setAttribute("aria-hidden", "true");
document.body.prepend(bar);
scroll(animate(bar, { scaleX: [0, 1] }, { ease: "linear" }));
