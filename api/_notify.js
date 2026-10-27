// 강의 문의 알림: 이메일(Resend)과 카카오톡 "나에게 보내기".
// 환경변수가 없는 채널은 조용히 건너뛰고, 알림이 실패해도 문의 접수는 막지 않습니다.
//
// 이메일: RESEND_API_KEY, NOTIFY_EMAIL(받을 주소, Resend 가입 이메일)
// 카카오톡: KAKAO_REST_KEY, KAKAO_REFRESH_TOKEN, (선택) KAKAO_CLIENT_SECRET

const SITE = "https://bangcoach-ai-career-site.vercel.app";

function summaryLines(q) {
  return [
    `기관: [${q.orgType}] ${q.org}`,
    `담당자: ${q.name}`,
    `연락처: ${q.contact}`,
    q.people && `대상·인원: ${q.people}`,
    q.schedule && `희망 일정: ${q.schedule}`,
    q.programs && `관심 프로그램: ${q.programs}`,
  ].filter(Boolean);
}

const escHtml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function sendEmail(q, notionUrl) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL;
  if (!key || !to) return "skip";
  const lines = summaryLines(q);
  const html = `
    <div style="font-family:sans-serif;line-height:1.7;color:#111">
      <h2 style="margin:0 0 12px">새 강의 문의가 접수됐습니다</h2>
      <p>${lines.map(escHtml).join("<br>")}</p>
      <p style="padding:14px 16px;background:#f5f5ff;border-radius:10px;white-space:pre-wrap">${escHtml(q.message)}</p>
      ${notionUrl ? `<p><a href="${notionUrl}">노션에서 문의 보기</a></p>` : ""}
    </div>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.NOTIFY_FROM || "강의 문의 알림 <onboarding@resend.dev>",
      to: [to],
      reply_to: q.contact.includes("@") ? q.contact : undefined,
      subject: `[강의 문의] ${q.org} · ${q.name}`,
      html,
    }),
  });
  return res.ok ? "ok" : `email ${res.status}`;
}

async function sendKakao(q, notionUrl) {
  const clientId = process.env.KAKAO_REST_KEY;
  const refresh = process.env.KAKAO_REFRESH_TOKEN;
  if (!clientId || !refresh) return "skip";

  const form = new URLSearchParams({ grant_type: "refresh_token", client_id: clientId, refresh_token: refresh });
  if (process.env.KAKAO_CLIENT_SECRET) form.set("client_secret", process.env.KAKAO_CLIENT_SECRET);
  const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body: form,
  });
  const token = await tokenRes.json();
  if (!token.access_token) return `kakao token ${tokenRes.status}`;

  const text = ["📩 새 강의 문의", ...summaryLines(q), "", q.message.slice(0, 300)].join("\n").slice(0, 200);
  const link = { web_url: notionUrl || SITE, mobile_web_url: notionUrl || SITE };
  const sendRes = await fetch("https://kapi.kakao.com/v2/api/talk/memo/default/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
    body: new URLSearchParams({
      template_object: JSON.stringify({ object_type: "text", text, link, button_title: "문의 보기" }),
    }),
  });
  // 카카오 갱신 토큰은 약 2개월 뒤 만료됩니다. 만료가 가까워 새 토큰이 오면 다시 연결하라고 알려줍니다.
  if (token.refresh_token) return sendRes.ok ? "ok (refresh token renewed: reconnect needed)" : `kakao ${sendRes.status}`;
  return sendRes.ok ? "ok" : `kakao ${sendRes.status}`;
}

async function notifyInquiry(q, notionUrl) {
  const results = await Promise.allSettled([sendEmail(q, notionUrl), sendKakao(q, notionUrl)]);
  const [email, kakao] = results.map((r) => (r.status === "fulfilled" ? r.value : `error ${r.reason?.message || r.reason}`));
  // 카카오 연결이 곧 끊길 예정이면 이메일로 재연결 안내
  if (String(kakao).includes("reconnect") && process.env.RESEND_API_KEY && process.env.NOTIFY_EMAIL) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.NOTIFY_FROM || "강의 문의 알림 <onboarding@resend.dev>",
        to: [process.env.NOTIFY_EMAIL],
        subject: "[사이트] 카카오톡 알림 연결을 다시 해 주세요",
        html: `<p>카카오톡 알림 연결이 곧 만료됩니다. <a href="${SITE}/api/kakao-auth">${SITE}/api/kakao-auth</a> 에서 다시 로그인한 뒤, 새 값으로 Vercel의 KAKAO_REFRESH_TOKEN을 바꿔 주세요.</p>`,
      }),
    }).catch(() => {});
  }
  return { email, kakao };
}

module.exports = { notifyInquiry };
