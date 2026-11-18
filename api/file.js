const { notion, listChildren } = require("./_notion");
const { getAccess } = require("./_access");

// 자료 공유: 노션 페이지 본문에 올린 첫 번째 파일(PDF 등)로 연결합니다.
// 노션 파일 주소는 1시간 뒤 만료되므로, 누를 때마다 새 주소를 받아 바로 넘겨줍니다.
const FILE_TYPES = ["pdf", "file", "image", "video", "audio"];

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const id = req.query.id;
  if (!process.env.NOTION_TOKEN || !id) {
    res.status(400).send("잘못된 요청입니다.");
    return;
  }
  try {
    const page = await notion(`/pages/${encodeURIComponent(id)}`);
    if ((page.properties["상태"]?.select?.name || null) !== "발행") {
      res.status(404).send("공개되지 않은 자료입니다.");
      return;
    }
    const props = page.properties;
    const locked = props["공개범위"]?.select?.name === "코드 필요" && ["자료", "프롬프트"].includes(props["유형"]?.select?.name);
    if (locked && !(await getAccess(req))) {
      res.status(403).setHeader("Content-Type", "text/html; charset=utf-8");
      res.send("<p style=\"font-family:sans-serif;padding:40px\">코드가 필요한 자료입니다. 사이트에서 코드를 입력한 뒤 다시 눌러 주세요.</p>");
      return;
    }
    // 잠긴 자료는 목록에 링크를 숨겨 두었으므로, 코드를 확인한 뒤 원래 링크로 보냅니다
    const given = props["링크"]?.url || "";
    if (locked && given && given.replace(/\/$/, "") !== "https://drive.google.com") {
      res.redirect(302, given);
      return;
    }
    const blocks = await listChildren(page.id);
    const wanted = req.query.kind === "video" ? ["video", ...FILE_TYPES] : FILE_TYPES;
    const block = wanted.map((t) => blocks.find((b) => b.type === t)).find(Boolean);
    const v = block && block[block.type];
    const url = v && (v.type === "external" ? v.external?.url : v.file?.url);
    if (!url) {
      res.status(404).setHeader("Content-Type", "text/html; charset=utf-8");
      res.send("<p style=\"font-family:sans-serif;padding:40px\">아직 파일이 올라오지 않은 자료입니다.</p>");
      return;
    }
    res.redirect(302, url);
  } catch (e) {
    res.status(500).send("자료를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }
};
