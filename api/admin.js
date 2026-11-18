// 관리자 페이지 API: 로그인, 자료·영상 등록(노션에 기록), 최근 목록, 공개/비공개 전환
const { notion } = require("./_notion");
const { isEnabled, checkPassword, isAdmin, loginCookie, logoutCookie } = require("./_admin-auth");
const crypto = require("crypto");
const { normalize, expiryMs, rtText, forget } = require("./_access");

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
        ...(b.locked === true ? { 공개범위: { select: { name: "코드 필요" } } } : {}),
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


// ── 접근 코드 관리 ───────────────────────────────────────────────────
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // 헷갈리는 글자(0 O 1 I L) 제외
const randomChunk = (n) => Array.from(crypto.randomBytes(n), (x) => ALPHABET[x % ALPHABET.length]).join("");
const newCode = () => `BANG-${randomChunk(4)}-${randomChunk(4)}`;
const validDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d));

function codeRow(page) {
  const p = page.properties;
  const exp = expiryMs(page);
  return {
    id: page.id,
    name: rtText(Object.values(p).find((v) => v.type === "title")?.title),
    code: rtText(p["접근코드"]?.rich_text),
    expires: p["만료일"]?.date?.start?.slice(0, 10) || "",
    expired: exp !== null && exp <= Date.now(),
    active: p["상태"]?.select?.name === "사용",
  };
}

async function queryAll(dbId, filter) {
  const out = [];
  let cursor;
  do {
    const data = await notion(`/databases/${dbId}/query`, {
      method: "POST",
      body: JSON.stringify({ page_size: 100, filter, ...(cursor ? { start_cursor: cursor } : {}) }),
    });
    out.push(...data.results);
    cursor = data.has_more ? data.next_cursor : null;
  } while (cursor);
  return out;
}

async function codeList(dbId) {
  const pages = await queryAll(dbId, { property: "유형", select: { equals: "코드" } });
  const codes = pages.map(codeRow).sort((a, b) => (a.expires || "9999") < (b.expires || "9999") ? 1 : -1);
  return [200, { codes }];
}

async function codeCreate(b, dbId) {
  const name = clip(b.name, 80);
  if (!name) return [400, { error: "기관·기수 이름을 입력해 주세요." }];
  const expires = clip(b.expires, 10);
  if (expires && !validDate(expires)) return [400, { error: "만료일 형식이 올바르지 않습니다." }];
  const code = normalize(b.code) || newCode();
  if (code.length < 6) return [400, { error: "코드는 영문·숫자 6자 이상으로 입력해 주세요." }];
  const dup = await queryAll(dbId, {
    and: [
      { property: "유형", select: { equals: "코드" } },
      { property: "접근코드", rich_text: { equals: code } },
    ],
  });
  if (dup.length) return [400, { error: "이미 있는 코드입니다. 다른 코드를 써 주세요." }];
  const page = await notion("/pages", {
    method: "POST",
    body: JSON.stringify({
      parent: { database_id: dbId },
      properties: {
        이름: { title: rt(name) },
        유형: { select: { name: "코드" } },
        상태: { select: { name: "사용" } },
        접근코드: { rich_text: rt(code) },
        ...(expires ? { 만료일: { date: { start: expires } } } : {}),
      },
    }),
  });
  return [200, { ok: true, code: codeRow(page) }];
}

async function loadCodePage(id) {
  const page = await notion(`/pages/${encodeURIComponent(clip(id, 60))}`);
  if (page.properties["유형"]?.select?.name !== "코드") return null;
  return page;
}

async function codeUpdate(b) {
  const page = await loadCodePage(b.id);
  if (!page) return [400, { error: "코드를 찾을 수 없습니다." }];
  const properties = {};
  if (typeof b.active === "boolean") properties["상태"] = { select: { name: b.active ? "사용" : "중지" } };
  if (b.expires !== undefined) {
    const expires = clip(b.expires, 10);
    if (expires && !validDate(expires)) return [400, { error: "만료일 형식이 올바르지 않습니다." }];
    properties["만료일"] = { date: expires ? { start: expires } : null };
  }
  await notion(`/pages/${page.id}`, { method: "PATCH", body: JSON.stringify({ properties }) });
  forget(page.id);
  return [200, { ok: true }];
}

async function codeDelete(b) {
  const page = await loadCodePage(b.id);
  if (!page) return [400, { error: "코드를 찾을 수 없습니다." }];
  await notion(`/pages/${page.id}`, { method: "PATCH", body: JSON.stringify({ in_trash: true }) });
  forget(page.id);
  return [200, { ok: true }];
}

// 프롬프트·자료 목록과 '코드 필요' 여부
async function lockList(dbId) {
  const pages = await queryAll(dbId, {
    or: ["프롬프트", "자료"].map((t) => ({ property: "유형", select: { equals: t } })),
  });
  const items = pages
    .filter((page) => ["발행", "초안"].includes(page.properties["상태"]?.select?.name))
    .map((page) => {
      const p = page.properties;
      return {
        id: page.id,
        title: text(Object.values(p).find((v) => v.type === "title")?.title),
        type: p["유형"]?.select?.name || "",
        category: p["카테고리"]?.select?.name || "",
        status: p["상태"]?.select?.name || "",
        locked: p["공개범위"]?.select?.name === "코드 필요",
        order: p["순서"]?.number ?? 9999,
      };
    })
    .sort((a, b) => a.type.localeCompare(b.type) || a.order - b.order);
  return [200, { items }];
}

async function setLock(b) {
  const page = await notion(`/pages/${encodeURIComponent(clip(b.id, 60))}`);
  if (!["프롬프트", "자료"].includes(page.properties["유형"]?.select?.name)) {
    return [400, { error: "프롬프트와 자료만 바꿀 수 있습니다." }];
  }
  await notion(`/pages/${page.id}`, {
    method: "PATCH",
    body: JSON.stringify({ properties: { 공개범위: { select: { name: b.locked === true ? "코드 필요" : "공개" } } } }),
  });
  return [200, { ok: true }];
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "GET") {
    res.status(200).json({
      enabled: isEnabled(),
      loggedIn: isAdmin(req),
      // 값은 내보내지 않고, 업로드 설정이 갖춰졌는지만 알려줍니다
      upload: {
        storeId: Boolean(process.env.BLOB_STORE_ID),
        webhookKey: Boolean(process.env.BLOB_WEBHOOK_PUBLIC_KEY),
        oidc: Boolean(req.headers["x-vercel-oidc-token"] || process.env.VERCEL_OIDC_TOKEN),
      },
    });
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
    if (b.action === "codeList") result = await codeList(dbId);
    if (b.action === "codeCreate") result = await codeCreate(b, dbId);
    if (b.action === "codeUpdate") result = await codeUpdate(b);
    if (b.action === "codeDelete") result = await codeDelete(b);
    if (b.action === "lockList") result = await lockList(dbId);
    if (b.action === "setLock") result = await setLock(b);
    res.status(result[0]).json(result[1]);
  } catch (e) {
    console.error("admin", e.message);
    res.status(500).json({ error: "처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." });
  }
};
