const { notion, renderBlocks, listChildren, pageMeta } = require("./_notion");

module.exports = async function handler(req, res) {
  if (!process.env.NOTION_TOKEN || !process.env.NOTION_DATABASE_ID) {
    res.status(200).json({ configured: false, posts: [] });
    return;
  }
  try {
    const id = req.query.id;
    // 글 본문(?id)은 캐시하지 않고, 목록만 1분 캐시
    res.setHeader("Cache-Control", id ? "no-store" : "s-maxage=60");

    if (id) {
      const page = await notion(`/pages/${encodeURIComponent(id)}`);
      const meta = pageMeta(page);
      if (!meta.published) {
        res.status(404).json({ error: "not found" });
        return;
      }
      const html = await renderBlocks(await listChildren(page.id));
      res.status(200).json({ ...meta, html });
      return;
    }

    const posts = [];
    let cursor;
    do {
      const data = await notion(`/databases/${process.env.NOTION_DATABASE_ID}/query`, {
        method: "POST",
        body: JSON.stringify({ page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) }),
      });
      posts.push(...data.results.map(pageMeta));
      cursor = data.has_more ? data.next_cursor : null;
    } while (cursor);

    const list = posts
      .filter((p) => p.published && p.title)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    res.status(200).json({ configured: true, posts: list });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
};
