const { notion, listChildren, renderBlocks } = require("./_notion");

const text = (arr = []) => arr.map((t) => t.plain_text).join("");

module.exports = async function handler(req, res) {
  const dbId = process.env.NOTION_CONTENT_DB_ID;
  if (!process.env.NOTION_TOKEN || !dbId) {
    res.status(200).json({ configured: false, items: [] });
    return;
  }
  try {
    // 본문(?id)은 노션 수정이 바로 보이도록 캐시하지 않고, 목록만 1분 캐시
    res.setHeader("Cache-Control", req.query.id ? "no-store" : "s-maxage=60");

    if (req.query.id) {
      const page = await notion(`/pages/${encodeURIComponent(req.query.id)}`);
      if ((page.properties["상태"]?.select?.name || null) !== "발행") {
        res.status(404).json({ error: "not found" });
        return;
      }
      const blocks = await listChildren(page.id);
      const body = blocks
        .map((b) => text(b[b.type]?.rich_text))
        .join("\n")
        .trim();
      const html = req.query.html ? await renderBlocks(blocks) : undefined;
      res.status(200).json({ body, html });
      return;
    }

    const type = req.query.type;
    const items = [];
    let cursor;
    do {
      const data = await notion(`/databases/${dbId}/query`, {
        method: "POST",
        body: JSON.stringify({ page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) }),
      });
      for (const page of data.results) {
        const p = page.properties;
        const published = (p["상태"]?.select?.name || null) === "발행";
        if (!published) continue;
        if (type && p["유형"]?.select?.name !== type) continue;
        const title = text(Object.values(p).find((v) => v.type === "title")?.title);
        if (!title) continue;
        const itemType = p["유형"]?.select?.name || "";
        let link = p["링크"]?.url || "";
        // 자료: 링크 칸이 비어 있으면 페이지 본문에 올린 파일로 연결
        if (itemType === "자료" && (!link || link.replace(/\/$/, "") === "https://drive.google.com")) {
          link = `/api/file?id=${page.id}`;
        }
        items.push({
          id: page.id,
          subCategory: text(p["소분류"]?.rich_text),
          period: text(p["기간"]?.rich_text),
          audience: text(p["대상"]?.rich_text),
          duration: text(p["시간"]?.rich_text),
          curriculum: text(p["커리큘럼"]?.rich_text),
          effect: text(p["기대효과"]?.rich_text),
          mode: text(p["진행방식"]?.rich_text),
          title,
          type: itemType,
          link,
          description: text(p["설명"]?.rich_text),
          category: p["카테고리"]?.select?.name || "",
          order: p["순서"]?.number ?? 9999,
          createdTime: page.created_time,
        });
      }
      cursor = data.has_more ? data.next_cursor : null;
    } while (cursor);

    items.sort((a, b) => a.order - b.order || (a.createdTime < b.createdTime ? 1 : -1));
    res.status(200).json({ configured: true, items });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
};
