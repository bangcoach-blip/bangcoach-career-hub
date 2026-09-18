// 홈 / 블로그 / 강의 영상 / 강의안 자료 탭 전환 + 각 탭 콘텐츠 렌더링
// main.js(프롬프트 데이터), tools.js(도구 사용법)는 그대로 두고, 이 파일에서
// 탭 전환과 블로그·영상·자료 3가지 콘텐츠만 추가로 관리합니다.

// ── 콘텐츠 소스: 구글시트 CSV ──────────────────────────────────────────
// 기존 프롬프트 데이터(SHEET_CSV_URL, main.js)와 같은 방식입니다.
// 구글시트에 새 탭을 3개 만들고, 각각 "파일 > 공유 > 웹에 게시 > CSV"로 발행한
// 링크를 아래 세 상수에 넣어주세요. (탭을 나누지 않고 URL을 비워두면
// 해당 영역은 "아직 등록된 내용이 없어요"로 안내됩니다.)
//
// [블로그 탭 열 구성] 1열 제목 | 2열 날짜 | 3열 요약 | 4열 본문(줄바꿈으로 문단 구분)
const BLOG_CSV_URL = "";
//
// [강의 영상 탭 열 구성] 1열 제목 | 2열 유튜브 URL | 3열 설명
const VIDEOS_CSV_URL = "";
//
// [강의안 자료 탭 열 구성] 1열 제목 | 2열 구글드라이브 공유링크 | 3열 설명
const MATERIALS_CSV_URL = "";
//
// [강의 이력 탭 열 구성] 1열 기간(예: 2024~현재) | 2열 기관 | 3열 프로그램/강의명 | 4열 대상
// URL을 비워두면 아래 DEFAULT_LECTURES 목록이 대신 표시됩니다.
const LECTURES_CSV_URL = "";

const DEFAULT_LECTURES = [
  { period: "현재", org: "마이패스 AI연구소", title: "소장 · AI 취업 활용 교육 콘텐츠 연구", audience: "청년 구직자 · 취업지원 담당자" },
  { period: "현재", org: "잡아이디어", title: "이사 · 취업 교육 프로그램 기획", audience: "대학 · 공공기관" },
  { period: "현재", org: "에듀윌 취업", title: "대표 강사 · 자기소개서 · 면접 · 이력서 실전 강의", audience: "취업준비생" },
  { period: "현재", org: "KDT 프로그램 (삼성 · KT · SK · MS · 포스코)", title: "취업 강사 · 자기소개서 · 면접 · 취업 전략", audience: "부트캠프 수료 예정 청년" },
  { period: "현재", org: "한국기술교육대학교(한기대)", title: "청년 · 직업상담사 대상 AI 활용 교육 프로그램 운영", audience: "직업상담사 · 청년" },
  { period: "현재", org: "기업 교육", title: "AI 업무역량 강화 교육", audience: "기업 실무자" },
];

// ── 탭 전환 ──────────────────────────────────────────────────────────
const navTabs = document.querySelectorAll(".nav-tab");
const tabPanels = document.querySelectorAll(".tab-panel");
let dataLoaded = { blog: false, videos: false, materials: false, about: false };

function switchTab(tabName) {
  navTabs.forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === tabName));
  tabPanels.forEach((panel) => panel.classList.toggle("hidden", panel.id !== `tab-${tabName}`));
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (tabName === "blog" && !dataLoaded.blog) {
    dataLoaded.blog = true;
    loadBlogPosts();
  }
  if (tabName === "videos" && !dataLoaded.videos) {
    dataLoaded.videos = true;
    loadVideos();
  }
  if (tabName === "materials" && !dataLoaded.materials) {
    dataLoaded.materials = true;
    loadMaterials();
  }
  if (tabName === "about" && !dataLoaded.about) {
    dataLoaded.about = true;
    loadLectures();
  }
}

navTabs.forEach((btn) => {
  btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});

document.querySelectorAll("[data-goto]").forEach((btn) => {
  btn.addEventListener("click", () => switchTab(btn.dataset.goto));
});

// ── 공통 CSV 로더 ────────────────────────────────────────────────────
async function fetchCsvRows(url) {
  if (!url) return [];
  try {
    const res = await fetch(url, { cache: "no-store" });
    const text = await res.text();
    const parsed = Papa.parse(text, { header: false, skipEmptyLines: true });
    return parsed.data.slice(1); // 헤더 줄 제외
  } catch (e) {
    return [];
  }
}

// ── 블로그 ───────────────────────────────────────────────────────────
let BLOG_POSTS = [];

const blogListViewEl = document.getElementById("blogListView");
const blogDetailViewEl = document.getElementById("blogDetailView");
const blogListEl = document.getElementById("blogList");
const blogBackBtn = document.getElementById("blogBackBtn");
const blogDetailDateEl = document.getElementById("blogDetailDate");
const blogDetailTitleEl = document.getElementById("blogDetailTitle");
const blogDetailBodyEl = document.getElementById("blogDetailBody");

