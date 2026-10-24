import * as THREE from "three";

const YELLOW = 0xf2c230;

// labels pointing at parts of the signal. dx/dy = where the label sits compared to the part, in pixels
export const PART_LABELS = [
  { title: "Bat stencil", note: "Cut steel, one of one", dx: -150, dy: -90 },
  { title: "Cooling bands", note: "3 alloy rings", dx: 150, dy: -110 },
  { title: "Steel yoke", note: "Tilts 0 to 90 deg", dx: 140, dy: 40 },
  { title: "Rooftop mount", note: "GCPD HQ, roof", dx: -160, dy: 50 },
];

// right half of the bat, the left half is mirrored. [x, y] or [x, y, cx, cy] for curves
const BAT: [number, number, number?, number?][] = [
  [0.05, 0.16], [0.08, 0.38], [0.12, 0.16], [0.22, 0.2],
  [0.98, 0.42, 0.55, 0.18],
  [0.82, 0.04, 0.8, 0.26],
  [0.6, -0.08, 0.66, 0.06],
  [0.38, -0.14, 0.46, -0.02],
  [0.12, -0.3, 0.2, -0.12],
  [0, -0.5],
];

type PathLike = Pick<CanvasRenderingContext2D, "moveTo" | "lineTo" | "quadraticCurveTo">;

// works on a THREE.Shape or a 2d canvas since they use the same method names
function traceBat(p: PathLike, s: number) {
  p.moveTo(0, 0.12 * s);
  for (const [x, y, cx, cy] of BAT) {
    if (cx === undefined || cy === undefined) p.lineTo(x * s, y * s);
    else p.quadraticCurveTo(cx * s, cy * s, x * s, y * s);
  }
  for (let i = BAT.length - 1; i >= 0; i--) {
    const [x, y] = i > 0 ? BAT[i - 1] : [0, 0.12];
    const [, , cx, cy] = BAT[i];
    if (cx === undefined || cy === undefined) p.lineTo(-x * s, y * s);
    else p.quadraticCurveTo(-cx * s, cy * s, -x * s, y * s);
  }
}

// white at the top fading to black, used so the beam fades out with distance
function fadeTexture() {
  const c = document.createElement("canvas");
  c.width = 1;
  c.height = 64;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 64);
  g.addColorStop(0, "#fff");
  g.addColorStop(1, "#000");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1, 64);
  return new THREE.CanvasTexture(c);
}

// the symbol on the clouds: a yellow glow with the bat's shadow in the middle
function skyTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(256, 256, 80, 256, 256, 256);
  g.addColorStop(0, "rgba(242,194,48,0.95)");
  g.addColorStop(0.7, "rgba(242,194,48,0.6)");
  g.addColorStop(1, "rgba(242,194,48,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  ctx.translate(256, 256);
  ctx.scale(1, -1);
  ctx.beginPath();
  traceBat(ctx, 180);
  ctx.fillStyle = "rgba(11,13,16,0.92)";
  ctx.fill();
  return new THREE.CanvasTexture(c);
}

