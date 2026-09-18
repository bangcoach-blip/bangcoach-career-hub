// AI 도구 사용법 — 갤러리 카드 + 와이드 슬라이드 뷰어
// 프롬프트 데이터(main.js, 구글시트)와는 별개로, 도구 가이드는 이 파일 안에
// 슬라이드 배열로 직접 관리합니다. 가이드를 추가하려면 TOOL_GUIDES 배열에
// { id, title, description, color, slides } 객체를 하나 더 넣으면 됩니다.

const TOOL_GUIDES = [
  {
    id: "notebooklm-extensions",
    title: "노트북LM과 확장프로그램 연결하기",
    description: "정보 수집을 자동화하고, 지식을 자산화하는 실전 워크플로우. NotebookLM 확장 프로그램 5종 비교와 사용법.",
    color: "#e8362a",
    slides: [
      {
        type: "title",
        label: "NotebookLM Master Guide",
        titleHtml: '노트북LM과<br><span class="accent">확장프로그램</span> 연결하기',
        lead: "정보 수집을 자동화하고, 지식을 자산화하는 실전 워크플로우",
        tags: ["NotebookLM Ext", "YouTube LM", "웹클리퍼", "bananaNL", "Grabbit"],
      },
      {
        type: "intro",
        label: "Why Extensions",
        leadHtml: [
          "NotebookLM은 업로드한 소스 내에서만 답변을 생성하여 <strong class=\"accent\">환각(Hallucination) 현상을 최소화</strong>하고, 출처를 명확히 제시하는 것이 핵심입니다.",
          "확장 프로그램을 연결하면 프롬프트 최적화부터 정보 수집의 최적화까지, 워크플로우 전체가 빨라집니다.",
        ],
        checklist: [
          "웹 문서 · 유튜브 영상을 즉시 소스로 변환",
          "불필요한 소스는 툴바에서 바로 삭제",
          "결과물의 디자인 스타일까지 확장 프로그램으로 지정",
        ],
      },
      {
        type: "tools",
        label: "Toolkit",
        title: "확장 프로그램 5종 비교",
        lead: "각 도구는 소스 수집과 정리의 서로 다른 병목을 해결합니다",
        items: [
          { name: "NotebookLM (Ext)", desc: "웹 문서를 즉시 소스로 추가하여 전문 지식 베이스 구축" },
          { name: "bananaNL", desc: "노트북 LM 디자인 최적화" },
          { name: "YouTube LM", desc: "유튜브 영상 인사이트 즉시 추출" },
          { name: "NotebookLM용 웹 클리퍼", desc: "노트북 LM 소스 관리" },
          { name: "Grabbit", desc: "링크 추출로 소스 추가 쉽게 진행" },
        ],
      },
      {
        type: "usage",
        label: "사용법 ① · 소스 추출",
        step: 1,
        title: "YouTube LM",
        lead: "클릭 한 번으로 웹페이지 내의 다양한 영상 소스를 추출합니다.",
        tipLabel: "TIP",
        tipText: "소스 추출 후 불필요한 소스는 삭제해 정확도를 높이세요.",
      },
      {
        type: "usage",
        label: "사용법 ② · 소스 관리",
        step: 2,
        title: "웹클리퍼",
        lead: "소스 상단 툴바를 통해 소스의 삭제, 내려받기가 가능합니다.",
        tipLabel: "TIP",
        tipText: "불필요한 소스와 의도에 맞지 않는 소스는 과감히 삭제하세요.",
      },
      {
        type: "usage",
        label: "사용법 ③ · 디자인 최적화",
        step: 3,
        title: "바나나NL",
        lead: "인포그래픽, 동영상, 슬라이드 제작 시 디자인을 선택하여 그래픽을 원하는 스타일로 지정할 수 있습니다.",
        tipLabel: "DONE",
        tipText: "이제 소스 수집부터 스타일링까지, 확장 프로그램 워크플로우가 완성됐습니다.",
      },
    ],
  },
  {
    id: "notebooklm-understanding",
    title: "노트북LM 이해 — 무료로도 충분합니다",
    description: "무료·유료 요금제 비교부터 소스 관리, 오디오 오버뷰·마인드맵·인포그래픽·슬라이드·퀴즈·데이터표까지 스튜디오 6대 도구 실전 프롬프트.",
    color: "#2f6fed",
    slides: [
      {
        type: "title",
        label: "NotebookLM Guide",
        titleHtml: '노트북LM 이해<br><span class="accent">무료로도 충분</span>합니다',
        lead: "여러 계정을 바꿔가며 무료로 마음껏 사용해본 뒤 유료로 전환해보세요",
        tags: ["무료", "Plus", "Pro", "Ultra", "스튜디오 6대 도구"],
      },
      {
        type: "table",
        label: "요금제 비교",
        title: "무료 vs 유료 (Plus/Pro/Ultra)",
        lead: "가격보다 먼저 한도를 보세요 — 무료로 충분히 감이 잡힌 다음 필요할 때만 올리면 됩니다.",
        headers: ["", "NotebookLM (무료)", "NotebookLM 유료"],
        rows: [
          ["가격", "무료", "Plus 11,000원 · Pro 29,000원 · Ultra 360,000원 (월)"],
          ["노트북 개수", "최대 100개", "최대 500개 (5배↑)"],
          ["노트북당 소스", "50개", "300개 (6배↑)"],
          ["소스 한도", "최대 50만 단어 · 200MB/파일", "최대 50만 단어 · 200MB/파일"],
          ["일일 채팅", "50회/일", "500회 (10배↑)"],
          ["오디오 개요", "3회/일", "Plus 2배 · Pro 5배 · Ultra 20배"],
          ["퀴즈/보고서 등", "10회/일", "Plus 2배 · Pro 5배 · Ultra 20배"],
          ["슬라이드 생성", "3회/일", "Plus 2배 · Pro 5배 · Ultra 20배"],
        ],
      },
      {
        type: "intro",
        label: "1. 소스(Sources) 관리",
        leadHtml: [
          "노트북LM의 핵심은 <strong class=\"accent\">\"내가 제공한 데이터 안에서만 움직인다\"</strong>는 점입니다. 어떤 소스를 어떻게 넣느냐가 답변의 퀄리티를 결정합니다.",
          "지원하는 소스: 파일 업로드(PDF, TXT, Markdown, 오디오), 외부 링크(구글 드라이브, 웹사이트, 유튜브 영상), 직접 텍스트 붙여넣기.",
        ],
        checklist: [
          "컨텍스트 격리 — 노트북당 최대 50개 소스, 주제·프로젝트별로 노트북을 분리하세요",
          "유튜브·오디오 소스 — 강의 영상/인터뷰 녹음도 텍스트로 변환되어 요약·질의응답 가능",
          "강의 교안 제작이나 트렌드 분석에 특히 유용합니다",
        ],
      },
      {
        type: "intro",
        label: "2. 채팅 설정 및 인터페이스",
        leadHtml: [
          "소스를 업로드하면 자동으로 생성되는 대화창과 설정 기능으로, 정보를 빠르게 구조화할 수 있습니다.",
        ],
        checklist: [
          "소스 선택/해제 — 체크박스로 특정 문서만 골라 답변 범위를 실시간 제한",
          "추천 질문 — AI가 자동으로 제안하는 핵심 질문으로 문서 핵심을 빠르게 파악",
          "인라인 인용 — 답변 속 숫자를 클릭하면 원문 위치 확인, 할루시네이션 검증에 최적",
          "노트 저장 — 좋은 답변은 노트로 핀 고정해뒀다가 모아서 새 기획서로 내보내기",
        ],
      },
      {
        type: "prompt",
        label: "스튜디오 ① · 마인드맵",
        title: "마인드맵 텍스트 빌더",
        lead: "노트북LM은 그래픽을 직접 그리진 못하지만, XMind·Miro 등에 그대로 붙여넣으면 마인드맵이 완성되는 트리 구조 텍스트를 짜줍니다.",
        prompt: "이 소스들의 핵심 개념을 대주제, 중주제, 소주제 형태의 마인드맵 구조로 계층화해서 정리해 줘",
        tipText: "복잡한 이론이나 방대한 비즈니스 모델의 뼈대를 한눈에 파악하고, 마인드맵 프로그램으로 옮겨 시각화하기 최적의 상태를 만들어줍니다.",
      },
      {
        type: "prompt",
        label: "스튜디오 ② · 인포그래픽",
        title: "인포그래픽 레이아웃 설계",
        lead: "방대한 텍스트 데이터 속에서 시각화했을 때 가장 효과적인 핵심 수치와 레이아웃 스토리라인을 추출해줍니다.",
        prompt: "디자이너에게 넘길 인포그래픽 기획서가 필요해. 소스에서 가장 중요한 통계 데이터 5가지를 뽑고, 이를 어떤 비주얼(픽토그램, 차트 등)과 스토리 흐름으로 표현하면 좋을지 인포그래픽 레이아웃 세부 가이드를 짜줘",
        tipText: "숫자가 가득한 보고서를 한눈에 들어오는 카드뉴스나 포스터로 제작하기 위한 최고의 기획 초안을 얻을 수 있습니다.",
      },
      {
        type: "prompt",
        label: "스튜디오 ③ · 슬라이드",
        title: "발표 자료 대본 및 구성안",
        lead: "슬라이드별 제목, 들어갈 핵심 내용, 발표자 대본까지 원스톱으로 구성해줍니다.",
        prompt: "이 소스를 바탕으로 10장 분량의 발표용 슬라이드 구성을 짜줘. 각 슬라이드에 들어갈 헤드라인, 핵심 키워드, 그리고 내가 무대에서 말할 발표 대본을 매칭해 줘",
        tipText: "자료 해석부터 PPT 목차 및 대본 작성까지 걸리는 스피치 준비 시간을 압도적으로 줄여줍니다.",
      },
      {
        type: "prompt",
        label: "스튜디오 ④ · 퀴즈 · FAQ",
        title: "고품질 퀴즈 및 FAQ 생성",
        lead: "스튜디오의 '스터디 가이드'와 'FAQ' 기능을 극대화하는 방법입니다. 소스 내 개념을 비틀거나 융합해 학습용 문제를 정교하게 출제합니다.",
        prompt: "수강생들의 이해도를 체크할 수 있는 난이도 '상'짜리 함정 문제 5개와 해설지를 만들어 줘",
        tipText: "교육 프로그램 운영 시 평가용 문제 은행을 구축하거나, 시험 공부 자가 진단용으로 완벽하게 기능합니다.",
      },
      {
        type: "prompt",
        label: "스튜디오 ⑤ · 데이터 표",
        title: "정량적 비교 분석 표",
        lead: "여러 소스에 흩어진 수치, 날짜, 조건, 장단점을 일목요연한 마크다운 표로 재조립해줍니다.",
        prompt: "소스 A, B, C에 흩어져 있는 시장 조사 데이터와 경쟁사 수치를 [회사명 | 주요 타겟 | 가격 데이터 | 장점 | 단점] 구조의 표(Table)로 일괄 정리해 줘",
        tipText: "뒤죽박죽 섞인 텍스트에서 정량적 수치만 빠르게 발라내어, 의사결정용 비교 분석표를 즉시 만들어줍니다.",
      },
    ],
  },
  {
    id: "notebooklm-source-curation",
    title: "노트북 LM 소스 정리 방법",
    description: "Fast/Deep 리서치 프롬프트, 소스 종합 평가표, 주제별 대표 소스 선정까지 — 양질의 소스로 가득한 노트북 만드는 법.",
    color: "#22a566",
    slides: [
      {
        type: "title",
        label: "Source Curation Guide",
        titleHtml: '노트북 LM<br><span class="accent">소스 정리</span> 방법',
        lead: "불필요한 소스는 과감히 제거하고, Research 기능으로 양질의 소스만 남기세요",
        tags: ["Fast Research", "Deep Research", "소스 평가표", "대표 소스 선정"],
      },
      {
        type: "intro",
        label: "소스 추가 방법",
        leadHtml: [
          "유튜브/링크로 소스를 추가하는 방법은 <strong class=\"accent\">'노트북LM과 확장프로그램 연결하기'</strong> 가이드를 참고하세요.",
          "리서치는 목적에 따라 두 가지로 나눠 쓰세요: 빠르게 소스만 찾을 땐 Fast Research, 전략적 통찰이 필요할 땐 Deep Research.",
        ],
        checklist: [
          "Fast Research — 정확한 타깃 사이트를 함께 제공할수록 효율적",
          "Deep Research — 목표·범위·사고과정·비판적 관점·형식까지 미리 설계",
        ],
      },
      {
        type: "prompt",
        label: "Fast Research",
        title: "빠른 소스 서치 프롬프트",
        lead: "빠르게 소스만 서치할 때는 Fast 리서치를 활용하세요. 정확한 타깃 사이트를 제공하는 것이 효율적입니다.",
        prompt:
          "000에 주제를 바탕으로 소스 리서치를 시작할거야. 아래의 범위를 참고하여 리서치 자료를 가져와\n1. 00주제에 대한 회계법인 리포트 자료\n2. 주요 매거진\n3. 증권사 리포트\n4. 협회 보고서\n5. 정부기관(고용정보원, 고용관련 정보 사이트)\n6. 00 분야 대표 사이트 보고서 등",
      },
      {
        type: "prompt",
        label: "Deep Research",
        title: "딥 리서치 프롬프트 설계자",
        lead: "딥리서치를 위해 더 깊게 질문하는 방법입니다. AI가 대화를 통해 정보를 하나씩 수집한 뒤, 7-Step 원칙에 맞춘 최종 프롬프트를 완성해줍니다.",
        prompt:
          "### [페르소나 (Persona)]\n당신은 사용자와 협력하여, 단순 정보 검색을 넘어 전략적 통찰(Strategic Insight)을 이끌어내는\n'딥 리서치 프롬프트'를 설계하는 '프롬프트 전략가(Prompt Strategist)'입니다.\n\n### [핵심 목표(Core Objective)]\n사용자와의 대화를 통해, 아래 설명된 [개선된 프롬프트 구성 원칙 (7-Step)]에 필요한 모든 정보를\n수집하고, 이를 바탕으로 AI의 사고 과정(Thought Process)을 제어하는 최상의 프롬프트를 완성\n하는 것입니다.\n\n### [작업 프로세스(Workflow)]\n당신은 아래 4단계 프로세스를 엄격하게 따릅니다.\n\n[중요: 대화 원칙]\n당신은 각 단계를 '하나씩만' 수행하고, 사용자의 답변을 기다린 후에 다음 단계로 넘어갑니다. 절대\n로 두 개 이상의 질문이나 단계를 한 번의 답변에 포함하지 마세요. 모든 답변 끝에는 사용자의 입력\n을 기다려야 합니다.\n\n1. 목표 확인 (Goal Confirmation)\n사용자가 초기 리서치 주제를 제시하면, 그 목표를 명확하게 재진술하여 확인하는 질문을 합니\n다. 이 단계에서는 목표 확인 질문 외에 다른 어떤 말도 먼저 하지 않습니다.\n\n2. 전략적 질문 (Strategic Questioning)\n목표가 확인된 후, 7대 구성 원칙에 필요한 정보를 수집하기 위해 질문을 시작합니다. 아래 질문\n가이드의 질문을 반드시 한 번에 하나씩만, 순서대로 하십시오. 사용자의 답변을 받은 후에야 다\n음 질문으로 넘어갑니다.\n\n[질문 가이드]\n1. (목표/독자 파악) \"이 리서치의 최종 결과물은 어떤 목표를 가지고 있으며, 주로 누가 보게\n될 독자인가요?\"\n2. (주제/범위 구체화) \"분석의 시간적, 공간적 범위를 어떻게 한정할까요? (예: 향후 5년, 국내\n시장) 특별히 더 집중하고 싶은 하위 주제가 있으신가요?\"\n3. (사고 과정 설계) \"이 주제를 분석하기 위한 가장 이상적인 단계나 순서가 있다면 어떤 것일\n까요? 혹시 생각하고 계신 분석의 틀(Framework)이나 접근 방식이 있으신가요?\"\n4. (비판적 관점 확보) \"주류 의견 외에, 반드시 짚고 넘어가야 할 반대 관점, 잠재적 리스크, 또\n는 논쟁적인 부분은 무엇이라고 생각하시나요?\"\n5. (제약/스타일 설정) \"인용하는 정보의 출처나 신뢰도에 대한 특별한 요구사항이 있나요? 원\n하시는 어조(Tone)나 문체(Style)가 있다면 알려주세요.\"\n6. (산출물 형식) \"최종 결과물이 어떤 구조로 정리되면 가장 유용할까요?\"\n\n3. 프롬프트 생성 (Prompt Generation)\n사용자와의 모든 질문과 답변이 끝나면, 종합하여 강력한 딥 리서치 프롬프트 초안을 생성합니\n다. 이 단계에서는 초안 생성 전, \"모든 질문이 완료되었습니다. 이제 주신 답변들을 바탕으로 프\n롬프트 초안을 작성하겠습니다.\" 와 같이 다음 행동을 예고하는 말을 먼저 해야 합니다.\n\n4. 검토 및 최종화(Review & Finalize)\n생성된 프롬프트 초안을 사용자에게 제시하며 수정 및 추가 의견을 묻습니다. 최종 피드백을 반\n영하여 프롬프트를 완성합니다.\n\n### [개선된 프롬프트 구성 원칙(7-Step)]\n당신이 최종적으로 생성해야 할 프롬프트는 반드시 아래 7가지 요소를 체계적으로 포함해야 합니\n다.\n1. Role(역할): AI에게 특정 분야의 전문가 정체성을 부여합니다.\n2. Context (배경): 리서치의 궁극적인 목표(Objective)와 독자(Audience)를 명확히 합니다.\n3. Topic (주제): 분석해야 할 핵심 주제와 범위(Scope)를 구체적으로 정의합니다.\n4. Thought Process (사고 과정): AI가 따라야 할 단계별 사고 절차나 분석의 틀을 제시합니다.\n5. Critical View (비판적 관점): 반드시 포함해야 할 반론, 잠재적 리스크, 다양한 관점을 명시적\n으로 요구합니다.\n6. Constraints & Style (제약 및 스타일): 정보 출처, 어조(Tone), 문체(Style) 등 지켜야 할 규\n칙을 설정합니다.\n7. Output Format (산출물 형식): 최종 결과물의 구조(마크다운, 제목, 글머리 기호 등)를 명확\n하게 지정합니다.",
      },
      {
        type: "prompt",
        label: "소스 정리 ① · 종합 평가",
        title: "소스 종합 평가표",
        lead: "불필요한 소스는 과감히 제거해도 좋습니다. Research 기능을 적극 활용해 양질의 소스로 가득 찬 나만의 노트북을 만들어보세요.",
        prompt:
          "업로드된 각 소스를 아래 기준으로 평가해 표로 정리합니다.\n\n[소스 종합 평가표]\n| 소스명 | 핵심 요약 | 발행일 | 저자명/소속 | 소스 구분 | 신뢰도 | 참고가치 점수 |\n\n[작성기준]\n- 핵심요약: 30자 이내, 한줄로 작성\n- 소스 구분: 1차 자료(원자료·공식 발표·직접 연구) / 2차 분석(해설·요약·분석) / 의견·칼럼\n- 신뢰도: \"★★★☆☆\" 형식 점수로 구분 (5점: 공신력 있는 자료 ~ 1점: 출처 불명확·주관적)\n- 참고가치: 1~10점 (10점: 핵심 근거로 직접 인용 가능 ~ 1점: 참고 가치 낮음)",
        tipLabel: "TIP",
        tipText: "주제별 주요 소스는 앞에 느낌표(!)를 붙여 정렬하면 편리합니다.",
      },
      {
        type: "prompt",
        label: "소스 정리 ② · 대표 소스",
        title: "주제별 대표 소스 선정",
        lead: "주제별 대표 소스 + 관련 소스로 정리해도 좋습니다.",
        prompt:
          "이 노트북에 포함된 모든 소스를 면밀히 검토하여, 가장 비중있게 다뤄진 주제·관점 5가지를 선정하세요.\n각 주제별로 가장 풍부하게 다룬 소스 1개를 선정해 아래 표로 정리하세요.\n\n[주제별 대표 소스]\n| 순위 | 핵심 주제 / 주요 관점 | 대표 소스 | 선정 근거 |\n\n[작성기준]\n- 순위는 소스 전체에서의 언급 빈도와 서술 비중을 기준으로 매깁니다.\n- 선정 근거는 해당 소스의 표현·논조·주장 방식을 직접 근거로 작성하세요.\n- 외부 지식과 개인적 해석은 포함하지 마세요.\n- 소스에서 확인되지 않는 내용은 \"명시되지 않음\"으로 표기하세요.",
      },
    ],
  },
];

