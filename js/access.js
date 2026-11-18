// 접근 코드: 코드가 필요한 프롬프트·자료를 열 때 코드를 입력받습니다.
// Access.ensure()는 이미 열려 있으면 바로 true, 아니면 입력 창을 띄우고 성공하면 true, 닫으면 false를 줍니다.
const Access = (() => {
  const state = { unlocked: false, expires: null };
  let dialog = null;
  let pending = null;

  const LOCK_SVG =
    '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" focusable="false"><path fill="currentColor" d="M8 1a3.5 3.5 0 0 0-3.5 3.5V6H4a1.5 1.5 0 0 0-1.5 1.5v5A1.5 1.5 0 0 0 4 14h8a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 12 6h-.5V4.5A3.5 3.5 0 0 0 8 1Zm2 5H6V4.5a2 2 0 1 1 4 0V6Z"/></svg>';

  function apply(unlocked, expires) {
    state.unlocked = Boolean(unlocked);
    state.expires = expires || null;
    document.body.classList.toggle("has-access", state.unlocked);
    document.dispatchEvent(new CustomEvent("access:change", { detail: { ...state } }));
  }

  async function refresh() {
    try {
      const res = await fetch("/api/access", { cache: "no-store" });
      const data = await res.json();
      apply(data.unlocked, data.expires);
    } catch (e) {
      // 확인하지 못해도 사이트는 그대로 쓸 수 있습니다
    }
    return state.unlocked;
  }

  function build() {
    dialog = document.createElement("div");
    dialog.className = "access-overlay";
    dialog.innerHTML = `
      <div class="access-box" role="dialog" aria-modal="true" aria-labelledby="accessTitle">
        <h2 id="accessTitle">코드를 입력해 주세요</h2>
        <p class="access-sub">강의에서 안내받은 코드를 입력하면 이 프롬프트와 자료를 이용할 수 있어요. 회원가입은 필요 없습니다.</p>
        <form class="access-form" autocomplete="off">
          <input class="access-input" type="text" inputmode="text" maxlength="40" placeholder="예) BANG-XXXX-XXXX" spellcheck="false" autocapitalize="characters" aria-label="접근 코드" />
          <button class="access-submit" type="submit">확인</button>
        </form>
        <p class="access-error" role="alert"></p>
        <button class="access-close" type="button">닫기</button>
      </div>`;
    document.body.appendChild(dialog);
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) close(false);
    });
    dialog.querySelector(".access-close").addEventListener("click", () => close(false));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && dialog.classList.contains("visible")) close(false);
    });
    dialog.querySelector(".access-form").addEventListener("submit", submit);
  }

  async function submit(e) {
    e.preventDefault();
    const input = dialog.querySelector(".access-input");
    const btn = dialog.querySelector(".access-submit");
    const error = dialog.querySelector(".access-error");
    const code = input.value.trim();
    if (!code) {
      error.textContent = "코드를 입력해 주세요.";
      return;
    }
    btn.disabled = true;
    error.textContent = "";
    try {
      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "확인하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      apply(true, data.expires);
      close(true);
    } catch (err) {
      error.textContent = err.message;
      input.select();
    } finally {
      btn.disabled = false;
    }
  }

  function close(ok) {
    if (!dialog) return;
    dialog.classList.remove("visible");
    const done = pending;
    pending = null;
    if (done) done(ok);
  }

  function ensure() {
    if (state.unlocked) return Promise.resolve(true);
    if (!dialog) build();
    if (pending) return new Promise((resolve) => { const prev = pending; pending = (ok) => { prev(ok); resolve(ok); }; });
    dialog.querySelector(".access-error").textContent = "";
    dialog.querySelector(".access-input").value = "";
    dialog.classList.add("visible");
    setTimeout(() => dialog.querySelector(".access-input").focus(), 50);
    return new Promise((resolve) => {
      pending = resolve;
    });
  }

  // 코드가 필요한 항목에 붙이는 작은 표시
  const lockTag = (locked) => (locked ? `<span class="lock-tag">${LOCK_SVG}코드 필요</span>` : "");

  document.addEventListener("DOMContentLoaded", refresh);
  if (document.readyState !== "loading") refresh();

  return { state, ensure, refresh, lockTag, get unlocked() { return state.unlocked; } };
})();
