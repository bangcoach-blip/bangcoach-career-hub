const NOTION_VERSION = "2022-06-28";

async function notion(path, options = {}) {
  const res = await fetch(`https://api.notion.com/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Notion ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function richText(items = []) {
  return items
    .map((t) => {
      let html = esc(t.plain_text).replace(/\n/g, "<br>");
      const a = t.annotations || {};
      if (a.code) html = `<code>${html}</code>`;
      if (a.bold) html = `<strong>${html}</strong>`;
      if (a.italic) html = `<em>${html}</em>`;
      if (a.strikethrough) html = `<s>${html}</s>`;
      if (a.underline) html = `<u>${html}</u>`;
      if (t.href && /^https?:\/\//.test(t.href)) {
        html = `<a href="${esc(t.href)}" target="_blank" rel="noopener">${html}</a>`;
      }
      return html;
    })
    .join("");
}

async function listChildren(blockId) {
  const results = [];
  let cursor;
  do {
    const q = cursor ? `?start_cursor=${cursor}&page_size=100` : "?page_size=100";
    const data = await notion(`/blocks/${blockId}/children${q}`);
    results.push(...data.results);
    cursor = data.has_more ? data.next_cursor : null;
  } while (cursor);
  return results;
}

async function renderBlocks(blocks) {
  let html = "";
  let listTag = null;

  const closeList = () => {
    if (listTag) {
      html += `</${listTag}>`;
      listTag = null;
    }
  };

  for (const b of blocks) {
    const type = b.type;
    const v = b[type] || {};

    if (type === "bulleted_list_item" || type === "numbered_list_item") {
      const tag = type === "bulleted_list_item" ? "ul" : "ol";
      if (listTag !== tag) {
        closeList();
        html += `<${tag}>`;
        listTag = tag;
      }
      const kids = b.has_children ? await renderBlocks(await listChildren(b.id)) : "";
      html += `<li>${richText(v.rich_text)}${kids}</li>`;
      continue;
    }
    closeList();

    switch (type) {
      case "paragraph":
        html += v.rich_text.length ? `<p>${richText(v.rich_text)}</p>` : "";
        break;
      case "heading_1":
        html += `<h2>${richText(v.rich_text)}</h2>`;
        break;
      case "heading_2":
        html += `<h3>${richText(v.rich_text)}</h3>`;
        break;
      case "heading_3":
        html += `<h4>${richText(v.rich_text)}</h4>`;
        break;
      case "quote":
        html += `<blockquote>${richText(v.rich_text)}</blockquote>`;
        break;
      case "callout":
        html += `<div class="callout">${v.icon?.emoji ? `<span>${esc(v.icon.emoji)}</span>` : ""}<div>${richText(v.rich_text)}</div></div>`;
        break;
      case "divider":
        html += "<hr>";
        break;
      case "code":
        html += `<pre><code>${esc(v.rich_text.map((t) => t.plain_text).join(""))}</code></pre>`;
        break;
      case "to_do":
        html += `<p>${v.checked ? "☑" : "☐"} ${richText(v.rich_text)}</p>`;
        break;
      case "image": {
        const url = v.type === "external" ? v.external.url : v.file.url;
        const cap = richText(v.caption);
        html += `<figure><img src="${esc(url)}" alt="${esc(v.caption.map((t) => t.plain_text).join(""))}" loading="lazy">${cap ? `<figcaption>${cap}</figcaption>` : ""}</figure>`;
        break;
      }
      case "bookmark":
        html += `<p><a href="${esc(v.url)}" target="_blank" rel="noopener">${esc(v.url)}</a></p>`;
        break;
      case "table": {
        const rows = await listChildren(b.id);
        html += '<div class="table-wrap"><table>';
        rows.forEach((row, i) => {
          const cellTag = i === 0 && v.has_column_header ? "th" : "td";
          html += "<tr>" + row.table_row.cells.map((c) => `<${cellTag}>${richText(c)}</${cellTag}>`).join("") + "</tr>";
        });
        html += "</table></div>";
        break;
      }
      case "toggle":
        html += `<details><summary>${richText(v.rich_text)}</summary>${b.has_children ? await renderBlocks(await listChildren(b.id)) : ""}</details>`;
        break;
      default:
        break;
    }
  }
  closeList();
  return html;
}

function pageMeta(page) {
  const props = page.properties;
  const titleProp = Object.values(props).find((p) => p.type === "title");
  const dateProp = props["날짜"]?.date?.start || page.created_time.slice(0, 10);
  const summary = (props["요약"]?.rich_text || []).map((t) => t.plain_text).join("");
  const category = props["카테고리"]?.select?.name || "";
  const status = props["상태"]?.select?.name || props["상태"]?.status?.name || null;
  return {
    id: page.id,
    title: (titleProp?.title || []).map((t) => t.plain_text).join(""),
    date: dateProp,
    summary,
    category,
    cover: page.cover ? (page.cover.type === "external" ? page.cover.external.url : page.cover.file.url) : "",
    published: status === null ? true : status === "발행",
  };
}

module.exports = { notion, renderBlocks, listChildren, pageMeta };
