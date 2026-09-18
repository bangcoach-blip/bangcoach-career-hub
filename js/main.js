// 청년 취업준비생용 페이지 — 상위 그룹 → 그 안에 속한 카테고리들 (표시 순서 + 포인트 컬러)
const CATEGORY_GROUPS = [
  {
    group: "취업 준비",
    desc: "이력서·자기소개서·면접 준비",
    categories: [
      { name: "이력서", color: "#ffa94d" },
      { name: "자기소개서", color: "#ff6b6b" },
      { name: "면접", color: "#a78bfa" },
    ],
  },
];

const CATEGORY_META = CATEGORY_GROUPS.flatMap((g) => g.categories);

let PROMPTS = [];
let searchQuery = "";

const categoryGridEl = document.getElementById("categoryGrid");
const categoryViewEl = document.getElementById("categoryView");
const listViewEl = document.getElementById("listView");
const listTitleEl = document.getElementById("listTitle");
const cardGridEl = document.getElementById("cardGrid");
const backBtn = document.getElementById("backBtn");
const searchViewEl = document.getElementById("searchView");
const searchTitleEl = document.getElementById("searchTitle");
const searchGridEl = document.getElementById("searchGrid");
const searchInput = document.getElementById("searchInput");

const modalOverlay = document.getElementById("modalOverlay");
const modalTag = document.getElementById("modalTag");
const modalTitle = document.getElementById("modalTitle");
const modalDesc = document.getElementById("modalDesc");
const modalPromptSections = document.getElementById("modalPromptSections");
const copyBtn = document.getElementById("copyBtn");
const modalClose = document.getElementById("modalClose");

// 프롬프트 데이터는 구글시트에서 불러옵니다.
// 시트 열 구성(1행은 아무 텍스트여도 무방한 헤더): 1열 카테고리 | 2열 제목 | 3열 설명 | 4열 프롬프트 | 5열 소분류(선택)
// 헤더 "이름"이 아니라 "열 순서"로 읽기 때문에, 헤더 칸 글자를 지우거나 바꿔도 괜찮습니다.
// 5열(소분류)은 선택 항목입니다. 같은 카테고리 안에서 다시 묶고 싶을 때만 채우세요.
// 예: 자기소개서 카테고리 안에서 "경험 정리" / "자기소개서 작성"으로 값을 넣으면
// 카테고리 목록 화면에서 그 값 기준으로 소제목이 나뉘어 표시됩니다.
// 비워두면 예전처럼 소분류 없이 한 줄로 쭉 나옵니다.
//
// 기존 상담사용 구글시트에 "청년용" 탭을 추가한 뒤,
// 그 탭만 파일 > 공유 > 웹에 게시 > CSV 로 발행해서 나온 링크를 아래에 넣으세요.
// (발행 화면에서 "전체 문서"가 아니라 반드시 "청년용" 시트를 선택해야, gid가 그 탭으로 지정됩니다)
const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQCdtJ1CyUSDh2d0ZAxnkoCZChv1PrRTETOg-oplejPHlQNZnFYkaTItKRCYnhpFfDNWA_tv4fPLt5-/pub?gid=705178267&single=true&output=csv";

function rowsToPrompts(rows) {
  // rows: 헤더 없이 파싱한 2차원 배열. 첫 번째 행(헤더 줄)은 건너뜁니다.
  return rows
    .slice(1)
    .map((row) => ({
      category: (row[0] || "").trim(),
      title: (row[1] || "").trim(),
      description: (row[2] || "").trim(),
      prompt: (row[3] || "").trim(),
      subCategory: (row[4] || "").trim(),
    }))
    .filter((item) => item.title && item.prompt);
}

// 프롬프트 본문을 한 덩어리로 보여주되, 섹션 제목처럼 보이는 줄만 굵게 강조합니다.
// (여러 박스로 쪼개면 화면에서 선택 복사할 때 줄바꿈이 깨져서, 하나의 텍스트 흐름으로 유지합니다)
// 굵게 표시하는 헤더 형식:
//   1. [섹션 제목]
//   2. Role(역할 지정): / Instructions (지침): 처럼 "라벨:" 한 줄짜리 헤더
//   3. ━━━━━━━━━━ 같은 구분선 사이에 낀 한 줄짜리 헤더 (PHASE 0 — ... 등, 구분선 자체는 생략)
function isHeadingLine(trimmed) {
  if (/^\[(.+)\]$/.test(trimmed)) return true;
  if (/^([\w가-힣][\w가-힣 ()·/~\-]{1,50}?)\s*[:：]\s*$/.test(trimmed)) return true;
  return false;
}

