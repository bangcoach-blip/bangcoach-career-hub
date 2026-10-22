// 소개 탭 한국 점 지도: 화면에 들어오면 서울에서부터 점이 물결처럼 퍼지고, 강의 지역이 깜빡인다
import { MAP, PROJ, DOTS } from "./korea-dots.js";

const wrap = document.getElementById("koreaMap");

// 강의 지역 (도시 단위, 대학 이름은 쓰지 않음)
const CITIES = [
  { name: "서울", lat: 37.5665, lon: 126.978, main: true },
  { name: "인천", lat: 37.4563, lon: 126.7052 },
  { name: "수원", lat: 37.2636, lon: 127.0286 },
  { name: "춘천", lat: 37.8813, lon: 127.7298 },
  { name: "강원", lat: 37.6, lon: 128.55 },
  { name: "대전", lat: 36.3504, lon: 127.3845 },
  { name: "청주", lat: 36.6424, lon: 127.489 },
  { name: "전주", lat: 35.8242, lon: 127.148 },
  { name: "광주", lat: 35.1595, lon: 126.8526 },
  { name: "대구", lat: 35.8714, lon: 128.6014 },
  { name: "창원", lat: 35.2281, lon: 128.6811 },
  { name: "부산", lat: 35.1796, lon: 129.0756 },
  { name: "제주", lat: 33.4996, lon: 126.5312 },
];

const SVG_NS = "http://www.w3.org/2000/svg";

function project(lat, lon) {
  const x = lon * Math.cos((PROJ.lat0 * Math.PI) / 180);
  const y = -lat;
  return [(x - PROJ.minx + PROJ.step) * PROJ.s, (y - PROJ.miny + PROJ.step) * PROJ.s];
}

function el(tag, attrs) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  return node;
}

if (wrap) {
  const svg = el("svg", { viewBox: `0 0 ${MAP.w} ${MAP.h}`, role: "img", "aria-label": "강의 지역을 표시한 한국 지도" });
  const cities = CITIES.map((c) => ({ ...c, xy: project(c.lat, c.lon) }));
  const [sx, sy] = cities.find((c) => c.main).xy;
  const maxDist = Math.hypot(MAP.w, MAP.h) * 0.7;

  // 바탕 점: 강의 지역 가까운 점은 연한 파랑으로
  const dotsGroup = el("g", { class: "km-dots" });
  for (let i = 0; i < DOTS.length; i += 2) {
    const x = DOTS[i];
    const y = DOTS[i + 1];
    const near = cities.some((c) => Math.hypot(c.xy[0] - x, c.xy[1] - y) < 26);
    const dot = el("circle", { cx: x, cy: y, r: MAP.r, class: near ? "km-dot is-near" : "km-dot" });
    dot.style.setProperty("--d", `${((Math.hypot(x - sx, y - sy) / maxDist) * 1.1).toFixed(3)}s`);
    dotsGroup.append(dot);
  }
  svg.append(dotsGroup);

  // 강의 지역 표시: 퍼지는 고리 + 점 + 이름
  const pinGroup = el("g", { class: "km-pins" });
  cities.forEach((c, i) => {
    const [x, y] = c.xy;
    const g = el("g", { class: c.main ? "km-pin is-main" : "km-pin", transform: `translate(${x} ${y})` });
    g.style.setProperty("--d", `${(1.1 + i * 0.06).toFixed(2)}s`);
    g.append(el("circle", { class: "km-hit", r: 13 }));
    g.append(el("circle", { class: "km-ring", r: c.main ? 8 : 6 }));
    g.append(el("circle", { class: "km-core", r: c.main ? 7.5 : 5.5 }));
    const label = el("text", { class: "km-label", x: 0, y: c.main ? -16 : -13, "text-anchor": "middle" });
    label.textContent = c.name;
    g.append(label);
    pinGroup.append(g);
  });
  svg.append(pinGroup);
  wrap.append(svg);

  // 화면에 들어오면 한 번 재생
  new IntersectionObserver(
    (entries, io) => {
      if (entries[0].isIntersecting) {
        wrap.classList.add("is-in");
        io.disconnect();
      }
    },
    { threshold: 0.25 }
  ).observe(wrap);
}