const toolGridEl = document.getElementById("toolGrid");
const slideOverlayEl = document.getElementById("slideOverlay");
const slideExitBtn = document.getElementById("slideExit");
const deckEl = document.getElementById("deck");
const deckNavBar = deckEl.querySelector(".nav-bar");
const dotsContainerEl = document.getElementById("dots");
const prevBtnEl = document.getElementById("prevBtn");
const nextBtnEl = document.getElementById("nextBtn");
const navCounterEl = document.getElementById("navCounter");
const progressFillEl = document.getElementById("progressFill");

function renderToolGrid() {
  toolGridEl.innerHTML = "";
  TOOL_GUIDES.forEach((guide, idx) => {
    const card = document.createElement("button");
    card.className = "guide-card";
    card.style.setProperty("--guide-color", guide.color);
    card.innerHTML = `
      <span class="guide-card-tag">가이드 · 슬라이드 ${guide.slides.length}장</span>
      <h3 class="guide-card-title">${guide.title}</h3>
      <p class="guide-card-desc">${guide.description}</p>
      <span class="guide-card-cta">슬라이드로 보기 →</span>
    `;
    card.addEventListener("click", () => openSlideDeck(idx));
    toolGridEl.appendChild(card);
  });
}

// ── 아래는 제공된 슬라이드 덱 레퍼런스의 렌더/전환 로직을 그대로 이식한 것입니다 ──

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function copyToClipboard(text, btnEl) {
  const original = btnEl.textContent;
  const done = () => {
    btnEl.textContent = "복사됨!";
    btnEl.classList.add("copied");
    setTimeout(() => {
      btnEl.textContent = original;
      btnEl.classList.remove("copied");
    }, 1500);
  };
  const fallback = () => {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand("copy");
      done();
    } catch (e) {
      alert("복사에 실패했어요. 텍스트를 직접 드래그해서 복사해 주세요.");
    }
    document.body.removeChild(ta);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done, fallback);
  } else {
    fallback();
  }
}

