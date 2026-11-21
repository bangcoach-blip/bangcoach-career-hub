/* 방코치 다운로드 모듈 — 화면의 결과물을 Markdown(.md) / Word(.doc) / PDF(.pdf)로 내려받습니다.
   사용: BCExport.mount({ host: '.tools', target: '#app', name: () => '파일이름', title: () => '문서 제목', exclude: '.top,#work' })
   - host: 버튼을 넣을 자리(없으면 화면 오른쪽 아래에 떠 있는 버튼)
   - target: 내려받을 영역
   - exclude: 내려받을 때 뺄 부분(CSS 선택자) */
(function () {
  if (window.BCExport) return;
  var CSS =
    '.bcx-wrap{position:relative;display:inline-block;font-family:"Pretendard Variable",Pretendard,"Malgun Gothic",sans-serif}' +
    '.bcx-float{position:fixed;right:18px;bottom:18px;z-index:2147482000}' +
    '.bcx-btn{font:inherit;font-size:13px;font-weight:700;border:1px solid #1c60ef;background:#1c60ef;color:#fff;padding:7px 13px;border-radius:6px;cursor:pointer;white-space:nowrap}' +
    '.bcx-btn:hover{opacity:.92}' +
    '.bcx-menu{position:absolute;right:0;bottom:calc(100% + 6px);min-width:250px;background:#fff;border:1px solid #cbd5e1;border-radius:10px;box-shadow:0 12px 32px rgba(15,23,42,.18);padding:6px;display:none;z-index:2147482001;text-align:left}' +
    '.bcx-wrap.down .bcx-menu{bottom:auto;top:calc(100% + 6px)}' +
    '.bcx-wrap.open .bcx-menu{display:block}' +
    '.bcx-menu p{margin:4px 8px 6px;font-size:12px;color:#64748b;font-weight:600}' +
    '.bcx-menu button{display:flex;width:100%;gap:10px;align-items:center;border:0;background:none;padding:9px 10px;border-radius:7px;cursor:pointer;font:inherit;text-align:left;color:#0f172a}' +
    '.bcx-menu button:hover{background:#eef4ff}' +
    '.bcx-menu b{display:inline-flex;align-items:center;justify-content:center;min-width:42px;height:24px;border-radius:5px;font-size:11.5px;color:#fff}' +
    '.bcx-menu span{display:flex;flex-direction:column;font-size:13.5px;font-weight:700}' +
    '.bcx-menu small{font-size:12px;color:#64748b;font-weight:500}' +
    '.bcx-busy{position:fixed;inset:0;background:rgba(15,23,42,.35);z-index:2147482500;display:flex;align-items:center;justify-content:center;font:600 14px/1.5 "Pretendard Variable",Pretendard,"Malgun Gothic",sans-serif;color:#0f172a}' +
    '.bcx-busy div{background:#fff;border-radius:12px;padding:18px 22px;box-shadow:0 20px 50px rgba(0,0,0,.25)}' +
    '.bcx-answer{border:1px solid #9aa1ab;padding:8px 10px;white-space:pre-wrap;margin:4px 0 8px;min-height:36px;background:#fff}' +
    '.bcx-input{border-bottom:1px solid #111;padding:0 6px}' +
    '@media print{.bcx-wrap,.bcx-float{display:none!important}}';
  var DOC_CSS =
    'body{font-family:"맑은 고딕","Malgun Gothic",sans-serif;font-size:10.5pt;line-height:1.6;color:#111}' +
    'h1{font-size:18pt;text-align:center;margin:0 0 12pt}h2{font-size:14pt;border-bottom:1.5pt solid #111;padding-bottom:3pt;margin:18pt 0 8pt}' +
    'h3{font-size:12pt;margin:12pt 0 6pt}h4{font-size:11pt;margin:10pt 0 4pt}p{margin:3pt 0}' +
    'table{border-collapse:collapse;width:100%;margin:6pt 0}th,td{border:1px solid #999;padding:4pt 6pt;vertical-align:top;font-size:10pt;text-align:left}th{background:#f0f2f5}' +
    '.bcx-answer{border:1px solid #999;padding:6pt;margin:4pt 0}mark{background:#fef3c7}';

  function addStyle() {
    if (document.getElementById('bcx-style')) return;
    var s = document.createElement('style'); s.id = 'bcx-style'; s.textContent = CSS; document.head.appendChild(s);
  }
  function el(tag, attrs, html) { var e = document.createElement(tag); for (var k in attrs || {}) e.setAttribute(k, attrs[k]); if (html != null) e.innerHTML = html; return e; }
  function val(x) { return typeof x === 'function' ? x() : x; }
  function safeName(s) { return String(s || '결과물').replace(/[\\/:*?"<>|\n\r\t]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80) || '결과물'; }
  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
  function save(blob, filename) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }

  /* 내려받을 복사본: 입력값은 글자로 바꾸고, 버튼·숨김 요소는 뺀다 */
  function prepare(o) {
    var src = val(o.target); if (typeof src === 'string') src = document.querySelector(src);
    if (!src) throw new Error('내려받을 내용을 찾지 못했습니다.');
    var c = src.cloneNode(true);
    var sa = src.querySelectorAll('textarea,input,select'), ca = c.querySelectorAll('textarea,input,select');
    for (var i = 0; i < ca.length; i++) {
      var e = ca[i], s = sa[i], rep = null;
      if (e.tagName === 'TEXTAREA') { rep = el('div', { 'class': 'bcx-answer' }); rep.textContent = s.value || '(작성하지 않음)'; }
      else if (e.type === 'checkbox' || e.type === 'radio') rep = document.createTextNode(s.checked ? '☑ ' : '☐ ');
      else if (e.tagName === 'SELECT') rep = document.createTextNode(s.value);
      else if (e.type !== 'hidden' && e.type !== 'button' && e.type !== 'submit') { rep = el('span', { 'class': 'bcx-input' }); rep.textContent = s.value || '      '; }
      if (rep) e.parentNode.replaceChild(rep, e); else e.parentNode.removeChild(e);
    }
    var rm = 'button,script,style,dialog,noscript,template,.bcx-wrap,[hidden],[data-noexport]' + (o.exclude ? ',' + o.exclude : '');
    Array.prototype.forEach.call(c.querySelectorAll(rm), function (x) { if (x.parentNode) x.parentNode.removeChild(x); });
    Array.prototype.forEach.call(c.querySelectorAll('details'), function (d) { d.setAttribute('open', ''); });
    Array.prototype.forEach.call(c.querySelectorAll('[id]'), function (x) { x.removeAttribute('id'); });
    return c;
  }

  /* Markdown 변환 */
  var BLOCK = /^(P|DIV|SECTION|HEADER|FOOTER|MAIN|ARTICLE|ASIDE|NAV|UL|OL|LI|TABLE|THEAD|TBODY|TR|H1|H2|H3|H4|H5|H6|BLOCKQUOTE|PRE|DL|DT|DD|FORM|FIGURE|FIGCAPTION|LABEL|DETAILS|SUMMARY|FIELDSET|HR)$/;
  function hasBlock(n) { for (var i = 0; i < n.children.length; i++) { if (BLOCK.test(n.children[i].tagName) || hasBlock(n.children[i])) return true; } return false; }
  function inline(n) {
    var s = '';
    n.childNodes.forEach(function (ch) {
      if (ch.nodeType === 3) s += ch.nodeValue.replace(/\s+/g, ' ');
      else if (ch.nodeType === 1) {
        var t = ch.tagName.toUpperCase();
        if (t === 'BR') s += '  \n';
        else if (t === 'SVG' || t === 'IMG' || t === 'CANVAS') return;
        else if (t === 'STRONG' || t === 'B') { var v = inline(ch).trim(); if (v) s += ' **' + v + '** '; }
        else if (t === 'EM' || t === 'I') { var w = inline(ch).trim(); if (w) s += ' *' + w + '* '; }
        else if (BLOCK.test(t)) s += ' ' + inline(ch) + ' ';
        else s += inline(ch) + ' ';
      }
    });
    return s;
  }
  function clean(s) { return s.replace(/[ \t]+/g, ' ').replace(/ ?\n ?/g, '\n').replace(/\*\* +\*\*/g, ' ').trim(); }
  function toMd(root, title) {
    var out = [], buf = '';
    function flush() { var t = clean(buf); if (t) out.push(t); buf = ''; }
    function cell(x) { return clean(inline(x)).replace(/\|/g, '\\|').replace(/\n+/g, '<br>'); }
    function walk(n) {
      n.childNodes.forEach(function (ch) {
        if (ch.nodeType === 3) { buf += ch.nodeValue.replace(/\s+/g, ' '); return; }
        if (ch.nodeType !== 1) return;
        var t = ch.tagName.toUpperCase();
        if (t === 'SVG' || t === 'IMG' || t === 'CANVAS') return;
        if (/^H[1-6]$/.test(t)) { flush(); var lv = Math.min(+t[1], 4); var ht = clean(inline(ch)); if (ht) out.push('#'.repeat(lv) + ' ' + ht); return; }
        if (t === 'HR') { flush(); out.push('---'); return; }
        if (t === 'UL' || t === 'OL') {
          flush(); var k = 0, items = [];
          Array.prototype.forEach.call(ch.children, function (li) { if (li.tagName !== 'LI') return; k++; var lt = clean(inline(li)).replace(/\n/g, ' '); if (lt) items.push((t === 'OL' ? k + '. ' : '- ') + lt); });
          if (items.length) out.push(items.join('\n'));
          return;
        }
        if (t === 'TABLE') {
          flush(); var rows = Array.prototype.filter.call(ch.querySelectorAll('tr'), function () { return true; });
          if (!rows.length) return;
          var lines = [];
          rows.forEach(function (tr, i) {
            var cells = Array.prototype.map.call(tr.children, cell);
            lines.push('| ' + cells.join(' | ') + ' |');
            if (i === 0) lines.push('|' + cells.map(function () { return ' --- '; }).join('|') + '|');
          });
          out.push(lines.join('\n')); return;
        }
        if (ch.classList && ch.classList.contains('bcx-answer')) { flush(); out.push(ch.textContent.split('\n').map(function (l) { return '> ' + l; }).join('\n')); return; }
        if (BLOCK.test(t)) { if (hasBlock(ch)) { flush(); walk(ch); flush(); } else { flush(); buf = inline(ch); flush(); } return; }
        if (hasBlock(ch)) { flush(); walk(ch); flush(); } else buf += inline(ch);
      });
    }
    walk(root); flush();
    var md = out.join('\n\n');
    if (title && !/^# /m.test(md)) md = '# ' + title + '\n\n' + md;
    return md + '\n';
  }

  function toDoc(c, title) {
    return '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">' +
      '<head><meta charset="utf-8"><title>' + esc(title) + '</title><!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->' +
      '<style>@page{size:21cm 29.7cm;margin:2cm 1.8cm}' + DOC_CSS + '</style></head><body>' + c.innerHTML + '</body></html>';
  }

  /* PDF: A4 본문 폭(186mm≈703px)에 맞춰 다시 배치 → 쪽 경계를 직접 정해 몇 쪽씩 나눠 그린다.
     (한 번에 통째로 그리면 휴대폰에서 캔버스 한도를 넘어 빈 쪽·잘림이 생김) */
  var PDF_LIBS = [
    ['html2canvas', 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'],
    ['jspdf', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js']
  ];
  function loadPdfLib() {
    return Promise.all(PDF_LIBS.map(function (L) {
      return new Promise(function (res, rej) {
        if (window[L[0]]) return res();
        var s = document.createElement('script'); s.src = L[1]; s.onload = res; s.onerror = rej; document.head.appendChild(s);
      });
    }));
  }
  function busy(on, msg) {
    var b = document.getElementById('bcx-busy');
    if (on) { if (!b) { b = el('div', { id: 'bcx-busy', 'class': 'bcx-busy' }, '<div></div>'); document.body.appendChild(b); } b.firstChild.textContent = msg; }
    else if (b) b.remove();
  }
  var PDF_FIX =
    '.bcx-pdf,.bcx-pdf *{box-sizing:border-box!important;max-width:100%!important;overflow-wrap:anywhere;word-break:keep-all;animation:none!important;transition:none!important}' +
    '.bcx-pdf{width:703px!important;margin:0!important;padding:4px 2px!important;border:0!important;border-radius:0!important;box-shadow:none!important;background:#fff!important;overflow:visible!important}' +
    '.bcx-pdf table{table-layout:fixed;width:100%!important}.bcx-pdf pre{white-space:pre-wrap}' +
    '.bcx-pdf [style*="position:sticky"],.bcx-pdf [style*="position: sticky"]{position:static!important}' +
    '.bcx-pdf img,.bcx-pdf svg,.bcx-pdf canvas{height:auto}';
  /* 쪽 경계: 잘리면 안 되는 덩어리(표 줄·제목·문항 카드 등) 중간이면 그 덩어리 위에서 끊는다 */
  function pageCuts(c, pageH, avoidSel) {
    var top0 = c.getBoundingClientRect().top, total = c.scrollHeight;
    var blocks = Array.prototype.map.call(c.querySelectorAll(avoidSel), function (b) {
      var r = b.getBoundingClientRect(); return [r.top - top0, r.bottom - top0];
    }).filter(function (r) { return r[1] - r[0] > 0 && r[1] - r[0] < pageH * 0.9; });
    var heads = Array.prototype.map.call(c.querySelectorAll('h1,h2,h3,h4'), function (h) { return h.getBoundingClientRect().top - top0; });
    var cuts = [0], y = 0;
    while (y + pageH < total) {
      var cut = y + pageH, moved = true, guard = 0;
      while (moved && guard++ < 50) {
        moved = false;
        for (var i = 0; i < blocks.length; i++) {
          if (blocks[i][0] < cut - 1 && blocks[i][1] > cut + 1 && blocks[i][0] > y + pageH * 0.3) { cut = Math.floor(blocks[i][0]) - 2; moved = true; }
        }
        for (var j = 0; j < heads.length; j++) {   /* 제목이 쪽 맨 아래에 홀로 남지 않게 */
          if (heads[j] < cut && heads[j] > cut - 60 && heads[j] > y + pageH * 0.3) { cut = Math.floor(heads[j]) - 4; moved = true; }
        }
      }
      if (cut <= y + 40) cut = y + pageH;
      cuts.push(cut); y = cut;
    }
    cuts.push(total);
    return cuts;
  }
  function toPdf(c, name, o) {
    var W = 703, MX = 12, MT = 12, MB = 14, PW = 210, PH = 297;
    var pxPerMm = W / (PW - MX * 2), pageH = Math.floor((PH - MT - MB) * pxPerMm);
    c.classList.add('bcx-pdf'); c.removeAttribute('style');
    c.insertBefore(el('style', {}, PDF_FIX), c.firstChild);
    var box = el('div', { 'class': 'bcx-pdfbox' });
    box.style.cssText = 'position:absolute;left:0;top:0;width:' + W + 'px;background:#fff;z-index:-1;pointer-events:none';
    box.appendChild(c); document.body.appendChild(box);
    var sx = window.scrollX, sy = window.scrollY;
    busy(true, 'PDF를 만드는 중입니다… (내용이 길면 10초 정도 걸려요)');
    var avoid = ['tr', 'h1', 'h2', 'h3', 'h4', 'li', 'p', 'img', 'figure', 'blockquote', '.bcx-answer', '.bcx-avoid'].concat(o.avoid || []).join(',');
    return loadPdfLib().then(function () {
      return (document.fonts && document.fonts.ready) || null;
    }).then(function () {
      window.scrollTo(0, 0);
      var cuts = pageCuts(c, pageH, avoid);
      var JsPDF = window.jspdf.jsPDF, pdf = new JsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      var scale = Math.min(2, Math.max(1, window.devicePixelRatio || 1.6));
      var rect = c.getBoundingClientRect(), ox = rect.left + window.scrollX, oy = rect.top + window.scrollY;
      var p = 0, PER = 3;   /* 한 번에 3쪽씩 그림(휴대폰 캔버스 한도 안쪽) */
      function step() {
        if (p >= cuts.length - 1) return;
        var from = cuts[p], last = Math.min(p + PER, cuts.length - 1), to = cuts[last];
        busy(true, 'PDF를 만드는 중입니다… (' + Math.min(last, cuts.length - 1) + ' / ' + (cuts.length - 1) + '쪽)');
        return window.html2canvas(c, {
          scale: scale, useCORS: true, backgroundColor: '#ffffff', logging: false,
          x: ox, y: oy + from, width: W, height: to - from,
          windowWidth: Math.max(document.documentElement.clientWidth, W + 40), scrollX: 0, scrollY: 0
        }).then(function (cv) {
          for (var k = p; k < last; k++) {
            var h = cuts[k + 1] - cuts[k]; if (h <= 0) continue;
            var pc = document.createElement('canvas'); pc.width = cv.width; pc.height = Math.round(h * scale);
            var g = pc.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, pc.width, pc.height);
            g.drawImage(cv, 0, Math.round((cuts[k] - from) * scale), cv.width, pc.height, 0, 0, pc.width, pc.height);
            if (k > 0) pdf.addPage();
            pdf.addImage(pc.toDataURL('image/jpeg', 0.92), 'JPEG', MX, MT, PW - MX * 2, h / pxPerMm);
          }
          p = last; return step();
        });
      }
      return Promise.resolve(step()).then(function () { pdf.save(name + '.pdf'); });
    }).catch(function (e) {
      if (window.console) console.error(e);
      alert('PDF 파일을 바로 만들지 못해 인쇄 창을 엽니다. 대상(프린터)에서 ‘PDF로 저장’을 고르세요.');
      window.print();
    }).then(function () { window.scrollTo(sx, sy); busy(false); box.remove(); });
  }

  function run(kind, o) {
    var title = val(o.title) || document.title, name = safeName(val(o.name) || title), c;
    try { c = prepare(o); } catch (e) { alert(e.message); return; }
    if (kind === 'md') save(new Blob(['﻿' + toMd(c, title)], { type: 'text/markdown;charset=utf-8' }), name + '.md');
    else if (kind === 'doc') save(new Blob(['﻿' + toDoc(c, title)], { type: 'application/msword' }), name + '.doc');
    else if (kind === 'pdf') toPdf(c, name, o);
  }

  function mount(o) {
    addStyle();
    var host = val(o.host); if (typeof host === 'string') host = document.querySelector(host);
    var wrap = el('span', { 'class': 'bcx-wrap' + (o.menuDown ? ' down' : '') });
    if (!host) { wrap.className += ' bcx-float'; document.body.appendChild(wrap); }
    else if (o.prepend) host.insertBefore(wrap, host.firstChild); else host.appendChild(wrap);
    var btn = el('button', { type: 'button', 'class': 'bcx-btn' + (o.btnClass ? ' ' + o.btnClass : ''), 'aria-haspopup': 'true' }, o.label || '다운로드 ▾');
    var menu = el('div', { 'class': 'bcx-menu', role: 'menu' });
    menu.appendChild(el('p', null, '어떤 파일로 내려받을까요?'));
    [['md', 'MD', '#334155', 'Markdown (.md)', '노션·메모장에 붙여 넣기 좋아요'],
     ['doc', 'WORD', '#1d4ed8', 'Word (.doc)', '워드·한글에서 열어 고쳐 쓸 수 있어요'],
     ['pdf', 'PDF', '#dc2626', 'PDF (.pdf)', '제출·인쇄·공유용']].forEach(function (it) {
      var b = el('button', { type: 'button', role: 'menuitem' }, '<b style="background:' + it[2] + '">' + it[1] + '</b><span>' + it[3] + '<small>' + it[4] + '</small></span>');
      b.addEventListener('click', function () { wrap.classList.remove('open'); run(it[0], o); });
      menu.appendChild(b);
    });
    btn.addEventListener('click', function (e) { e.stopPropagation(); wrap.classList.toggle('open'); });
    document.addEventListener('click', function (e) { if (!wrap.contains(e.target)) wrap.classList.remove('open'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') wrap.classList.remove('open'); });
    wrap.appendChild(menu); wrap.appendChild(btn);
    return { el: wrap, run: function (k) { run(k, o); }, remove: function () { wrap.remove(); } };
  }
  window.BCExport = { mount: mount, toMarkdown: function (o) { return toMd(prepare(o), val(o.title)); } };
})();
