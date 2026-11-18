// 도구(AI 도구) 파일 정보: 노션 '도구파일' 칸에 JSON으로 저장합니다.
//   { "main": 안내 페이지, "samples": [{ "name": 이름, "url": 주소 }] }
// 주소는 두 가지입니다.
//   - 사이트 폴더 안의 파일("/tools/..."): 누구나 열 수 있어서 코드로 잠글 수 없습니다.
//   - 어드민에서 올린 파일(Vercel Blob 주소): 방문자에게는 주소를 숨기고 /tool/... 로만 내려가서 잠글 수 있습니다.
const BLOB = /^https:\/\/[a-z0-9.-]+\.blob\.vercel-storage\.com\//i;
const SITE_PATH = /^\/(?!\/)[A-Za-z0-9_\-./%]+$/;

const isBlob = (u) => typeof u === "string" && BLOB.test(u);
const isSitePath = (u) => typeof u === "string" && SITE_PATH.test(u) && !u.includes("..");
const isFileRef = (u) => isBlob(u) || isSitePath(u);

function parseFiles(raw) {
  try {
    const j = JSON.parse(raw);
    if (!j || !isFileRef(j.main)) return null;
    const samples = (Array.isArray(j.samples) ? j.samples : [])
      .filter((s) => s && isFileRef(s.url))
      .slice(0, 10)
      .map((s) => ({ name: String(s.name || "샘플").slice(0, 60), url: s.url }));
    return { main: j.main, samples };
  } catch (e) {
    return null;
  }
}

// 방문자에게 보여 줄 주소로 바꿉니다. Blob 주소는 절대 내보내지 않습니다.
function hrefs(id, files) {
  const href = (url, key) => (isBlob(url) ? `/tool/${id}${key === "main" ? "" : `/${key}`}` : url);
  return {
    main: href(files.main, "main"),
    samples: files.samples.map((s, i) => ({ name: s.name, href: href(s.url, `s${i}`) })),
    // 안내 페이지가 어드민에서 올린 파일일 때만 코드로 잠글 수 있습니다
    lockable: isBlob(files.main),
  };
}

// 어드민이 보낸 파일 정보를 검사합니다(통과하면 저장할 문자열을 줍니다).
function serializeFiles(input) {
  const files = parseFiles(JSON.stringify(input || {}));
  if (!files) return null;
  const text = JSON.stringify(files);
  return text.length <= 1900 ? text : null; // 노션 한 칸 제한
}

module.exports = { isBlob, isSitePath, parseFiles, hrefs, serializeFiles };
