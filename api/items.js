const { notion, listChildren } = require("./_notion");

const text = (arr = []) => arr.map((t) => t.plain_text).join("");

module.exports = async function handler(req, res) {
  const dbId = process.env.NOTION_CONTENT_DB_ID;
  if (!process.env.NOTION_TOKEN || !dbId) {
    res.status(200).json({ configured: false, items: [] });
    return;
  }
  try {
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=60");

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
      res.status(200).json({ body });
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
        items.push({
          id: page.id,
          subCategory: text(p["소분류"]?.rich_text),
          title,
          type: p["유형"]?.select?.name || "",
          link: p["링크"]?.url || "",
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
