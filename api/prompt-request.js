// 프롬프트 신청: 구글폼 대신 사이트 안에서 받아 노션에 '프롬프트신청'(상태=접수)으로 저장합니다.
// 신청 내용은 사이트에 공개되지 않습니다. 스팸 방지: 숨은 입력칸, 너무 빠른 제출 거부, 같은 접속지의 연속 제출 제한, 링크 많은 글 거부.
const { notion } = require("./_notion");
const { notifyInquiry } = require("./_notify");

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
    const need = clip(b.need, 1000); // 어떤 상황의 프롬프트가 필요한지
    const name = clip(b.name, 40);
    const contact = clip(b.contact, 120);
    if (need.length < 5 || b.consent !== true) {
      res.status(400).json({ error: "필요한 프롬프트를 5자 이상 적고 동의해 주세요." });
      return;
    }
    const opened = Number(b.openedAt) || 0;
    if (opened && Date.now() - opened < 3000) {
      res.status(429).json({ error: "너무 빠르게 보내셨어요. 잠시 후 다시 시도해 주세요." });
      return;
    }
    if ((need.match(/https?:\/\//gi) || []).length > 2) {
      res.status(400).json({ error: "링크는 2개까지만 넣을 수 있어요." });
      return;
    }
    const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
    if (tooMany(ip)) {
      res.status(429).json({ error: "신청을 연달아 많이 보내셨어요. 잠시 후 다시 남겨 주세요." });
      return;
    }

    const title = need.replace(/\s+/g, " ").slice(0, 40);
    const props = {
      이름: { title: rt(title) },
      유형: { select: { name: "프롬프트신청" } },
      상태: { select: { name: "접수" } },
      담당자: { rich_text: rt(name) },
      연락처: { rich_text: rt(contact) },
      소분류: { rich_text: rt("프롬프트 신청") },
      설명: { rich_text: rt(need.slice(0, 1900)) },
    };
    const children = [];
    for (let i = 0; i < need.length; i += 1900) {
      children.push({
        object: "block",
        type: "paragraph",
        paragraph: { rich_text: rt(need.slice(i, i + 1900)) },
      });
    }
    const created = await notion("/pages", {
      method: "POST",
      body: JSON.stringify({ parent: { database_id: dbId }, properties: props, children }),
    });
    await notifyInquiry(
      { orgType: "프롬프트 신청", org: "프롬프트 신청", name: name || "(이름 없음)", contact: contact || "(연락처 없음)", message: need, people: "", schedule: "", programs: "" },
      created?.url
    ).catch(() => {});
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error("prompt-request", e.message);
    res.status(500).json({ error: "접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." });
  }
};
