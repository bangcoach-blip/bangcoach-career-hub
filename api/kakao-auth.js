// 카카오톡 알림 연결 도우미 (처음 한 번, 그리고 약 2개월마다 한 번)
// 1) 이 주소를 열면 카카오 로그인으로 이동합니다.
// 2) 로그인·동의 후 돌아오면 KAKAO_REFRESH_TOKEN 값을 보여줍니다. Vercel 환경변수에 붙여넣으세요.
// 카카오 개발자 앱의 Redirect URI에 https://<사이트 주소>/api/kakao-auth 를 등록해야 합니다.

const page = (body) =>
  `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>카카오톡 알림 연결</title>
  <div style="font-family:sans-serif;max-width:640px;margin:48px auto;padding:0 20px;line-height:1.7;color:#111">${body}</div>`;

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  const clientId = process.env.KAKAO_REST_KEY;
  if (!clientId) {
    res.status(503).send(page("<h2>먼저 Vercel에 KAKAO_REST_KEY를 넣고 다시 배포해 주세요.</h2>"));
    return;
  }
  const redirectUri = `https://${req.headers.host}/api/kakao-auth`;

  if (!req.query.code) {
    const url = new URL("https://kauth.kakao.com/oauth/authorize");
    url.search = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, response_type: "code", scope: "talk_message" });
    res.redirect(302, url.toString());
    return;
  }

  const form = new URLSearchParams({ grant_type: "authorization_code", client_id: clientId, redirect_uri: redirectUri, code: req.query.code });
  if (process.env.KAKAO_CLIENT_SECRET) form.set("client_secret", process.env.KAKAO_CLIENT_SECRET);
  const r = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body: form,
  });
  const t = await r.json();
  if (!t.refresh_token) {
    res.status(400).send(page(`<h2>연결에 실패했습니다</h2><p>${String(t.error_description || t.error || r.status)}</p>`));
    return;
  }
  res.status(200).send(
    page(`<h2>카카오톡 알림 연결 준비 완료</h2>
    <p>아래 값을 복사해 Vercel → Settings → Environment Variables에 <b>KAKAO_REFRESH_TOKEN</b>으로 저장한 뒤 다시 배포하세요. 이 값은 다른 사람에게 보내거나 채팅에 붙여넣지 마세요.</p>
    <textarea readonly style="width:100%;height:90px;font-family:monospace" onclick="this.select()">${t.refresh_token}</textarea>
    <p style="color:#666">유효 기간: 약 ${Math.round((t.refresh_token_expires_in || 0) / 86400)}일</p>`)
  );
};
