// 히어로 3D 배경: 천천히 일렁이는 점 물결 (Three.js)
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const canvas = document.getElementById("heroCanvas");
const hero = canvas?.closest(".hero3");
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function supportsWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch (e) {
    return false;
  }
}

if (canvas && hero && supportsWebGL()) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 200);
  camera.position.set(0, 4.2, 14);
  camera.lookAt(0, 1.2, -10);

  const small = window.innerWidth < 700;
  const COLS = small ? 70 : 130;
  const ROWS = small ? 40 : 60;
  const GAP = 0.42;
  const positions = new Float32Array(COLS * ROWS * 3);
  let k = 0;
  for (let i = 0; i < COLS; i++) {
    for (let j = 0; j < ROWS; j++) {
      positions[k++] = (i - COLS / 2) * GAP;
      positions[k++] = 0;
      positions[k++] = (j - ROWS / 2) * GAP - 6;
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color("#4f46e5") },
      uPixel: { value: renderer.getPixelRatio() },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uPixel;
      varying float vFade;
      void main() {
        vec3 p = position;
        p.y = sin(p.x * 0.32 + uTime * 0.55) * 0.75
            + cos(p.z * 0.28 + uTime * 0.4) * 0.65
            + sin((p.x + p.z) * 0.14 + uTime * 0.3) * 0.5;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float dist = -mv.z;
        gl_PointSize = uPixel * 44.0 / dist;
        vFade = smoothstep(46.0, 8.0, dist) * (0.55 + 0.45 * (p.y + 1.9) / 3.8);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying float vFade;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c);
        if (d > 0.5) discard;
        float a = smoothstep(0.5, 0.15, d) * vFade * 0.75;
        gl_FragColor = vec4(uColor, a);
      }
    `,
  });
  const points = new THREE.Points(geometry, material);
  points.rotation.y = -0.18;
  scene.add(points);

  // 마우스 위치에 따라 아주 살짝 기울기
  let tx = 0;
  let ty = 0;
  hero.addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width - 0.5) * 0.25;
    ty = ((e.clientY - r.top) / r.height - 0.5) * 0.12;
  });

  function resize() {
    const w = hero.clientWidth;
    const h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(hero);

  let visible = true;
  new IntersectionObserver((es) => {
    visible = es[0].isIntersecting;
  }).observe(hero);

  const clock = new THREE.Clock();
  function frame() {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    material.uniforms.uTime.value = clock.getElapsedTime();
    points.rotation.y += (-0.18 + tx - points.rotation.y) * 0.03;
    points.rotation.x += (ty - points.rotation.x) * 0.03;
    renderer.render(scene, camera);
  }

  if (reduce) {
    material.uniforms.uTime.value = 2.0;
    renderer.render(scene, camera);
  } else {
    frame();
  }
  canvas.classList.add("is-ready");
}
