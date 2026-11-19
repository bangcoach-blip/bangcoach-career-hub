// 좋아요 버튼: 영상·도구·프롬프트·블로그 글에 붙고, 누르면 숫자가 바로 바뀝니다.
// 서버가 같은 브라우저의 중복 클릭을 막으므로, 화면은 서버가 돌려준 숫자로 맞춥니다.
const Likes = (() => {
  const base = new Map(); // id → 화면을 그릴 때 서버가 준 숫자
  const counts = new Map(); // id → 방금 눌러서 바뀐 숫자(있으면 이 값이 우선)
  const liked = new Set();
  const known = new Set(); // 이미 '눌렀는지' 확인한 id
  let queue = new Set();
  let timer = null;

  const HEART =
    '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" focusable="false"><path class="like-heart" d="M10 17.2 3.1 10.6C1.2 8.8 1.2 5.9 3 4.2c1.7-1.6 4.3-1.5 5.9.2L10 5.5l1.1-1.1c1.6-1.7 4.2-1.8 5.9-.2 1.8 1.7 1.8 4.6-.1 6.4L10 17.2Z"/></svg>';

  const count = (id, fallback) => {
    if (fallback !== undefined) base.set(id, Number(fallback) || 0);
    return counts.has(id) ? counts.get(id) : base.get(id) || 0;
  };

  // 눌러서 바꾸는 버튼
  function button(id, kind, fallback) {
    const n = count(id, fallback);
    return `<button type="button" class="like-btn" data-like="${id}" data-kind="${kind}" aria-pressed="${liked.has(id)}" aria-label="좋아요 ${n}개">${HEART}<span class="like-n">${n}</span></button>`;
  }

  // 목록 카드에 붙이는 읽기용 숫자(0이면 보이지 않음)
  function chip(id, fallback) {
    const n = count(id, fallback);
    return `<span class="like-chip${n > 0 ? "" : " is-zero"}" data-like-count="${id}">${HEART}<span class="like-n">${n}</span></span>`;
  }

  function paint(id) {
    const n = count(id);
    document.querySelectorAll(`[data-like="${id}"]`).forEach((el) => {
      el.setAttribute("aria-pressed", String(liked.has(id)));
      el.setAttribute("aria-label", `좋아요 ${n}개`);
      const s = el.querySelector(".like-n");
      if (s) s.textContent = n;
    });
    document.querySelectorAll(`[data-like-count="${id}"]`).forEach((el) => {
      el.classList.toggle("is-zero", n <= 0);
      const s = el.querySelector(".like-n");
      if (s) s.textContent = n;
    });
  }

  // 화면에 새로 나온 버튼들이 이미 눌린 것인지 한꺼번에 확인
  function schedule(id) {
    if (known.has(id)) return;
    queue.add(id);
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const ids = [...queue];
      queue = new Set();
      try {
        const res = await fetch("/api/like?ids=" + ids.join(","), { cache: "no-store" });
        const data = await res.json();
        ids.forEach((i) => known.add(i));
        (data.liked || []).forEach((i) => liked.add(i));
        ids.forEach(paint);
      } catch (e) {
        // 확인하지 못해도 화면은 그대로 쓸 수 있습니다
      }
    }, 80);
  }

  // 상세 화면에 이미 있는 버튼을 글에 연결
  function bind(el, id, kind, fallback) {
    if (!el || !id) return;
    el.dataset.like = id;
    el.dataset.kind = kind;
    el.innerHTML = `${HEART}<span class="like-n">${count(id, fallback)}</span>`;
    el.classList.remove("hidden");
    paint(id);
    schedule(id);
  }

  document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".like-btn");
    if (!btn || btn.disabled) return;
    e.stopPropagation(); // 카드 전체 클릭(상세 열기)과 겹치지 않게
    const id = btn.dataset.like;
    if (!id) return;
    const want = !liked.has(id);
    // 먼저 화면부터 바꾸고, 서버 값으로 확정
    const before = count(id);
    want ? liked.add(id) : liked.delete(id);
    counts.set(id, Math.max(0, before + (want ? 1 : -1)));
    paint(id);
    btn.disabled = true;
    try {
      const res = await fetch("/api/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, kind: btn.dataset.kind, like: want }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "failed");
      counts.set(id, data.likes);
      data.liked ? liked.add(id) : liked.delete(id);
      known.add(id);
    } catch (err) {
      want ? liked.delete(id) : liked.add(id); // 실패하면 원래대로
      counts.set(id, before);
    } finally {
      btn.disabled = false;
      paint(id);
    }
  });

  // 목록이 다시 그려질 때 새로 생긴 버튼도 눌린 상태를 맞춤
  new MutationObserver((list) => {
    for (const m of list) {
      m.addedNodes.forEach((n) => {
        if (n.nodeType !== 1) return;
        const found = n.matches?.("[data-like]") ? [n] : [...n.querySelectorAll?.("[data-like]") || []];
        found.forEach((el) => schedule(el.dataset.like));
      });
    }
  }).observe(document.body, { childList: true, subtree: true });

  return { button, chip, bind, count };
})();
