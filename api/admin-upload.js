// 관리자 페이지 파일 업로드: 로그인한 사람에게만 Vercel Blob 업로드 허가를 내줍니다.
// 파일은 브라우저에서 저장소로 바로 올라가므로 서버 용량 제한(약 4.5MB)을 받지 않습니다.
const { handleUpload } = require("@vercel/blob/client");
const { isAdmin } = require("./_admin-auth");

const ALLOWED = /\.(pdf|pptx?|docx?|xlsx?|hwpx?|zip|txt|mp4|webm|mov|m4v|png|jpe?g)$/i;
const MAX_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const json = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        if (!isAdmin(req)) throw new Error("로그인이 필요합니다.");
        if (!ALLOWED.test(pathname)) throw new Error("올릴 수 없는 파일 형식입니다.");
        return { addRandomSuffix: true, maximumSizeInBytes: MAX_SIZE };
      },
    });
    res.status(200).json(json);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};
