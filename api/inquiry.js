const { notion } = require("./_notion");
const { notifyInquiry } = require("./_notify");

const TYPES = ["대학", "공공기관", "기업", "기타"];
const clip = (v, n) => String(v || "").trim().slice(0, n);
const rt = (s) => (s ? [{ type: "text", text: { content: s } }] : []);

module.exports = async function handler(req, res) {
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
      res.status(200).json({ ok: true });
      return;
    }
    const org = clip(b.org, 80);
    const name = clip(b.name, 40);
    const contact = clip(b.contact, 120);
    const message = clip(b.message, 3000);
    const orgType = TYPES.includes(b.orgType) ? b.orgType : "기타";
    if (!org || !name || !contact || !message || b.consent !== true) {
      res.status(400).json({ error: "필수 항목을 모두 입력해 주세요." });
      return;
    }
    const props = {
      이름: { title: rt(`[${orgType}] ${org} · ${name}`) },
      유형: { select: { name: "문의" } },
      상태: { select: { name: "접수" } },
      기관유형: { select: { name: orgType } },
      담당자: { rich_text: rt(name) },
      연락처: { rich_text: rt(contact) },
      대상: { rich_text: rt(clip(b.people, 120)) },
      기간: { rich_text: rt(clip(b.schedule, 120)) },
      소분류: { rich_text: rt(clip(b.programs, 300)) },
      설명: { rich_text: rt(message.slice(0, 1900)) },
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
    // 이메일·카카오톡 알림 (실패해도 접수는 완료로 처리)
    await notifyInquiry(
      { orgType, org, name, contact, message, people: clip(b.people, 120), schedule: clip(b.schedule, 120), programs: clip(b.programs, 300) },
      created?.url
    ).catch(() => {});
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." });
  }
};
