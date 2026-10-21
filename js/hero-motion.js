// 히어로 텍스트 모션: 단어 교체(A) + 숫자 올라가기(B)
(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // A. 단어 교체
  const rotator = document.getElementById("heroRotator");
  const words = ["대학", "공공기관", "기업", "청년"];
  if (rotator && !reduce) {
    let i = 0;
    setInterval(() => {
      if (document.hidden) return;
      rotator.classList.add("is-out");
      setTimeout(() => {
        i = (i + 1) % words.length;
        rotator.textContent = words[i];
        rotator.classList.remove("is-out");
        rotator.classList.add("is-in");
        requestAnimationFrame(() => requestAnimationFrame(() => rotator.classList.remove("is-in")));
      }, 320);
    }, 2600);
  }

  // B. 숫자 올라가기 (처음 화면에 보일 때 한 번)
  const counts = [...document.querySelectorAll(".hero3-stats .count")];
  if (!counts.length || reduce) return;
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const run = () => {
    const start = performance.now();
    const dur = 1400;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      counts.forEach((el) => {
        el.textContent = Math.round(Number(el.dataset.to) * ease(t)).toLocaleString("en-US");
      });
      if (t < 1) requestAnimationFrame(tick);
    };
    counts.forEach((el) => (el.textContent = "0"));
    requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      io.disconnect();
      run();
    }
  });
  io.observe(counts[0]);
})();
