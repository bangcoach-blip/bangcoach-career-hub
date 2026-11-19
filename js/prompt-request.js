// 프롬프트 신청: 구글폼 대신 사이트 안의 작은 창에서 받아, 서버가 노션에 저장합니다.
(() => {
  const overlay = document.getElementById("requestOverlay");
  const openBtn = document.getElementById("requestOpen");
  const form = document.getElementById("requestForm");
  if (!overlay || !openBtn || !form) return;

  const closeBtn = document.getElementById("requestClose");
  const status = document.getElementById("requestStatus");
  const submit = document.getElementById("requestSend");
  let openedAt = 0;
  let lastFocus = null;

  function open() {
    lastFocus = document.activeElement;
    openedAt = Date.now();
    status.textContent = "";
    status.className = "form-status";
    overlay.classList.add("visible");
    setTimeout(() => form.elements.need.focus(), 60);
  }

  function close() {
    overlay.classList.remove("visible");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("visible")) close();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = form.elements;
    status.className = "form-status";
    if (f.need.value.trim().length < 5) {
      status.textContent = "필요한 프롬프트를 5자 이상 적어 주세요.";
      status.classList.add("err");
      return;
    }
    if (!f.consent.checked) {
      status.textContent = "개인정보 수집·이용에 동의해 주셔야 보낼 수 있어요.";
      status.classList.add("err");
      return;
    }
    submit.disabled = true;
    submit.textContent = "보내는 중...";
    try {
      const res = await fetch("/api/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "prompt",
          need: f.need.value,
          name: f.name.value,
          contact: f.contact.value,
          website: f.website.value,
          consent: f.consent.checked,
          openedAt,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "접수 중 오류가 발생했습니다.");
      form.reset();
      status.textContent = "신청이 접수되었습니다. 검토 후 추가해드릴게요.";
      status.classList.add("ok");
    } catch (err) {
      status.textContent = err.message || "접수 중 오류가 발생했습니다.";
      status.classList.add("err");
    } finally {
      submit.disabled = false;
      submit.textContent = "신청 보내기";
    }
  });
})();