function buildFormattedPromptNodes(promptText) {
  const rawLines = promptText.split("\n");
  const isDivider = (l) => /^[━=\-]{6,}$/.test(l.trim());
  const fragment = document.createDocumentFragment();
  let forceHeaderNext = false;

  rawLines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (isDivider(trimmed)) {
      forceHeaderNext = true;
      return; // 구분선 자체는 출력하지 않음
    }

    if (idx > 0) {
      fragment.appendChild(document.createTextNode("\n"));
    }

    if ((forceHeaderNext && trimmed !== "") || isHeadingLine(trimmed)) {
      forceHeaderNext = false;
      const strong = document.createElement("strong");
      strong.className = "prompt-heading";
      strong.textContent = line;
      fragment.appendChild(strong);
      return;
    }
    forceHeaderNext = false;

    fragment.appendChild(document.createTextNode(line));
  });

  return fragment;
}

async function loadPrompts() {
  try {
    const res = await fetch(SHEET_CSV_URL, { cache: "no-store" });
    const csvText = await res.text();
    const parsed = Papa.parse(csvText, { header: false, skipEmptyLines: true });
    PROMPTS = rowsToPrompts(parsed.data);
  } catch (e) {
    PROMPTS = [];
  }
  renderCategoryGrid();
}

// 카드에 "N개 프롬프트" 대신, 그 카테고리에 실제로 어떤 유형의 프롬프트가
// 있는지 제목 기반으로 짧은 태그를 뽑아서 보여줍니다.
function getCategoryTagLabels(name, max = 4) {
  const titles = PROMPTS.filter((p) => p.category === name).map((p) =>
    p.title
      .replace(/\(공통 참고용\)/g, "")
      .replace(/\s*프롬프트\s*$/, "")
      .trim()
  );
  const shown = titles.slice(0, max);
  const restCount = titles.length - shown.length;
  return { shown, restCount };
}

function renderCategoryGrid() {
  categoryGridEl.innerHTML = "";

  CATEGORY_GROUPS.forEach((groupDef) => {
    const section = document.createElement("section");
    section.className = "category-group";

    const header = document.createElement("div");
    header.className = "category-group-header";
    header.innerHTML = `
      <span class="category-group-title">${groupDef.group}</span>
      <span class="category-group-desc">${groupDef.desc}</span>
    `;
    section.appendChild(header);

    const grid = document.createElement("div");
    grid.className = "category-grid";

    groupDef.categories.forEach((cat) => {
      const { shown, restCount } = getCategoryTagLabels(cat.name);
      const card = document.createElement("button");
      card.className = "category-card";
      card.style.setProperty("--cat-color", cat.color);

      const tagsHtml =
        shown.map((t) => `<span class="category-tag">${t}</span>`).join("") +
        (restCount > 0 ? `<span class="category-tag category-tag-more">+${restCount}</span>` : "");

      card.innerHTML = `
        <span class="category-card-head">
          <span class="category-dot"></span>
          <span class="category-name">${cat.name}</span>
        </span>
        <span class="category-tags">${tagsHtml}</span>
      `;
      card.addEventListener("click", () => openCategory(cat.name));
      grid.appendChild(card);
    });

    section.appendChild(grid);
    categoryGridEl.appendChild(section);
  });
}

function getCategoryColor(name) {
  const meta = CATEGORY_META.find((c) => c.name === name);
  return meta ? meta.color : "#999";
}

function renderPromptCard(p, container) {
  const card = document.createElement("div");
  card.className = "prompt-card";
  card.style.setProperty("--cat-color", getCategoryColor(p.category));
  card.innerHTML = `
    <span class="card-tag">${p.category}</span>
    <h3 class="card-title">${p.title}</h3>
    <p class="card-desc">${p.description}</p>
  `;
  card.addEventListener("click", () => openModal(p));
  container.appendChild(card);
}

