// 방문자 코드 입력: 맞는 코드면 만료일까지 유효한 쿠키를 주고, 현재 열림 상태를 알려 줍니다.
const { isEnabled, findCode, cookieFor, clearCookie, getAccess } = require("./_access");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.method === "GET") {
      const access = await getAccess(req);
      res.status(200).json({ enabled: isEnabled(), unlocked: Boolean(access), expires: access ? access.until : null });
      return;
    }
    if (req.method !== "POST") {
      res.status(405).json({ error: "method not allowed" });
      return;
    }
    const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    if (b.action === "logout") {
      res.setHeader("Set-Cookie", clearCookie());
      res.status(200).json({ ok: true });
      return;
    }
    if (!isEnabled()) {
      res.status(503).json({ error: "코드 기능이 아직 준비되지 않았습니다." });
      return;
    }
    const page = await findCode(b.code);
    if (!page) {
      await new Promise((r) => setTimeout(r, 800)); // 코드 대입을 늦춤
      res.status(401).json({ error: "코드가 맞지 않거나 사용 기간이 끝났습니다." });
      return;
    }
    const { cookie, until } = cookieFor(page);
    res.setHeader("Set-Cookie", cookie);
    res.status(200).json({ ok: true, unlocked: true, expires: until });
  } catch (e) {
    console.error("access", e.message);
    res.status(500).json({ error: "확인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." });
  }
};
