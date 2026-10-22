// 홈: 최신 블로그·강의 영상·자료 미리보기 / 문의 탭: 제공 프로그램(노션) + 문의 폼

const hEsc = (v) =>
  String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// ── 홈 미리보기 ──────────────────────────────────────────────────────
const homeBlogEl = document.getElementById("homeBlog");
const homeVideosEl = document.getElementById("homeVideos");
const homeMaterialsEl = document.getElementById("homeMaterials");

function homeEmpty(el, text) {
  el.innerHTML = `<p class="home-empty">${text}</p>`;
}

async function loadHomeBlog() {
  dataLoaded.blog = true;
  await loadBlogPosts();
  homeBlogEl.innerHTML = "";
  if (BLOG_POSTS.length === 0) return homeEmpty(homeBlogEl, "새 글을 준비하고 있어요.");
  BLOG_POSTS.slice(0, 3).forEach((post, idx) => {
    const card = document.createElement("button");
    card.className = "home-post";
    card.innerHTML = `
      <div class="home-post-thumb">${post.cover ? `<img src="${hEsc(post.cover)}" alt="" loading="lazy" />` : `<span>${hEsc((post.category || "BLOG").slice(0, 8))}</span>`}</div>
      <div class="home-post-body">
        <span class="home-post-meta">${[post.date, post.category].filter(Boolean).map(hEsc).join(" · ")}</span>
        <h3 class="home-post-title">${hEsc(post.title)}</h3>
        <p class="home-post-summary">${hEsc(post.summary || "")}</p>
      </div>`;
    card.addEventListener("click", () => {
      switchTab("blog");
      openBlogPost(idx);
    });
    homeBlogEl.appendChild(card);
  });
}

// 영상·자료 탭이 그린 카드를 홈에 앞에서 3개만 복제해 보여줍니다.
async function loadHomeCopy(loader, flag, sourceSel, cardSel, target, emptyText) {
  dataLoaded[flag] = true;
  await loader();
  const cards = [...document.querySelectorAll(`${sourceSel} ${cardSel}`)].slice(0, 3);
  target.innerHTML = "";
  if (cards.length === 0) return homeEmpty(target, emptyText);
  cards.forEach((c) => target.appendChild(c.cloneNode(true)));
}

loadHomeBlog();
loadHomeCopy(loadVideos, "videos", "#videoGrid", ".video-card", homeVideosEl, "강의 영상을 준비하고 있어요.");
loadHomeCopy(loadMaterials, "materials", "#materialList", ".material-card", homeMaterialsEl, "공유할 자료를 준비하고 있어요.");

// ── 문의 탭: 제공 프로그램 ───────────────────────────────────────────
let PROGRAMS = [];
let programFilter = "";
const programGridEl = document.getElementById("programGrid");
const programFiltersEl = document.getElementById("programFilters");
const programChecksEl = document.getElementById("programChecks");

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

function renderProgramChecks() {
  const names = PROGRAMS.map((p) => p.title).concat(["기타·잘 모르겠어요"]);
  programChecksEl.innerHTML = names
    .map(
      (n) =>
        `<label class="check-item"><input type="checkbox" name="programs" value="${hEsc(n)}" /><span>${hEsc(n)}</span></label>`
    )
    .join("");
}

async function loadPrograms() {
  PROGRAMS = (await fetchNotionItems("프로그램")) || [];
  renderPrograms();
  renderProgramChecks();
}

programFiltersEl.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  programFilter = chip.dataset.filter;
  programFiltersEl.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c === chip));
  renderPrograms();
});

// "이 프로그램으로 문의하기": 아래 폼으로 이동하며 해당 프로그램을 체크
programGridEl.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-ask]");
  if (!btn) return;
  document.querySelectorAll('#programChecks input[type="checkbox"]').forEach((c) => {
    if (c.value === btn.dataset.ask) c.checked = true;
  });
  document.getElementById("contactFormAnchor").scrollIntoView({ behavior: "smooth", block: "start" });
});

// ── 문의 폼 ──────────────────────────────────────────────────────────
const inquiryForm = document.getElementById("inquiryForm");
const inquiryStatus = document.getElementById("inquiryStatus");
const inquirySubmit = document.getElementById("inquirySubmit");

inquiryForm.addEventListener("submit", async (e) => {
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
    celebrate("inquiry", inquiryStatus);
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

// ── 소개 탭 이력 필터 (전체 / 취업 교육 / AI 교육) ─────────────
const historyTimeline = document.getElementById("historyTimeline");
document.querySelectorAll(".tl-chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    const kind = chip.dataset.filter;
    document.querySelectorAll(".tl-chip").forEach((c) => c.classList.toggle("is-active", c === chip));
    historyTimeline.querySelectorAll(".tl-item").forEach((item) => {
      item.hidden = kind !== "all" && item.dataset.kind !== kind;
    });
    historyTimeline.querySelectorAll("li").forEach((li) => {
      li.hidden = ![...li.querySelectorAll(".tl-item")].some((item) => !item.hidden);
    });
  });
});
