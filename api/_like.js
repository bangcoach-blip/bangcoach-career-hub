// 좋아요: 브라우저마다 서명된 쿠키에 '누른 글의 짧은 지문'을 기록해 같은 글을 두 번 올리지 못하게 합니다.
// (로그인이 없는 방식이라, 쿠키를 지우면 다시 누를 수 있습니다. 가볍게 막는 용도입니다.)
const crypto = require("crypto");

const COOKIE = "bc_likes";
const MAX_LIKES = 300; // 한 브라우저가 기록할 수 있는 최대 개수
const WIDTH = 10; // 지문 길이(글자)
const MIN_SECRET = 10;

const secret = () => process.env.ACCESS_SECRET || process.env.ADMIN_PASSWORD || "";
const isEnabled = () => secret().length >= MIN_SECRET;
const short = (id) => crypto.createHash("sha256").update(String(id)).digest("hex").slice(0, WIDTH);
const sign = (body) => crypto.createHmac("sha256", `likes:${secret()}`).update(body).digest("hex").slice(0, 32);

function safeEqual(a, b) {
  const x = crypto.createHash("sha256").update(String(a)).digest();
  const y = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}

// 쿠키에서 지문 목록을 읽습니다. 서명이 맞지 않으면 빈 목록입니다.
function readLiked(req) {
  const match = (req.headers.cookie || "").match(new RegExp(`(?:^|;\\s*)${COOKIE}=([0-9a-f]*)\\.([0-9a-f]+)`));
  if (!match || !isEnabled() || !safeEqual(match[2], sign(match[1]))) return [];
  const out = [];
  for (let i = 0; i + WIDTH <= match[1].length; i += WIDTH) out.push(match[1].slice(i, i + WIDTH));
  return out;
}

function likedCookie(hashes) {
  const body = hashes.slice(-MAX_LIKES).join("");
  return `${COOKIE}=${body}.${sign(body)}; Path=/; Max-Age=${365 * 24 * 60 * 60}; HttpOnly; Secure; SameSite=Lax`;
}

const normalizeId = (v) => String(v || "").replace(/-/g, "").toLowerCase();

module.exports = { isEnabled, short, readLiked, likedCookie, normalizeId, MAX_LIKES };
