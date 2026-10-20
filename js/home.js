// 홈 개편: 강의·프로그램 목록(노션) + 대상별 필터 + 문의 폼

let PROGRAMS = [];
let programFilter = "";

const programGridEl = document.getElementById("programGrid");
const homeProgramsEl = document.getElementById("homePrograms");
const programFiltersEl = document.getElementById("programFilters");
const programChecksEl = document.getElementById("programChecks");

const hEsc = (v) =>
  String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const groupsOf = (p) => (p.subCategory || "").split(",").map((g) => g.trim()).filter(Boolean);

function programCardHtml(p) {
  const tags = groupsOf(p).map((g) => `<span class="program-tag">${hEsc(g)}</span>`).join("");
  const curr = (p.curriculum || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => `<li>${hEsc(l)}</li>`)
    .join("");
  const facts = [
    ["대상", p.audience],
    ["시간", p.duration],
    ["방식", p.mode],
  ]
    .filter(([, v]) => v)
    .map(([k, v]) => `<dt>${k}</dt><dd>${hEsc(v)}</dd>`)
    .join("");
  return `
    <div class="program-tags">${tags}</div>
    <h3 class="program-title">${hEsc(p.title)}</h3>
    <p class="program-desc">${hEsc(p.description)}</p>
    ${facts ? `<dl class="program-facts">${facts}</dl>` : ""}
    ${curr ? `<ul class="program-curr">${curr}</ul>` : ""}
    ${p.effect ? `<p class="program-effect">${hEsc(p.effect)}</p>` : ""}
    <button class="cta-primary program-ask" type="button" data-ask="${hEsc(p.title)}">이 프로그램으로 문의하기</button>
  `;
}

function renderPrograms() {
  if (!programGridEl) return;
  const list = programFilter ? PROGRAMS.filter((p) => groupsOf(p).includes(programFilter)) : PROGRAMS;
  programGridEl.innerHTML = "";
  if (list.length === 0) {
    programGridEl.innerHTML = '<p class="empty-state">해당 프로그램을 준비 중입니다. 문의해 주시면 맞춤으로 제안드립니다.</p>';
    return;
  }
  list.forEach((p) => {
    const card = document.createElement("article");
    card.className = "program-card";
    card.innerHTML = programCardHtml(p);
    programGridEl.appendChild(card);
  });
}

function renderHomePrograms() {
  if (!homeProgramsEl) return;
  homeProgramsEl.innerHTML = "";
  PROGRAMS.slice(0, 6).forEach((p) => {
    const card = document.createElement("article");
    card.className = "program-card";
    card.innerHTML = programCardHtml(p);
    card.addEventListener("click", () => {
      programFilter = "";
      setFilterChip("");
      renderPrograms();
      switchTab("programs");
    });
    homeProgramsEl.appendChild(card);
  });
}

function renderProgramChecks() {
  if (!programChecksEl) return;
  const names = PROGRAMS.map((p) => p.title).concat(["기타·잘 모르겠어요"]);
  programChecksEl.innerHTML = names
    .map(
      (n) =>
        `<label class="check-item"><input type="checkbox" name="programs" value="${hEsc(n)}" /><span>${hEsc(n)}</span></label>`
    )
    .join("");
}

function setFilterChip(value) {
  programFiltersEl?.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c.dataset.filter === value));
}

async function loadPrograms() {
  const items = await fetchNotionItems("프로그램");
  PROGRAMS = items || [];
  renderHomePrograms();
  renderPrograms();
  renderProgramChecks();
}

programFiltersEl?.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  programFilter = chip.dataset.filter;
  setFilterChip(programFilter);
  renderPrograms();
});

// 대상별 입구 카드: 프로그램 탭으로 이동하면서 필터 적용
document.querySelectorAll(".audience-card").forEach((card) => {
  card.addEventListener("click", () => {
    programFilter = card.dataset.filter || "";
    setFilterChip(programFilter);
    renderPrograms();
  });
});

// "이 프로그램으로 문의하기": 문의 폼으로 이동하며 해당 프로그램 선택
programGridEl?.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-ask]");
  if (!btn) return;
  switchTab("contact");
  document.querySelectorAll('#programChecks input[type="checkbox"]').forEach((c) => {
    if (c.value === btn.dataset.ask) c.checked = true;
  });
});

// ── 문의 폼 ──────────────────────────────────────────────────────────
const inquiryForm = document.getElementById("inquiryForm");
const inquiryStatus = document.getElementById("inquiryStatus");
const inquirySubmit = document.getElementById("inquirySubmit");

inquiryForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = inquiryForm.elements;
  const programs = [...inquiryForm.querySelectorAll('input[name="programs"]:checked')].map((c) => c.value).join(", ");
  const payload = {
    orgType: inquiryForm.querySelector('input[name="orgType"]:checked')?.value || "기타",
    org: f.org.value,
    name: f.name.value,
    contact: f.contact.value,
    people: f.people.value,
    schedule: f.schedule.value,
    programs,
    message: f.message.value,
    website: f.website.value,
    consent: f.consent.checked,
  };

  inquiryStatus.className = "form-status";
  if (!payload.org.trim() || !payload.name.trim() || !payload.contact.trim() || !payload.message.trim()) {
    inquiryStatus.textContent = "기관명, 담당자명, 연락처, 문의 내용을 모두 입력해 주세요.";
    inquiryStatus.classList.add("err");
    return;
  }
  if (!payload.consent) {
    inquiryStatus.textContent = "개인정보 수집·이용에 동의해 주셔야 접수할 수 있어요.";
    inquiryStatus.classList.add("err");
    return;
  }

  inquirySubmit.disabled = true;
  inquirySubmit.textContent = "보내는 중...";
  try {
    const res = await fetch("/api/inquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "접수 중 오류가 발생했습니다.");
    inquiryForm.reset();
    inquiryStatus.textContent = "문의가 접수되었습니다. 확인 후 연락드리겠습니다. 급하시면 010-2587-3528로 연락해 주세요.";
    inquiryStatus.classList.add("ok");
  } catch (err) {
    inquiryStatus.textContent =
      (err.message || "접수 중 오류가 발생했습니다.") + " 전화(010-2587-3528)나 이메일(bang125@naver.com)로도 문의하실 수 있어요.";
    inquiryStatus.classList.add("err");
  } finally {
    inquirySubmit.disabled = false;
    inquirySubmit.textContent = "문의 보내기";
  }
});

loadPrograms();
