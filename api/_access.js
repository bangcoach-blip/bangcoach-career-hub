// 접근 코드: 관리자가 만든 공용 코드를 입력한 방문자에게 만료일까지 유효한 서명 쿠키를 줍니다.
// 코드 정보는 노션 콘텐츠 DB의 '코드' 유형 행(상태 사용/중지, 접근코드, 만료일)에 있습니다.
// 상태가 '발행'이 아니라서 공개 목록(/api/items 등)에는 나오지 않습니다.
const crypto = require("crypto");
const { notion } = require("./_notion");

const COOKIE = "bc_access";
const MAX_COOKIE_DAYS = 90;
const MIN_SECRET = 10;
const LIVE_CACHE_MS = 60 * 1000; // 노션에서 중지하면 늦어도 1분 안에 막힙니다
const live = new Map();

const secret = () => process.env.ACCESS_SECRET || process.env.ADMIN_PASSWORD || "";
const isEnabled = () => secret().length >= MIN_SECRET;
const sign = (payload) => crypto.createHmac("sha256", `access:${secret()}`).update(payload).digest("hex");

function safeEqual(a, b) {
  const x = crypto.createHash("sha256").update(String(a)).digest();
  const y = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}

const normalize = (code) => String(code || "").toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 40);

// 만료일(YYYY-MM-DD)의 한국 시간 23:59:59까지 사용 가능. 비어 있으면 기간 제한 없음(null)
function expiryMs(page) {
  const start = page.properties["만료일"]?.date?.start;
  if (!start) return null;
  const t = Date.parse(`${start.slice(0, 10)}T23:59:59+09:00`);
  return Number.isFinite(t) ? t : null;
}

const rtText = (arr = []) => arr.map((t) => t.plain_text).join("");

// 코드 행이 지금 쓸 수 있는 상태인지
function usable(page) {
  if (!page || page.archived || page.in_trash) return false;
  const p = page.properties;
  if (p["유형"]?.select?.name !== "코드" || p["상태"]?.select?.name !== "사용") return false;
  const exp = expiryMs(page);
  return exp === null || exp > Date.now();
}

async function findCode(input) {
  const code = normalize(input);
  const dbId = process.env.NOTION_CONTENT_DB_ID;
  if (code.length < 4 || !dbId) return null;
  const data = await notion(`/databases/${dbId}/query`, {
    method: "POST",
    body: JSON.stringify({
      page_size: 5,
      filter: {
        and: [
          { property: "유형", select: { equals: "코드" } },
          { property: "접근코드", rich_text: { equals: code } },
        ],
      },
    }),
  });
  return data.results.find(usable) || null;
}

function cookieFor(page) {
  const exp = expiryMs(page);
  const cap = Date.now() + MAX_COOKIE_DAYS * 24 * 60 * 60 * 1000;
  const until = Math.min(exp ?? cap, cap);
  const payload = `${page.id}.${Math.floor(until / 1000)}`;
  const maxAge = Math.max(1, Math.floor((until - Date.now()) / 1000));
  return {
    cookie: `${COOKIE}=${payload}.${sign(payload)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`,
    until,
  };
}

const clearCookie = () => `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;

function readToken(req) {
  const match = (req.headers.cookie || "").match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  if (!match) return null;
  const parts = match[1].split(".");
  if (parts.length !== 3) return null;
  const [id, exp, sig] = parts;
  if (!isEnabled() || !safeEqual(sig, sign(`${id}.${exp}`))) return null;
  if (Number(exp) * 1000 <= Date.now()) return null;
  return { id, until: Number(exp) * 1000 };
}

// 쿠키가 유효하고, 그 코드가 아직 사용 중이면 { name, until }을 돌려줍니다.
async function getAccess(req) {
  const token = readToken(req);
  if (!token) return null;
  const hit = live.get(token.id);
  if (hit && Date.now() - hit.at < LIVE_CACHE_MS) return hit.ok ? hit.value : null;
  let value = null;
  try {
    const page = await notion(`/pages/${encodeURIComponent(token.id)}`);
    if (usable(page)) {
      const exp = expiryMs(page);
      value = {
        name: rtText(Object.values(page.properties).find((v) => v.type === "title")?.title),
        until: Math.min(token.until, exp ?? token.until),
      };
    }
  } catch (e) {
    return null; // 확인할 수 없으면 열어 주지 않습니다
  }
  live.set(token.id, { ok: Boolean(value), value, at: Date.now() });
  return value;
}

const forget = (id) => live.delete(id);

module.exports = { isEnabled, normalize, findCode, cookieFor, clearCookie, getAccess, forget, expiryMs, rtText };
