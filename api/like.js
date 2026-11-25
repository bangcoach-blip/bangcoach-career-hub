// 좋아요: 영상·도구·프롬프트·블로그 글(모두 사이트 콘텐츠 DB)의 '좋아요' 숫자를 올리고 내립니다.
//   GET  /api/like?ids=a,b,c           → 이 브라우저가 이미 누른 글 목록
//   POST /api/like {id, kind, like}    → { likes, liked }   (kind: item=영상·도구·프롬프트, post=블로그)
const { notion } = require("./_notion");
const { isEnabled, short, readLiked, likedCookie, normalizeId, MAX_LIKES } = require("./_like");

const ITEM_TYPES = ["영상", "도구", "프롬프트"];
const ID_FORMAT = /^[0-9a-f-]{32,36}$/i;

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    const liked = readLiked(req);

    if (req.method === "GET") {
      const ids = String(req.query.ids || "")
        .split(",")
        .filter((id) => ID_FORMAT.test(id))
        .slice(0, 60);
      res.status(200).json({ liked: ids.filter((id) => liked.includes(short(id))) });
      return;
    }
    if (req.method !== "POST") {
      res.status(405).json({ error: "method not allowed" });
      return;
    }
    if (!isEnabled() || !process.env.NOTION_TOKEN) {
      res.status(503).json({ error: "좋아요 기능이 아직 준비되지 않았습니다." });
      return;
    }

    const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const id = String(b.id || "");
    if (!ID_FORMAT.test(id) || !["item", "post"].includes(b.kind)) {
      res.status(400).json({ error: "잘못된 요청입니다." });
      return;
    }

    const page = await notion(`/pages/${encodeURIComponent(id)}`);
    const p = page.properties;
    // 이 사이트의 DB에 있는 공개된 글만 허용
    const dbId = normalizeId(page.parent?.database_id);
    // 블로그 글도 사이트 콘텐츠 DB에 있습니다(유형=블로그)
    const expected = normalizeId(process.env.NOTION_CONTENT_DB_ID);
    const status = p["상태"]?.select?.name || p["상태"]?.status?.name || null;
    const typeOk = b.kind === "post" ? p["유형"]?.select?.name === "블로그" : ITEM_TYPES.includes(p["유형"]?.select?.name);
    if (!dbId || dbId !== expected || !typeOk || status !== "발행") {
      res.status(404).json({ error: "찾을 수 없는 글입니다." });
      return;
    }

    const mark = short(id);
    const has = liked.includes(mark);
    const current = Math.max(0, Number(p["좋아요"]?.number) || 0);
    let next = current;
    let nextLiked = liked;
    if (b.like === true && !has) {
      if (liked.length >= MAX_LIKES) nextLiked = liked.slice(1);
      next = current + 1;
      nextLiked = [...nextLiked, mark];
    } else if (b.like === false && has) {
      next = Math.max(0, current - 1);
      nextLiked = liked.filter((m) => m !== mark);
    }
    if (next !== current) {
      await notion(`/pages/${page.id}`, {
        method: "PATCH",
        body: JSON.stringify({ properties: { 좋아요: { number: next } } }),
      });
      res.setHeader("Set-Cookie", likedCookie(nextLiked));
    }
    res.status(200).json({ likes: next, liked: nextLiked.includes(mark) });
  } catch (e) {
    console.error("like", e.message);
    res.status(500).json({ error: "처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." });
  }
};
