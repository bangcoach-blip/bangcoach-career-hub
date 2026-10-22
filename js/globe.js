// 소개 탭 지구본 (Cobe): 한반도를 정면에 두고 천천히 흔들리며, 끌어서 돌려볼 수 있다
import createGlobe from "https://cdn.jsdelivr.net/npm/cobe@2.0.1/+esm";

const canvas = document.getElementById("globeCanvas");
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// 강의 지역 표시 (도시 단위, 대학 이름은 쓰지 않음)
const CITIES = [
  [37.5665, 126.978], // 서울
  [37.4563, 126.7052], // 인천
  [37.2636, 127.0286], // 수원
  [37.8813, 127.7298], // 춘천
  [36.3504, 127.3845], // 대전
  [36.6424, 127.489], // 청주
  [35.8242, 127.148], // 전주
  [35.1595, 126.8526], // 광주
  [35.8714, 128.6014], // 대구
  [35.2281, 128.6811], // 창원
  [35.1796, 129.0756], // 부산
  [33.4996, 126.5312], // 제주
];

// 위도·경도를 화면 정면으로 가져오는 회전값
const FOCUS_PHI = Math.PI - ((127.8 * Math.PI) / 180 - Math.PI / 2);
const FOCUS_THETA = 0.3;

if (canvas) {
  let globe = null;
  let dragX = null;
  let dragOffset = 0;
  let spring = 0;

  canvas.addEventListener("pointerdown", (e) => {
    dragX = e.clientX - dragOffset;
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = "grabbing";
  });
  const release = () => {
    dragX = null;
    canvas.style.cursor = "grab";
  };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
  canvas.addEventListener("pointermove", (e) => {
    if (dragX !== null) dragOffset = e.clientX - dragX;
  });

  let visible = false;
  let t0 = 0;

  function frame() {
    requestAnimationFrame(frame);
    if (!globe || !visible || document.hidden) return;
    // 손을 떼면 원래 자리로 스르르 돌아온다
    if (dragX === null) dragOffset *= 0.92;
    spring += (dragOffset / 200 - spring) * 0.15;
    const sway = reduce ? 0 : Math.sin((performance.now() - t0) / 2600) * 0.35;
    const size = canvas.offsetWidth;
    globe.update({ phi: FOCUS_PHI + sway + spring, width: size, height: size });
  }

  function start() {
    const size = canvas.offsetWidth;
    if (!size) return;
    t0 = performance.now();
    globe = createGlobe(canvas, {
      devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      width: size,
      height: size,
      phi: FOCUS_PHI,
      theta: FOCUS_THETA,
      dark: 0,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 5,
      baseColor: [1, 1, 1],
      markerColor: [0.31, 0.27, 0.9],
      glowColor: [0.9, 0.92, 1],
      offset: [0, 0],
      markers: CITIES.map((location, i) => ({ location, size: i === 0 ? 0.04 : 0.025 })),
    });
    canvas.classList.add("is-ready");
    requestAnimationFrame(frame);
  }

  // 소개 탭이 실제로 보일 때 처음 만든다 (숨은 탭에서는 크기가 0)
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible && !globe) start();
  }).observe(canvas);
}