async function loadBlogPosts() {
  const rows = await fetchCsvRows(BLOG_CSV_URL);
  BLOG_POSTS = rows
    .map((row) => ({
      title: (row[0] || "").trim(),
      date: (row[1] || "").trim(),
      summary: (row[2] || "").trim(),
      body: (row[3] || "").trim(),
    }))
    .filter((p) => p.title)
    .reverse(); // 시트에 아래로 추가할수록 최신 글이 위로 오도록

  renderBlogList();
}

function renderBlogList() {
  blogListEl.innerHTML = "";
  if (BLOG_POSTS.length === 0) {
    blogListEl.innerHTML = '<p class="empty-state">아직 등록된 글이 없어요.</p>';
    return;
  }
  BLOG_POSTS.forEach((post, idx) => {
    const card = document.createElement("button");
    card.className = "blog-card";
    card.innerHTML = `
      <span class="blog-card-date">${post.date}</span>
      <h3 class="blog-card-title">${post.title}</h3>
      <p class="blog-card-summary">${post.summary}</p>
    `;
    card.addEventListener("click", () => openBlogPost(idx));
    blogListEl.appendChild(card);
  });
}

function openBlogPost(idx) {
  const post = BLOG_POSTS[idx];
  if (!post) return;
  blogDetailDateEl.textContent = post.date;
  blogDetailTitleEl.textContent = post.title;
  blogDetailBodyEl.innerHTML = post.body
    .split(/\n{2,}/)
    .map((para) => `<p>${para.replace(/\n/g, "<br>")}</p>`)
    .join("");
  blogListViewEl.classList.add("hidden");
  blogDetailViewEl.classList.remove("hidden");
}

blogBackBtn.addEventListener("click", () => {
  blogDetailViewEl.classList.add("hidden");
  blogListViewEl.classList.remove("hidden");
});

// ── 강의 영상 ────────────────────────────────────────────────────────
const videoGridEl = document.getElementById("videoGrid");

function extractYoutubeId(url) {
  const match = (url || "").match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

async function loadVideos() {
  const rows = await fetchCsvRows(VIDEOS_CSV_URL);
  const videos = rows
    .map((row) => ({
      title: (row[0] || "").trim(),
      url: (row[1] || "").trim(),
      description: (row[2] || "").trim(),
    }))
    .filter((v) => v.title && v.url);

  videoGridEl.innerHTML = "";
  if (videos.length === 0) {
    videoGridEl.innerHTML = '<p class="empty-state">아직 등록된 영상이 없어요.</p>';
    return;
  }
  videos.forEach((v) => {
    const id = extractYoutubeId(v.url);
    const thumb = id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";
    const card = document.createElement("a");
    card.className = "video-card";
    card.href = v.url;
    card.target = "_blank";
    card.rel = "noopener";
    card.innerHTML = `
      ${thumb ? `<div class="video-thumb-wrap"><img class="video-thumb" src="${thumb}" alt="" loading="lazy" /><span class="video-play">▶</span></div>` : ""}
      <div class="video-card-body">
        <h3 class="video-card-title">${v.title}</h3>
        <p class="video-card-desc">${v.description}</p>
      </div>
    `;
    videoGridEl.appendChild(card);
  });
}

// ── 강의 이력 (소개 탭) ──────────────────────────────────────────────
const lectureListEl = document.getElementById("lectureList");

async function loadLectures() {
  const rows = await fetchCsvRows(LECTURES_CSV_URL);
  const fromSheet = rows
    .map((row) => ({
      period: (row[0] || "").trim(),
      org: (row[1] || "").trim(),
      title: (row[2] || "").trim(),
      audience: (row[3] || "").trim(),
    }))
    .filter((l) => l.org || l.title);
  const lectures = fromSheet.length > 0 ? fromSheet : DEFAULT_LECTURES;

  lectureListEl.innerHTML = "";
  lectures.forEach((l) => {
    const row = document.createElement("div");
    row.className = "lecture-row";
    row.innerHTML = `
      <span class="lecture-period">${l.period}</span>
      <div class="lecture-body">
        <h3 class="lecture-org">${l.org}</h3>
        <p class="lecture-title">${l.title}</p>
        ${l.audience ? `<span class="lecture-audience">${l.audience}</span>` : ""}
      </div>
    `;
    lectureListEl.appendChild(row);
  });
}

// ── 강의안 자료 ──────────────────────────────────────────────────────
const materialListEl = document.getElementById("materialList");

async function loadMaterials() {
  const rows = await fetchCsvRows(MATERIALS_CSV_URL);
  const materials = rows
    .map((row) => ({
      title: (row[0] || "").trim(),
      link: (row[1] || "").trim(),
      description: (row[2] || "").trim(),
    }))
    .filter((m) => m.title && m.link);

  materialListEl.innerHTML = "";
  if (materials.length === 0) {
    materialListEl.innerHTML = '<p class="empty-state">아직 등록된 자료가 없어요.</p>';
    return;
  }
  materials.forEach((m) => {
    const card = document.createElement("a");
    card.className = "material-card";
    card.href = m.link;
    card.target = "_blank";
    card.rel = "noopener";
    card.innerHTML = `
      <div class="material-card-text">
        <h3 class="material-card-title">${m.title}</h3>
        <p class="material-card-desc">${m.description}</p>
      </div>
      <span class="material-card-arrow">자료 받기 →</span>
    `;
    materialListEl.appendChild(card);
  });
}
