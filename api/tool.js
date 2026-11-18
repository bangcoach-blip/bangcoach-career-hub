// 도구 페이지 전달: /tool/<id> (안내 페이지), /tool/<id>/s0 (첫 번째 샘플)...
// 어드민에서 올린 파일은 저장소 주소를 숨긴 채 여기서 대신 내려주고, '코드 필요'면 코드를 확인합니다.
const { notion } = require("./_notion");
const { getAccess } = require("./_access");
const { parseFiles, isBlob } = require("./_tools");

const BACK =
  '<a class="bc-back" href="/#prompts">← 방영황 사이트</a>' +
  "<style>.bc-back{position:fixed;left:14px;bottom:14px;z-index:2147483000;padding:9px 14px;border-radius:999px;" +
  "background:#0a0a0a;color:#fff!important;font:700 13px/1 'Pretendard Variable',Pretendard,'Malgun Gothic',sans-serif;" +
  "text-decoration:none;box-shadow:0 6px 18px rgba(0,0,0,.25)}.bc-back:hover{background:#4f46e5}" +
  "@media print{.bc-back{display:none}}</style>";

const page = (status, message) => ({
  status,
  html: `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>방영황</title>
<body style="font-family:'Malgun Gothic',sans-serif;padding:48px 20px;max-width:520px;margin:0 auto;line-height:1.7">
<p>${message}</p><p><a href="/#prompts">← 사이트로 돌아가기</a></p></body>`,
});

function inject(html) {
  const i = html.lastIndexOf("</body>");
  return i === -1 ? html + BACK : html.slice(0, i) + BACK + html.slice(i);
}

module.exports = async function handler(req, res) {
  const send = ({ status, html }) => {
    res.status(status).setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.send(html);
  };
  const id = String(req.query.id || "");
  const key = String(req.query.f || "main");
  if (!/^[0-9a-f-]{32,36}$/i.test(id) || !/^(main|s\d{1,2})$/.test(key)) return send(page(404, "찾을 수 없는 페이지입니다."));
  try {
    const row = await notion(`/pages/${encodeURIComponent(id)}`);
    const p = row.properties;
    if (p["상태"]?.select?.name !== "발행" || p["유형"]?.select?.name !== "도구") return send(page(404, "공개되지 않은 도구입니다."));
    const files = parseFiles((p["도구파일"]?.rich_text || []).map((t) => t.plain_text).join(""));
    if (!files) return send(page(404, "아직 파일이 올라오지 않은 도구입니다."));
    const url = key === "main" ? files.main : files.samples[Number(key.slice(1))]?.url;
    if (!url) return send(page(404, "찾을 수 없는 페이지입니다."));
    if (!isBlob(url)) {
      res.redirect(302, url); // 사이트 폴더에 있는 공개 파일
      return;
    }
    const locked = p["공개범위"]?.select?.name === "코드 필요" && isBlob(files.main);
    if (locked && !(await getAccess(req))) {
      return send(page(403, "이 도구는 강의에서 안내받은 코드가 있어야 열 수 있어요. 사이트에서 코드를 입력한 뒤 다시 눌러 주세요."));
    }
    const upstream = await fetch(url);
    if (!upstream.ok) return send(page(502, "도구를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."));
    const html = inject(await upstream.text());
    res.status(200).setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", locked ? "private, no-store" : "public, s-maxage=60, stale-while-revalidate=300");
    res.send(html);
  } catch (e) {
    if (/^Notion (400|404)/.test(String(e.message))) return send(page(404, "찾을 수 없는 페이지입니다."));
    console.error("tool", e.message);
    send(page(500, "도구를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."));
  }
};
