// 수강생 질문함: 질문은 노션 '질문' 유형(상태=접수)으로 쌓이고, 방영황이 '발행'으로 바꾼 것만 메인에 이름 없이 보입니다.
// 스팸 방지: 숨은 입력칸, 너무 빠른 제출 거부, 같은 접속지의 연속 제출 제한, 링크 많은 글 거부.
const { notion } = require("./_notion");
const { notifyInquiry } = require("./_notify");

const CATEGORIES = ["취업 고민", "AI 활용", "면접·자소서", "기타"];
const clip = (v, n) => String(v || "").trim().slice(0, n);
const rt = (s) => (s ? [{ type: "text", text: { content: s } }] : []);

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 3;
const hits = new Map(); // 접속지 → 최근 제출 시각들(서버 인스턴스 안에서만 유지되는 가벼운 제한)

function tooMany(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (list.length >= MAX_PER_WINDOW) {
    hits.set(ip, list);
    return true;
  }
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 500) for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW_MS)) hits.delete(k);
  return false;
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }
  const dbId = process.env.NOTION_CONTENT_DB_ID;
  if (!process.env.NOTION_TOKEN || !dbId) {
    res.status(503).json({ error: "not configured" });
    return;
  }
  try {
    const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    if (b.website) {
      res.status(200).json({ ok: true }); // 봇은 성공한 것처럼 보이게 하고 저장하지 않음
      return;
    }
    const name = clip(b.name, 40);
    const contact = clip(b.contact, 120);
    const course = clip(b.course, 100);
    const message = clip(b.message, 500);
    const category = CATEGORIES.includes(b.category) ? b.category : "기타";
    if (!name || message.length < 5 || b.consent !== true) {
      res.status(400).json({ error: "이름(닉네임)과 질문 내용을 입력하고 동의해 주세요." });
      return;
    }
    const opened = Number(b.openedAt) || 0;
    if (opened && Date.now() - opened < 3000) {
      res.status(429).json({ error: "너무 빠르게 보내셨어요. 잠시 후 다시 시도해 주세요." });
      return;
    }
    if ((message.match(/https?:\/\//gi) || []).length > 2) {
      res.status(400).json({ error: "링크는 2개까지만 넣을 수 있어요." });
      return;
    }
    const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
    if (tooMany(ip)) {
      res.status(429).json({ error: "질문을 연달아 많이 보내셨어요. 잠시 후 다시 남겨 주세요." });
      return;
    }

    // 제목에는 이름을 넣지 않습니다(공개 목록에 제목이 나가므로). 이름·연락처·수업은 비공개 칸에만 둡니다.
    const title = message.replace(/\s+/g, " ").slice(0, 40);
    const props = {
      이름: { title: rt(title) },
      유형: { select: { name: "질문" } },
      상태: { select: { name: "접수" } },
      담당자: { rich_text: rt(course ? `${name} (${course})` : name) }, // '담당자'·'연락처'는 공개 목록에 나가지 않는 칸
      연락처: { rich_text: rt(contact) },
      소분류: { rich_text: rt(category) },
      설명: { rich_text: rt(message) },
    };
    const children = [];
    for (let i = 0; i < message.length; i += 1900) {
      children.push({
        object: "block",
        type: "paragraph",
        paragraph: { rich_text: rt(message.slice(i, i + 1900)) },
      });
    }
    const created = await notion("/pages", {
      method: "POST",
      body: JSON.stringify({ parent: { database_id: dbId }, properties: props, children }),
    });
    await notifyInquiry(
      { orgType: "수강생", org: `${category}${course ? " · " + course : ""}`, name, contact: contact || "(연락처 없음)", message, people: "", schedule: "", programs: "" },
      created?.url
    ).catch(() => {});
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error("question", e.message);
    res.status(500).json({ error: "접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." });
  }
};
