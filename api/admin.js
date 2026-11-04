// 관리자 페이지 API: 로그인, 자료·영상 등록(노션에 기록), 최근 목록, 공개/비공개 전환
const { notion } = require("./_notion");
const { isEnabled, checkPassword, isAdmin, loginCookie, logoutCookie } = require("./_admin-auth");

const TYPES = ["자료", "영상"];
const clip = (v, n) => String(v || "").trim().slice(0, n);
const rt = (s) => (s ? [{ type: "text", text: { content: s } }] : []);
const text = (arr = []) => arr.map((t) => t.plain_text).join("");
const statusOf = (published) => (published ? "발행" : "초안");

function paragraphs(body) {
  const blocks = [];
  for (const line of body.split(/\n+/).map((l) => l.trim()).filter(Boolean)) {
    for (let i = 0; i < line.length && blocks.length < 100; i += 1900) {
      blocks.push({ object: "block", type: "paragraph", paragraph: { rich_text: rt(line.slice(i, i + 1900)) } });
    }
  }
  return blocks;
}

function validLink(link) {
  try {
    return new URL(link).protocol === "https:";
  } catch (e) {
    return false;
  }
}

async function publish(b, dbId) {
  const type = TYPES.includes(b.type) ? b.type : null;
  const title = clip(b.title, 120);
  const link = clip(b.link, 1500);
  if (!type || !title) return [400, { error: "유형과 제목을 입력해 주세요." }];
  if (!validLink(link)) return [400, { error: "첨부 파일이나 https 링크가 필요합니다." }];
  const created = await notion("/pages", {
    method: "POST",
    body: JSON.stringify({
      parent: { database_id: dbId },
      properties: {
        이름: { title: rt(title) },
        유형: { select: { name: type } },
        상태: { select: { name: statusOf(b.published !== false) } },
        링크: { url: link },
        설명: { rich_text: rt(clip(b.description, 300)) },
        순서: { number: 0 }, // 새로 올린 것이 목록 맨 앞에 오도록
      },
      children: paragraphs(clip(b.body, 8000)),
    }),
  });
  return [200, { ok: true, id: created.id }];
}

async function list(dbId) {
  const data = await notion(`/databases/${dbId}/query`, {
    method: "POST",
    body: JSON.stringify({
      page_size: 30,
      filter: { or: TYPES.map((t) => ({ property: "유형", select: { equals: t } })) },
      sorts: [{ timestamp: "created_time", direction: "descending" }],
    }),
  });
  const items = data.results.map((page) => {
    const p = page.properties;
    return {
      id: page.id,
      title: text(Object.values(p).find((v) => v.type === "title")?.title),
      type: p["유형"]?.select?.name || "",
      status: p["상태"]?.select?.name || "",
      createdTime: page.created_time,
    };
  });
  return [200, { items }];
}

async function setStatus(b) {
  const page = await notion(`/pages/${encodeURIComponent(clip(b.id, 60))}`);
  if (!TYPES.includes(page.properties["유형"]?.select?.name)) return [400, { error: "자료와 영상만 바꿀 수 있습니다." }];
  await notion(`/pages/${page.id}`, {
    method: "PATCH",
    body: JSON.stringify({ properties: { 상태: { select: { name: statusOf(b.published === true) } } } }),
  });
  return [200, { ok: true }];
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "GET") {
    res.status(200).json({ enabled: isEnabled(), loggedIn: isAdmin(req) });
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }
  try {
    const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    if (b.action === "login") {
      if (!checkPassword(b.password)) {
        await new Promise((r) => setTimeout(r, 800)); // 비밀번호 대입을 늦춤
        res.status(401).json({ error: "비밀번호가 맞지 않습니다." });
        return;
      }
      res.setHeader("Set-Cookie", loginCookie());
      res.status(200).json({ ok: true });
      return;
    }
    if (b.action === "logout") {
      res.setHeader("Set-Cookie", logoutCookie());
      res.status(200).json({ ok: true });
      return;
    }
    if (!isAdmin(req)) {
      res.status(401).json({ error: "로그인이 필요합니다." });
      return;
    }
    const dbId = process.env.NOTION_CONTENT_DB_ID;
    let result = [400, { error: "알 수 없는 요청입니다." }];
    if (b.action === "publish") result = await publish(b, dbId);
    if (b.action === "list") result = await list(dbId);
    if (b.action === "setStatus") result = await setStatus(b);
    res.status(result[0]).json(result[1]);
  } catch (e) {
    console.error("admin", e.message);
    res.status(500).json({ error: "처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." });
  }
};
