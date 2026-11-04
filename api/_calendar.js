// 구글 캘린더 빈 시간 계산. 서비스 계정은 "바쁜 시간대"만 받을 수 있어 일정 제목·내용은 애초에 들어오지 않습니다.
// 환경변수: GOOGLE_SA_JSON(서비스 계정 키 JSON 전체), GOOGLE_CALENDAR_IDS(캘린더 ID, 여러 개면 쉼표)
const crypto = require("crypto");

const KST = 9 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const WORK_START = 9; // 강의 가능 시간 시작(시)
const WORK_END = 18; // 강의 가능 시간 끝(시)
const MIN_SLOT = HOUR; // 1시간 미만의 틈은 빈 시간으로 치지 않음
const RANGE_DAYS = 56; // 앞으로 8주

const b64url = (v) => Buffer.from(v).toString("base64url");

async function accessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/calendar.freebusy",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64url(JSON.stringify(claim))}`;
  const signature = crypto.createSign("RSA-SHA256").update(unsigned).sign(sa.private_key).toString("base64url");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`token ${res.status}`);
  return data.access_token;
}

async function fetchBusy(sa, calendarIds, timeMin, timeMax) {
  const token = await accessToken(sa);
  const res = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      timeMin: new Date(timeMin).toISOString(),
      timeMax: new Date(timeMax).toISOString(),
      timeZone: "Asia/Seoul",
      items: calendarIds.map((id) => ({ id })),
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`freeBusy ${res.status}`);
  const busy = [];
  for (const id of calendarIds) {
    const cal = data.calendars?.[id];
    if (!cal || cal.errors?.length) throw new Error(`calendar access ${cal?.errors?.[0]?.reason || "missing"}`);
    for (const b of cal.busy) busy.push([Date.parse(b.start), Date.parse(b.end)]);
  }
  return busy;
}

const hhmm = (ms) => new Date(ms + KST).toISOString().slice(11, 16);

// 내일부터 8주간, 날짜별 상태와 빈 시간만 만듭니다. 바쁜 구간 자체는 내보내지 않습니다.
function computeDays(busy, now = Date.now()) {
  const todayStart = Math.floor((now + KST) / DAY) * DAY - KST;
  const days = [];
  for (let i = 1; i <= RANGE_DAYS; i++) {
    const dayStart = todayStart + i * DAY;
    const local = new Date(dayStart + KST);
    const date = local.toISOString().slice(0, 10);
    const weekday = local.getUTCDay();
    if (weekday === 0 || weekday === 6) {
      days.push({ date, status: "weekend", free: [] });
      continue;
    }
    const open = dayStart + WORK_START * HOUR;
    const close = dayStart + WORK_END * HOUR;
    const overlaps = busy
      .map(([s, e]) => [Math.max(s, open), Math.min(e, close)])
      .filter(([s, e]) => s < e)
      .sort((a, b) => a[0] - b[0]);
    const free = [];
    let cursor = open;
    for (const [s, e] of overlaps) {
      if (s - cursor >= MIN_SLOT) free.push([cursor, s]);
      cursor = Math.max(cursor, e);
    }
    if (close - cursor >= MIN_SLOT) free.push([cursor, close]);
    const status = overlaps.length === 0 ? "open" : free.length ? "partial" : "full";
    days.push({ date, status, free: free.map(([s, e]) => [hhmm(s), hhmm(e)]) });
  }
  return { days, from: todayStart + DAY, to: todayStart + (RANGE_DAYS + 1) * DAY };
}

async function getAvailability(now = Date.now()) {
  const sa = JSON.parse(process.env.GOOGLE_SA_JSON);
  const ids = process.env.GOOGLE_CALENDAR_IDS.split(",").map((s) => s.trim()).filter(Boolean);
  const { from, to } = computeDays([], now);
  const busy = await fetchBusy(sa, ids, from, to);
  return computeDays(busy, now).days;
}

module.exports = { getAvailability, computeDays, WORK_START, WORK_END };