function renderToolSlide(item, index, total) {
  const num = String(index + 1).padStart(2, "0");
  const totalStr = String(total).padStart(2, "0");
  const numberHtml = `<div class="slide-number"><b>${num}</b> / ${totalStr}</div>`;
  const labelHtml = `<div class="label" data-reveal>${item.label}</div>`;
  let bodyHtml = "";

  if (item.type === "title") {
    const tagsHtml = item.tags.map((t) => `<span class="tag">${t}</span>`).join("");
    bodyHtml = `
      <h1 data-reveal>${item.titleHtml}</h1>
      <p class="lead" data-reveal>${item.lead}</p>
      <div class="brand-row" data-reveal>${tagsHtml}</div>`;
  } else if (item.type === "intro") {
    const paras = item.leadHtml
      .map((p, i) =>
        i === 0
          ? `<p class="lead" data-reveal>${p}</p><hr class="rule" data-reveal>`
          : `<p class="lead" data-reveal>${p}</p>`
      )
      .join("");
    const checks = item.checklist
      .map(
        (c) =>
          `<div class="check-row"><span class="mark"><svg viewBox="0 0 14 14"><path d="M2 7l3.5 3.5L12 3.5"/></svg></span>${c}</div>`
      )
      .join("");
    bodyHtml = `
      <div class="intro-block">
        ${paras}
        <div class="checklist" data-reveal>${checks}</div>
      </div>`;
  } else if (item.type === "tools") {
    const cards = item.items
      .map(
        (it, i) => `
      <div class="tool-card">
        <div class="tool-index">${String(i + 1).padStart(2, "0")}</div>
        <div class="tool-name">${it.name}</div>
        <div class="tool-desc">${it.desc}</div>
      </div>`
      )
      .join("");
    bodyHtml = `
      <h2 data-reveal>${item.title}</h2>
      <p class="lead" data-reveal style="margin-bottom:4px;">${item.lead}</p>
      <div class="tool-grid" data-reveal>${cards}</div>`;
  } else if (item.type === "usage") {
    bodyHtml = `
      <div class="usage-layout">
        <div class="usage-step-badge" data-reveal>${item.step}</div>
        <div class="usage-body">
          <h2 data-reveal>${item.title}</h2>
          <p class="lead" data-reveal>${item.lead}</p>
          <div class="tip-box" data-reveal>
            <div><div class="tip-label">${item.tipLabel}</div><p>${item.tipText}</p></div>
          </div>
        </div>
      </div>`;
  } else if (item.type === "table") {
    const theadHtml = `<tr>${item.headers.map((h) => `<th>${h}</th>`).join("")}</tr>`;
    const tbodyHtml = item.rows
      .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`)
      .join("");
    bodyHtml = `
      <h2 data-reveal>${item.title}</h2>
      ${item.lead ? `<p class="lead" data-reveal style="margin-bottom:14px;">${item.lead}</p>` : ""}
      <div class="sd-table-wrap" data-reveal>
        <table class="sd-table">
          <thead>${theadHtml}</thead>
          <tbody>${tbodyHtml}</tbody>
        </table>
      </div>`;
  } else if (item.type === "prompt") {
    bodyHtml = `
      <h2 data-reveal>${item.title}</h2>
      <p class="lead" data-reveal style="margin-bottom:16px;">${item.lead}</p>
      <div class="prompt-box" data-reveal>
        <pre class="prompt-box-text">${escapeHtml(item.prompt)}</pre>
        <button type="button" class="prompt-copy-btn">프롬프트 복사</button>
      </div>
      ${
        item.tipText
          ? `<div class="tip-box" data-reveal><div><div class="tip-label">${item.tipLabel || "TIP"}</div><p>${item.tipText}</p></div></div>`
          : ""
      }`;
  }

  const imageHtml = item.image
    ? `<div class="media-frame" data-reveal><img src="${item.image}" alt="${item.imageAlt || ""}"></div>`
    : "";

  const section = document.createElement("section");
  section.className = `slide slide-${item.type}`;
  section.dataset.index = index;
  section.innerHTML = numberHtml + labelHtml + bodyHtml + imageHtml;

  if (item.type === "prompt") {
    const copyBtn = section.querySelector(".prompt-copy-btn");
    copyBtn.addEventListener("click", () => copyToClipboard(item.prompt, copyBtn));
  }

  return section;
}

let deckSlides = [];
let deckTotal = 0;
let deckCurrent = 0;
let deckIsAnimating = false;

function revealSlideContent(slideEl) {
  const items = slideEl.querySelectorAll("[data-reveal]");
  items.forEach((el) => el.classList.remove("revealed"));
  const stagger = Math.min(90, 500 / Math.max(items.length, 1));
  items.forEach((el, i) => {
    setTimeout(() => el.classList.add("revealed"), i * stagger);
  });
}

function updateDeckDots() {
  Array.from(dotsContainerEl.children).forEach((dot, i) => {
    dot.classList.toggle("current", i === deckCurrent);
    dot.classList.toggle("done", i < deckCurrent);
  });
  navCounterEl.textContent = `${deckCurrent + 1} / ${deckTotal}`;
  progressFillEl.style.width = `${((deckCurrent + 1) / deckTotal) * 100}%`;
}

function updateDeckNavButtons() {
  prevBtnEl.disabled = deckCurrent === 0;
  nextBtnEl.disabled = deckCurrent === deckTotal - 1;
}

function goToDeckSlide(targetIndex) {
  if (deckIsAnimating) return;
  if (targetIndex < 0 || targetIndex >= deckTotal) return;
  if (targetIndex === deckCurrent) return;

  const direction = targetIndex > deckCurrent ? "forward" : "backward";
  const currentEl = deckSlides[deckCurrent];
  const targetEl = deckSlides[targetIndex];

  deckIsAnimating = true;

  targetEl.classList.add(direction === "forward" ? "enter-right" : "enter-left");
  targetEl.classList.add("transitioning", "active");
  currentEl.classList.add("transitioning");

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      currentEl.classList.add(direction === "forward" ? "exit-left" : "exit-right");
      targetEl.classList.remove("enter-right", "enter-left");
    });
  });

  setTimeout(() => {
    currentEl.classList.remove("active", "exit-left", "exit-right", "transitioning");
    targetEl.classList.remove("transitioning");
    deckCurrent = targetIndex;
    deckIsAnimating = false;
    updateDeckDots();
    updateDeckNavButtons();
    revealSlideContent(targetEl);
  }, 500);
}

function handleDeckKeydown(e) {
  if (e.key === "ArrowRight") goToDeckSlide(deckCurrent + 1);
  if (e.key === "ArrowLeft") goToDeckSlide(deckCurrent - 1);
  if (e.key === "Escape") closeSlideDeck();
}

function openSlideDeck(guideIndex) {
  const guide = TOOL_GUIDES[guideIndex];
  if (!guide) return;

  // 이전 슬라이드 정리 (nav-bar는 유지)
  deckEl.querySelectorAll(".slide").forEach((el) => el.remove());
  dotsContainerEl.innerHTML = "";

  deckSlides = guide.slides.map((item, i) => {
    const el = renderToolSlide(item, i, guide.slides.length);
    deckEl.insertBefore(el, deckNavBar);
    return el;
  });
  deckTotal = deckSlides.length;
  deckCurrent = 0;
  deckIsAnimating = false;

  deckSlides.forEach((_, i) => {
    const dot = document.createElement("div");
    dot.className = "dot";
    dot.dataset.index = i;
    dot.addEventListener("click", () => goToDeckSlide(i));
    dotsContainerEl.appendChild(dot);
  });

  deckSlides[0].classList.add("active");
  updateDeckDots();
  updateDeckNavButtons();

  slideOverlayEl.classList.add("visible");
  document.body.classList.add("slide-lock");
  document.addEventListener("keydown", handleDeckKeydown);

  revealSlideContent(deckSlides[0]);
}

function closeSlideDeck() {
  slideOverlayEl.classList.remove("visible");
  document.body.classList.remove("slide-lock");
  document.removeEventListener("keydown", handleDeckKeydown);
}

prevBtnEl.addEventListener("click", () => goToDeckSlide(deckCurrent - 1));
nextBtnEl.addEventListener("click", () => goToDeckSlide(deckCurrent + 1));
slideExitBtn.addEventListener("click", closeSlideDeck);
slideOverlayEl.addEventListener("click", (e) => {
  if (e.target === slideOverlayEl) closeSlideDeck();
});

renderToolGrid();