function openCategory(name) {
  searchInput.value = "";
  searchQuery = "";
  listTitleEl.textContent = name;
  cardGridEl.innerHTML = "";
  const items = PROMPTS.filter((p) => p.category === name);
  const hasSubCategory = items.some((p) => p.subCategory);
  cardGridEl.classList.toggle("card-grid-grouped", hasSubCategory);

  if (items.length === 0) {
    cardGridEl.innerHTML = '<p class="empty-state">아직 등록된 프롬프트가 없어요.</p>';
  } else {
    if (!hasSubCategory) {
      // 소분류가 하나도 없으면 예전처럼 카드만 쭉 나열
      items.forEach((p) => renderPromptCard(p, cardGridEl));
    } else {
      // 소분류(등장 순서 기준)로 묶어서 소제목 + 카드 그리드를 반복 출력
      const groups = [];
      const groupIndex = new Map();
      items.forEach((p) => {
        const key = p.subCategory || "기타";
        if (!groupIndex.has(key)) {
          groupIndex.set(key, groups.length);
          groups.push({ label: key, items: [] });
        }
        groups[groupIndex.get(key)].items.push(p);
      });

      groups.forEach((group) => {
        const groupSection = document.createElement("div");
        groupSection.className = "subgroup";

        const heading = document.createElement("h3");
        heading.className = "subgroup-title";
        heading.textContent = group.label;
        groupSection.appendChild(heading);

        const grid = document.createElement("div");
        grid.className = "card-grid";
        group.items.forEach((p) => renderPromptCard(p, grid));
        groupSection.appendChild(grid);

        cardGridEl.appendChild(groupSection);
      });
    }
  }

  categoryViewEl.classList.add("hidden");
  searchViewEl.classList.add("hidden");
  listViewEl.classList.remove("hidden");
  window.scrollTo({ top: listViewEl.offsetTop - 80, behavior: "smooth" });
}

function showCategoryGrid() {
  listViewEl.classList.add("hidden");
  searchViewEl.classList.add("hidden");
  categoryViewEl.classList.remove("hidden");
}

function renderSearchResults() {
  const q = searchQuery.trim().toLowerCase();
  const filtered = PROMPTS.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
  );

  searchTitleEl.textContent = `"${searchQuery}" 검색 결과 (${filtered.length}건)`;
  searchGridEl.innerHTML = "";
  if (filtered.length === 0) {
    searchGridEl.innerHTML = '<p class="empty-state">조건에 맞는 프롬프트가 없어요.</p>';
  } else {
    filtered.forEach((p) => renderPromptCard(p, searchGridEl));
  }

  categoryViewEl.classList.add("hidden");
  listViewEl.classList.add("hidden");
  searchViewEl.classList.remove("hidden");
}

backBtn.addEventListener("click", showCategoryGrid);

searchInput.addEventListener("input", (e) => {
  searchQuery = e.target.value;
  if (searchQuery.trim() === "") {
    showCategoryGrid();
  } else {
    renderSearchResults();
  }
});

function openModal(p) {
  modalTag.textContent = p.category;
  modalTag.style.setProperty("--cat-color", getCategoryColor(p.category));
  modalTitle.textContent = p.title;
  modalDesc.textContent = p.description;

  modalPromptSections.innerHTML = "";
  modalPromptSections.appendChild(buildFormattedPromptNodes(p.prompt));

  copyBtn.textContent = "프롬프트 복사";
  copyBtn.classList.remove("copied");
  copyBtn.onclick = () => copyPrompt(p.prompt);
  modalOverlay.classList.add("visible");
}

function closeModal() {
  modalOverlay.classList.remove("visible");
}

function showCopied() {
  copyBtn.textContent = "복사됨!";
  copyBtn.classList.add("copied");
  setTimeout(() => {
    copyBtn.textContent = "프롬프트 복사";
    copyBtn.classList.remove("copied");
  }, 1500);
}

function fallbackCopy(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  let succeeded = false;
  try {
    succeeded = document.execCommand("copy");
  } catch (e) {
    succeeded = false;
  }
  document.body.removeChild(textarea);
  return succeeded;
}

function copyPrompt(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(showCopied, () => {
      if (fallbackCopy(text)) {
        showCopied();
      } else {
        alert("복사에 실패했어요. 프롬프트 내용을 직접 드래그해서 복사해 주세요.");
      }
    });
  } else if (fallbackCopy(text)) {
    showCopied();
  } else {
    alert("복사에 실패했어요. 프롬프트 내용을 직접 드래그해서 복사해 주세요.");
  }
}

modalClose.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});

const instructorBtn = document.getElementById("instructorBtn");
const instructorOverlay = document.getElementById("instructorOverlay");
const instructorClose = document.getElementById("instructorClose");

function openInstructor() {
  if (instructorOverlay) instructorOverlay.classList.add("visible");
}

function closeInstructor() {
  if (instructorOverlay) instructorOverlay.classList.remove("visible");
}

if (instructorBtn) instructorBtn.addEventListener("click", openInstructor);
if (instructorClose) instructorClose.addEventListener("click", closeInstructor);
if (instructorOverlay) {
  instructorOverlay.addEventListener("click", (e) => {
    if (e.target === instructorOverlay) closeInstructor();
  });
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeModal();
    closeInstructor();
  }
});

loadPrompts();
