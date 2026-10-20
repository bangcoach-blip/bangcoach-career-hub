// 일회용: 게시된 구글시트(프롬프트)를 노션 "사이트 콘텐츠" DB로 복사합니다. 복사 후 이 파일은 삭제합니다.
const { notion } = require("./_notion");

const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQCdtJ1CyUSDh2d0ZAxnkoCZChv1PrRTETOg-oplejPHlQNZnFYkaTItKRCYnhpFfDNWA_tv4fPLt5-/pub?gid=705178267&single=true&output=csv";

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') inQuotes = false;
      else cell += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

const rt = (s) => [{ type: "text", text: { content: s } }];
const chunks = (s, n = 2000) => {
  const out = [];
  for (let i = 0; i < s.length; i += n) out.push(s.slice(i, i + n));
  return out;
};

module.exports = async function handler(req, res) {
  const dbId = process.env.NOTION_CONTENT_DB_ID;
  if (!process.env.NOTION_TOKEN || !dbId) {
    res.status(400).json({ error: "env not set" });
    return;
  }
  try {
    const offset = Number(req.query.offset || 0);
    const limit = Number(req.query.limit || 4);
    const csv = await (await fetch(SHEET_CSV_URL)).text();
    const rows = parseCsv(csv.replace(/\r\n?/g, "\n")).slice(1).filter((r) => r[1] && r[3]);

    const existing = new Set();
    let cursor;
    do {
      const data = await notion(`/databases/${dbId}/query`, {
        method: "POST",
        body: JSON.stringify({
          page_size: 100,
          filter: { property: "유형", select: { equals: "프롬프트" } },
          ...(cursor ? { start_cursor: cursor } : {}),
        }),
      });
      for (const p of data.results) {
        const t = Object.values(p.properties).find((v) => v.type === "title");
        existing.add((t?.title || []).map((x) => x.plain_text).join("").trim());
      }
      cursor = data.has_more ? data.next_cursor : null;
    } while (cursor);

    const result = [];
    for (let i = offset; i < Math.min(offset + limit, rows.length); i++) {
      const r = rows[i];
      const title = r[1].trim();
      if (existing.has(title)) {
        result.push({ i, title, status: "skipped" });
        continue;
      }
      const props = {
        이름: { title: rt(title) },
        유형: { select: { name: "프롬프트" } },
        카테고리: { select: { name: r[0].trim() } },
        설명: { rich_text: rt(r[2].trim().slice(0, 2000)) },
        순서: { number: i + 1 },
        상태: { select: { name: "발행" } },
      };
      if ((r[4] || "").trim()) props["소분류"] = { rich_text: rt(r[4].trim()) };
      await notion("/pages", {
        method: "POST",
        body: JSON.stringify({
          parent: { database_id: dbId },
          properties: props,
          children: [
            {
              object: "block",
              type: "code",
              code: { language: "plain text", rich_text: chunks(r[3].trim()).flatMap(rt) },
            },
          ],
        }),
      });
      result.push({ i, title, status: "created" });
    }
    res.status(200).json({ total: rows.length, result });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
};
