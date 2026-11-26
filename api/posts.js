// 블로그: 사이트 콘텐츠 DB(NOTION_CONTENT_DB_ID)에서 유형이 '블로그'이고 상태가 '발행'인 글만 보여줍니다.
const { notion, renderBlocks, listChildren, pageMeta } = require("./_notion");

const BLOG = "블로그";
const norm = (v) => String(v || "").replace(/-/g, "").toLowerCase();

module.exports = async function handler(req, res) {
  const dbId = process.env.NOTION_CONTENT_DB_ID;
  if (!process.env.NOTION_TOKEN || !dbId) {
    res.status(200).json({ configured: false, posts: [] });
    return;
  }
  try {
    const id = req.query.id;
    // 글 본문(?id)은 캐시하지 않고, 목록만 1분 캐시
    res.setHeader("Cache-Control", id ? "no-store" : "s-maxage=60");

    if (id) {
      const page = await notion(`/pages/${encodeURIComponent(id)}`);
      const status = page.properties["상태"]?.select?.name || "";
      const isBlog =
        norm(page.parent?.database_id) === norm(dbId) && page.properties["유형"]?.select?.name === BLOG;
      // 이 사이트의 블로그 글이 아니거나 발행 전이면 열리지 않음
      if (!isBlog || status !== "발행") {
        res.status(404).json({ error: "not found" });
        return;
      }
      const html = await renderBlocks(await listChildren(page.id));
      res.status(200).json({ ...pageMeta(page), html });
      return;
    }

    const posts = [];
    let cursor;
    do {
      const data = await notion(`/databases/${dbId}/query`, {
        method: "POST",
        body: JSON.stringify({
          page_size: 100,
          filter: {
            and: [
              { property: "유형", select: { equals: BLOG } },
              { property: "상태", select: { equals: "발행" } },
            ],
          },
          ...(cursor ? { start_cursor: cursor } : {}),
        }),
      });
      posts.push(...data.results.map(pageMeta));
      cursor = data.has_more ? data.next_cursor : null;
    } while (cursor);

    const list = posts.filter((p) => p.title).sort((a, b) => (a.date < b.date ? 1 : -1));
    // 표지가 없는 글은 본문의 첫 이미지를 목록 썸네일로 씁니다.
    await Promise.all(
      list.filter((p) => !p.cover).map(async (p) => {
        try {
          const data = await notion(`/blocks/${p.id}/children?page_size=10`);
          const img = (data.results || []).find((b) => b.type === "image");
          if (img) p.cover = img.image.type === "external" ? img.image.external.url : img.image.file.url;
        } catch (_) {}
      })
    );
    res.status(200).json({ configured: true, posts: list });
  } catch (e) {
    // 없는 글 주소는 오류 대신 404로 안내
    if (/Notion (400|404)/.test(String(e.message))) {
      res.status(404).json({ error: "not found" });
      return;
    }
    res.status(500).json({ error: String(e.message || e) });
  }
};