function clamp01(x: number) {
  return Math.min(Math.max(x, 0), 1);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

type SceneElements = {
  canvas: HTMLCanvasElement;
  labelBox: HTMLElement;
  cityLines: SVGSVGElement;
  cityLinks: HTMLAnchorElement[];
  aim: { current: number };
};

export function createSignalScene({ canvas, labelBox, cityLines, cityLinks, aim }: SceneElements) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  // phones get a lower resolution so the frame rate stays smooth
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 800 ? 1.5 : 2));

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0b0d10, 16, 36);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);

  scene.add(new THREE.HemisphereLight(0x9fb2c8, 0x0b0d10, 1.5));
  const moon = new THREE.DirectionalLight(0xc8d6ff, 2.5);
  moon.position.set(-5, 8, 4);
  scene.add(moon);

  const metal = new THREE.MeshStandardMaterial({ color: 0x7a818b, metalness: 0.3, roughness: 0.5 });
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x343a42, metalness: 0.3, roughness: 0.6 });
  const lensMat = new THREE.MeshStandardMaterial({ color: YELLOW, emissive: YELLOW, emissiveIntensity: 0.25 });
  const batMat = new THREE.MeshStandardMaterial({ color: 0x050607, roughness: 0.8 });
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x8d929b, transparent: true, opacity: 0.35 });

  // ---- the signal ----

  // every piece goes in here so the build animation can fly it into place
  const parts: THREE.Mesh[] = [];

  function addPart(geometry: THREE.BufferGeometry, material: THREE.Material, parent: THREE.Object3D,
    x: number, y: number, z: number, from: [number, number, number]) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 30), edgeMat));
    mesh.userData.home = mesh.position.clone();
    mesh.userData.from = new THREE.Vector3(...from);
    parent.add(mesh);
    parts.push(mesh);
    return mesh;
  }

  const signal = new THREE.Group();
  scene.add(signal);

  // rooftop mount + yoke
  const base = addPart(new THREE.CylinderGeometry(1.2, 1.4, 0.3, 32), darkMetal, signal, 0, 0.15, 0, [0, -3, 0]);
  addPart(new THREE.CylinderGeometry(0.2, 0.26, 0.8, 16), metal, signal, 0, 0.7, 0, [0, -3, 0]);
  addPart(new THREE.BoxGeometry(2.3, 0.16, 0.36), metal, signal, 0, 1.1, 0, [0, -2, 0]);
  addPart(new THREE.BoxGeometry(0.14, 1.0, 0.36), metal, signal, -1.08, 1.6, 0, [-3, 0, 0]);
  const yoke = addPart(new THREE.BoxGeometry(0.14, 1.0, 0.36), metal, signal, 1.08, 1.6, 0, [3, 0, 0]);

  // lamp head, tilted up at the sky. its front faces +z
  const head = new THREE.Group();
  head.position.set(0, 1.9, 0);
  signal.add(head);

  addPart(new THREE.CylinderGeometry(0.92, 0.8, 1.7, 40, 1, true).rotateX(Math.PI / 2), metal, head, 0, 0, 0, [0, 3, 0]);
  addPart(new THREE.CylinderGeometry(0.55, 0.8, 0.45, 40).rotateX(-Math.PI / 2), darkMetal, head, 0, 0, -1.07, [0, 0, -3]);
  addPart(new THREE.CylinderGeometry(0.12, 0.12, 0.2, 16).rotateZ(Math.PI / 2), darkMetal, head, -0.94, 0, 0, [-2, 0, 0]);
  addPart(new THREE.CylinderGeometry(0.12, 0.12, 0.2, 16).rotateZ(Math.PI / 2), darkMetal, head, 0.94, 0, 0, [2, 0, 0]);

  // cooling bands around the barrel
  addPart(new THREE.TorusGeometry(0.84, 0.05, 8, 48), darkMetal, head, 0, 0, -0.6, [0, 0, -2]);
  addPart(new THREE.TorusGeometry(0.86, 0.05, 8, 48), darkMetal, head, 0, 0, -0.3, [0, 0, -3]);
  const band = addPart(new THREE.TorusGeometry(0.88, 0.05, 8, 48), darkMetal, head, 0, 0, 0, [0, 0, -4]);

  addPart(new THREE.TorusGeometry(0.93, 0.07, 12, 48), metal, head, 0, 0, 0.85, [0, 0, 3]);
  addPart(new THREE.CircleGeometry(0.88, 48), lensMat, head, 0, 0, 0.84, [0, 0, 4]);

  const batShape = new THREE.Shape();
  traceBat(batShape, 0.78);
  const stencil = addPart(new THREE.ExtrudeGeometry(batShape, { depth: 0.03, bevelEnabled: false }), batMat, head, 0, 0, 0.86, [0, 0, 5]);

  // light beam coming out of the lens
  const beamMat = new THREE.MeshBasicMaterial({
    color: YELLOW, alphaMap: fadeTexture(), transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.88, 2.4, 9, 40, 1, true).translate(0, -4.5, 0).rotateX(-Math.PI / 2),
    beamMat
  );
  beam.position.z = 0.86;
  head.add(beam);

  const skyMat = new THREE.MeshBasicMaterial({ map: skyTexture(), transparent: true, opacity: 0, depthWrite: false });
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), skyMat);
  sky.renderOrder = 1; // draw over the beam so the bat shadow stays dark
  scene.add(sky);

  // ---- gotham skyline for the last chapter. the first 4 buildings go with the menu links ----

  const city = new THREE.Group();
  scene.add(city);
  const cityMat = new THREE.MeshStandardMaterial({ color: 0x1a1f26, roughness: 0.9 });
  const buildings: THREE.Mesh[] = [];

  function addBuilding(x: number, z: number, w: number, h: number) {
    const geo = new THREE.BoxGeometry(w, h, w);
    const b = new THREE.Mesh(geo, cityMat);
    b.position.set(x, h / 2, z);
    b.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat));
    b.userData.height = h;
    city.add(b);
    buildings.push(b);
  }

  addBuilding(-5.2, -8.5, 1.4, 6.5);
  addBuilding(-2, -9.5, 1.5, 8.5);
  addBuilding(2.6, -8.5, 1.4, 7.2);
  addBuilding(5.6, -8, 1.3, 5.8);
  for (let i = 0; i < 16; i++) {
    addBuilding(-10 + i * 1.35, -11 - (i % 3) * 1.2, 0.9 + Math.random() * 0.6, 4 + Math.random() * 5);
  }

  // ---- lines from html labels to 3D objects ----

  const v = new THREE.Vector3();

  // where a point on an object shows up on the page, in pixels
  function toScreen(obj: THREE.Object3D, y = 0) {
    v.set(0, y, 0);
    obj.localToWorld(v).project(camera);
    return {
      x: canvas.offsetLeft + ((v.x + 1) / 2) * canvas.clientWidth,
      y: canvas.offsetTop + ((1 - v.y) / 2) * canvas.clientHeight,
    };
  }

  function drawLine(line: SVGLineElement, dot: SVGCircleElement, x1: number, y1: number, x2: number, y2: number) {
    line.setAttribute("x1", String(x1));
    line.setAttribute("y1", String(y1));
    line.setAttribute("x2", String(x2));
    line.setAttribute("y2", String(y2));
    dot.setAttribute("cx", String(x2));
    dot.setAttribute("cy", String(y2));
  }

  const anchors = [stencil, band, yoke, base]; // same order as PART_LABELS
  const labelEls = labelBox.querySelectorAll<HTMLElement>(".part-label");
  const labelLines = labelBox.querySelectorAll("line");
  const labelDots = labelBox.querySelectorAll("circle");

  function updateLabels() {
    PART_LABELS.forEach((label, i) => {
      const p = toScreen(anchors[i]);
      const x = p.x + label.dx;
      const y = p.y + label.dy;
      drawLine(labelLines[i], labelDots[i], x, y, p.x, p.y);
      // labels on the left side hang off the end of their line instead of the start
      labelEls[i].style.transform = `translate(${label.dx < 0 ? `calc(${x}px - 100%)` : `${x}px`}, calc(${y}px - 50%))`;
    });
  }

  const cityLineEls = cityLines.querySelectorAll("line");
  const cityDots = cityLines.querySelectorAll("circle");

  function updateCityLines() {
    const box = cityLines.getBoundingClientRect();
    cityLinks.forEach((link, i) => {
      const r = link.getBoundingClientRect();
      const top = toScreen(buildings[i], buildings[i].userData.height / 2);
      drawLine(cityLineEls[i], cityDots[i], r.right - box.left + 12, r.top + r.height / 2 - box.top, top.x, top.y);
      cityLineEls[i].classList.toggle("lit", aim.current === i);
    });
  }

  // ---- build animation, dragging, resizing ----

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let buildStart = reduceMotion ? -1 : performance.now();

  // spread pushes the parts apart for the exploded view
  function updateParts(now: number, spread: number) {
    const t = buildStart < 0 ? 99 : (now - buildStart) / 1000;
    parts.forEach((p, i) => {
      let k = clamp01((t - i * 0.06) / 0.7);
      k = 1 - Math.pow(1 - k, 3);
      p.position.copy(p.userData.from).multiplyScalar(1 - k + spread).add(p.userData.home);
      p.visible = k > 0;
    });
  }

  // removes every event listener at once when the page is done with the scene
  const events = new AbortController();
  let dragYaw = 0; // how far you've spun it with the mouse
  let dragging = false;
  let lastX = 0;

  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    lastX = e.clientX;
    canvas.setPointerCapture(e.pointerId);
  }, { signal: events.signal });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    dragYaw += (e.clientX - lastX) * 0.01;
    lastX = e.clientX;
  }, { signal: events.signal });
  canvas.addEventListener("pointerup", () => (dragging = false), { signal: events.signal });
  // the browser took over the touch to scroll the page, so we never get a pointerup
  canvas.addEventListener("pointercancel", () => (dragging = false), { signal: events.signal });

  function resize() {
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    // tall phone screens get a wider view so the bat in the sky stays in frame
    camera.fov = camera.aspect < 1 ? 46 : 32;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize, { signal: events.signal });
  resize();

  // ---- every frame ----

  const lookAt = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const q = new THREE.Quaternion();
  let aimYaw = 0.5;
  let aimTilt = -0.55;
  let throwDist = 8.5;
  let frameId = 0;

  // the box the canvas sits in is exactly one chapter tall. window.innerHeight isn't on phones,
  // because it shrinks while the address bar is showing
  const stage = canvas.parentElement!;

  function frame(now: number) {
    // s = which chapter we're on, 0 is the first one
    const s = Math.min(window.scrollY / stage.clientHeight, 4);
    const explode = clamp01(1 - Math.abs(s - 2) * 1.6);
    const on = clamp01((s - 2.6) / 0.6);
    const last = clamp01(s - 3);

    // turns a bit as you scroll, then swings around to point at the sky
    let targetYaw = lerp(0.5 + s * 0.4, Math.PI + 0.35, on);
    let targetTilt = lerp(-0.55, -0.45, on);
    let targetDist = 8.5;
    const lit = last > 0.5 ? aim.current : -1;
    if (lit >= 0) {
      // swing over to the building for the hovered link
      const b = buildings[lit];
      const flat = Math.hypot(b.position.x, b.position.z);
      targetYaw = Math.PI + Math.atan2(-b.position.x, -b.position.z);
      targetTilt = -Math.atan2(b.userData.height - 1 + city.position.y - 1.9, flat);
      targetDist = flat - 1;
    }
    aimYaw = lerp(aimYaw, targetYaw, 0.1);
    aimTilt = lerp(aimTilt, targetTilt, 0.1);
    throwDist = lerp(throwDist, targetDist, 0.1);

    const sway = reduceMotion ? 0 : Math.sin(now / 3000) * 0.08;
    signal.rotation.y = aimYaw + dragYaw + sway;
    head.rotation.x = aimTilt;

    // the skyline comes up from below in the last chapter
    city.position.y = lerp(-22, -3, 1 - Math.pow(1 - last, 3));

    camera.position.set(0, lerp(lerp(2.4, 3.2, on), 4, last), lerp(lerp(10, 15, on), 18, last));
    lookAt.set(0, lerp(lerp(1.4, 3.4, on), 2.2, last), lerp(lerp(0, -2, on), -5, last));
    camera.lookAt(lookAt);

    updateParts(now, explode * 0.12);

    lensMat.emissiveIntensity = 0.25 + on * 1.5;
    beamMat.opacity = on * 0.35;
    skyMat.opacity = on;

    // put the symbol where the beam ends
    head.getWorldPosition(sky.position);
    dir.set(0, 0, 1).applyQuaternion(head.getWorldQuaternion(q));
    sky.position.addScaledVector(dir, throwDist);
    sky.lookAt(camera.position);
    sky.scale.setScalar(lerp(sky.scale.x, lit >= 0 ? 0.4 : 1, 0.1));

    renderer.render(scene, camera);

    labelBox.style.opacity = String(clamp01(1 - (s - 2.3) / 0.4));
    if (s < 2.7) updateLabels(); // they're faded out after this
    cityLines.style.opacity = String(clamp01((last - 0.6) / 0.4));
    if (last > 0) updateCityLines();

    frameId = requestAnimationFrame(frame);
  }
  frameId = requestAnimationFrame(frame);

  return {
    replay() {
      buildStart = performance.now();
    },
    destroy() {
      cancelAnimationFrame(frameId);
      events.abort();
      renderer.dispose();
    },
  };
}
