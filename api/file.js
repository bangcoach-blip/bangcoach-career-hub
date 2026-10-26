const { notion, listChildren } = require("./_notion");

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
    const block = (await listChildren(page.id)).find((b) => FILE_TYPES.includes(b.type));
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
