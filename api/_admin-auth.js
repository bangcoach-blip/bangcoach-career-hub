// 관리자 로그인: 비밀번호(ADMIN_PASSWORD)가 맞으면 7일짜리 서명 쿠키를 줍니다.
const crypto = require("crypto");

const COOKIE = "bc_admin";
const MAX_AGE = 7 * 24 * 60 * 60;
const MIN_PASSWORD = 10;

const password = () => process.env.ADMIN_PASSWORD || "";
const isEnabled = () => password().length >= MIN_PASSWORD;
const sign = (exp) => crypto.createHmac("sha256", password()).update(`admin:${exp}`).digest("hex");

function safeEqual(a, b) {
  const x = crypto.createHash("sha256").update(String(a)).digest();
  const y = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}

const checkPassword = (input) => isEnabled() && safeEqual(input, password());

function isAdmin(req) {
  if (!isEnabled()) return false;
  const match = (req.headers.cookie || "").match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  if (!match) return false;
  const [exp, sig] = match[1].split(".");
  return Number(exp) > Date.now() / 1000 && safeEqual(sig, sign(exp));
}

function loginCookie() {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  return `${COOKIE}=${exp}.${sign(exp)}; Path=/api; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Strict`;
}

const logoutCookie = () => `${COOKIE}=; Path=/api; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;

module.exports = { isEnabled, checkPassword, isAdmin, loginCookie, logoutCookie };
