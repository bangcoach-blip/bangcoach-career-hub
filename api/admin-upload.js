// 관리자 페이지 파일 업로드: 로그인한 사람에게만 Vercel Blob 업로드 허가를 내줍니다.
// 파일은 브라우저에서 저장소로 바로 올라가므로 서버 용량 제한(약 4.5MB)을 받지 않습니다.
const { issueSignedToken } = require("@vercel/blob");
const { handleUploadPresigned } = require("@vercel/blob/client");
const { isAdmin } = require("./_admin-auth");

const ALLOWED = /\.(pdf|pptx?|docx?|xlsx?|hwpx?|zip|txt|mp4|webm|mov|m4v|png|jpe?g)$/i;
const MAX_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
const VALID_MS = 60 * 60 * 1000; // 큰 파일도 올릴 수 있게 1시간

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const json = await handleUploadPresigned({
      body,
      request: req,
      getSignedToken: async (pathname) => {
        if (!isAdmin(req)) throw new Error("로그인이 필요합니다.");
        if (!ALLOWED.test(pathname)) throw new Error("올릴 수 없는 파일 형식입니다.");
        const validUntil = Date.now() + VALID_MS;
        const token = await issueSignedToken({ pathname, operations: ["put"], maximumSizeInBytes: MAX_SIZE, validUntil });
        return { token, urlOptions: { validUntil, addRandomSuffix: true, maximumSizeInBytes: MAX_SIZE } };
      },
    });
    res.status(200).json(json);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};
