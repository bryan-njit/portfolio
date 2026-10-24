import * as THREE from "three";

const YELLOW = 0xf2c230;
const canvas = document.getElementById("signal");

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
camera.position.set(0, 2.4, 10);
camera.lookAt(0, 1.4, 0);

scene.add(new THREE.HemisphereLight(0x9fb2c8, 0x0b0d10, 1.5));
const moon = new THREE.DirectionalLight(0xc8d6ff, 2.5);
moon.position.set(-5, 8, 4);
scene.add(moon);

const metal = new THREE.MeshStandardMaterial({ color: 0x7a818b, metalness: 0.3, roughness: 0.5 });
const darkMetal = new THREE.MeshStandardMaterial({ color: 0x343a42, metalness: 0.3, roughness: 0.6 });
const lensMat = new THREE.MeshStandardMaterial({ color: YELLOW, emissive: YELLOW, emissiveIntensity: 0.25 });
const batMat = new THREE.MeshStandardMaterial({ color: 0x050607, roughness: 0.8 });
const edgeMat = new THREE.LineBasicMaterial({ color: 0x8d929b, transparent: true, opacity: 0.35 });

// right half of the bat, the left half is mirrored. [x, y] or [x, y, cx, cy] for curves
const BAT = [
    [0.05, 0.16], [0.08, 0.38], [0.12, 0.16], [0.22, 0.2],
    [0.98, 0.42, 0.55, 0.18],
    [0.82, 0.04, 0.8, 0.26],
    [0.6, -0.08, 0.66, 0.06],
    [0.38, -0.14, 0.46, -0.02],
    [0.12, -0.3, 0.2, -0.12],
    [0, -0.5],
];

// works on a THREE.Shape or a 2d canvas context since they use the same method names
function traceBat(p, s) {
    p.moveTo(0, 0.12 * s);
    for (const [x, y, cx, cy] of BAT) {
        if (cx === undefined) p.lineTo(x * s, y * s);
        else p.quadraticCurveTo(cx * s, cy * s, x * s, y * s);
    }
    for (let i = BAT.length - 1; i >= 0; i--) {
        const [x, y] = i > 0 ? BAT[i - 1] : [0, 0.12];
        const [, , cx, cy] = BAT[i];
        if (cx === undefined) p.lineTo(-x * s, y * s);
        else p.quadraticCurveTo(-cx * s, cy * s, -x * s, y * s);
    }
}

// every piece goes in here so the build animation can fly it into place
const parts = [];

function addPart(geometry, material, parent, x, y, z, from) {
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
head.rotation.x = -0.55;
signal.add(head);

addPart(new THREE.CylinderGeometry(0.92, 0.8, 1.7, 40, 1, true).rotateX(Math.PI / 2), metal, head, 0, 0, 0, [0, 3, 0]);
addPart(new THREE.CylinderGeometry(0.55, 0.8, 0.45, 40).rotateX(-Math.PI / 2), darkMetal, head, 0, 0, -1.07, [0, 0, -3]);
addPart(new THREE.CylinderGeometry(0.12, 0.12, 0.2, 16).rotateZ(Math.PI / 2), darkMetal, head, -0.94, 0, 0, [-2, 0, 0]);
addPart(new THREE.CylinderGeometry(0.12, 0.12, 0.2, 16).rotateZ(Math.PI / 2), darkMetal, head, 0.94, 0, 0, [2, 0, 0]);

// cooling bands around the barrel
let band;
for (let i = 0; i < 3; i++) {
    const z = -0.6 + i * 0.3;
    band = addPart(new THREE.TorusGeometry(0.84 + i * 0.02, 0.05, 8, 48), darkMetal, head, 0, 0, z, [0, 0, -2 - i]);
}

addPart(new THREE.TorusGeometry(0.93, 0.07, 12, 48), metal, head, 0, 0, 0.85, [0, 0, 3]);
addPart(new THREE.CircleGeometry(0.88, 48), lensMat, head, 0, 0, 0.84, [0, 0, 4]);

const batShape = new THREE.Shape();
traceBat(batShape, 0.78);
const stencil = addPart(new THREE.ExtrudeGeometry(batShape, { depth: 0.03, bevelEnabled: false }), batMat, head, 0, 0, 0.86, [0, 0, 5]);

// light beam. a gradient alpha map makes it fade out with distance
function gradientTexture() {
    const c = document.createElement("canvas");
    c.width = 1;
    c.height = 64;
    const ctx = c.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, 0, 64);
    g.addColorStop(0, "#fff");
    g.addColorStop(1, "#000");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1, 64);
    return new THREE.CanvasTexture(c);
}

const beamMat = new THREE.MeshBasicMaterial({
    color: YELLOW, alphaMap: gradientTexture(), transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
});
const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.88, 2.4, 9, 40, 1, true).translate(0, -4.5, 0).rotateX(-Math.PI / 2),
    beamMat
);
beam.position.z = 0.86;
head.add(beam);

// the symbol on the clouds: a yellow glow with the bat's shadow in the middle
function skyTexture() {
    const c = document.createElement("canvas");
    c.width = c.height = 512;
    const ctx = c.getContext("2d");
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

const skyMat = new THREE.MeshBasicMaterial({ map: skyTexture(), transparent: true, opacity: 0, depthWrite: false });
const sky = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), skyMat);
sky.renderOrder = 1; // draw over the beam so the bat shadow stays dark
scene.add(sky);

// build animation. spread pushes the parts apart for the exploded view
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let buildStart = reduceMotion ? -1 : performance.now();

function updateParts(now, spread) {
    const t = buildStart < 0 ? 99 : (now - buildStart) / 1000;
    parts.forEach((p, i) => {
        let k = Math.min(Math.max((t - i * 0.06) / 0.7, 0), 1);
        k = 1 - Math.pow(1 - k, 3);
        p.position.copy(p.userData.from).multiplyScalar(1 - k + spread).add(p.userData.home);
        p.visible = k > 0;
    });
}

// labels with leader lines
const labelBox = document.querySelector(".labels");
const svg = labelBox.querySelector("svg");
const labels = [
    { part: stencil, title: "Bat stencil", note: "Cut steel, one of one", dx: -150, dy: -90 },
    { part: band, title: "Cooling bands", note: "3 alloy rings", dx: 150, dy: -110 },
    { part: yoke, title: "Steel yoke", note: "Tilts 0 to 90 deg", dx: 140, dy: 40 },
    { part: base, title: "Rooftop mount", note: "GCPD HQ, roof", dx: -160, dy: 50 },
];

for (const l of labels) {
    l.el = document.createElement("div");
    l.el.className = "part-label" + (l.dx < 0 ? " left" : "");
    l.el.innerHTML = `<b>${l.title}</b>${l.note}`;
    labelBox.append(l.el);
    l.line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    l.dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    l.dot.setAttribute("r", 3);
    svg.append(l.line, l.dot);
}

const v = new THREE.Vector3();

function updateLabels() {
    for (const l of labels) {
        v.setFromMatrixPosition(l.part.matrixWorld).project(camera);
        const x = canvas.offsetLeft + (v.x + 1) / 2 * canvas.clientWidth;
        const y = (1 - v.y) / 2 * canvas.clientHeight;
        const lx = x + l.dx;
        const ly = y + l.dy;
        l.line.setAttribute("x1", x);
        l.line.setAttribute("y1", y);
        l.line.setAttribute("x2", lx);
        l.line.setAttribute("y2", ly);
        l.dot.setAttribute("cx", x);
        l.dot.setAttribute("cy", y);
        l.el.style.transform = `translate(${l.dx < 0 ? `calc(${lx}px - 100%)` : `${lx}px`}, calc(${ly}px - 50%))`;
    }
}

// chapter dots in the nav
const dots = document.querySelectorAll(".dots a");

function clamp01(x) {
    return Math.min(Math.max(x, 0), 1);
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

document.getElementById("replay").addEventListener("click", () => {
    buildStart = performance.now();
});

// drag to spin it
let yaw = 0;
let dragging = false;
let lastX = 0;

canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    lastX = e.clientX;
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add("dragging");
});
canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    yaw += (e.clientX - lastX) * 0.01;
    lastX = e.clientX;
});
canvas.addEventListener("pointerup", () => {
    dragging = false;
    canvas.classList.remove("dragging");
});

function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();

const lookAt = new THREE.Vector3();
const dir = new THREE.Vector3();
const q = new THREE.Quaternion();

function frame(now) {
    // s = which chapter we're on, 0 is the first one. each chapter is one screen tall
    const s = Math.min(window.scrollY / window.innerHeight, 4);
    const explode = clamp01(1 - Math.abs(s - 2) * 1.6);
    const on = clamp01((s - 2.6) / 0.6);

    dots.forEach((d, i) => d.classList.toggle("active", Math.round(s) === i));

    // turns a bit as you scroll, then swings around to point at the sky
    const sway = reduceMotion ? 0 : Math.sin(now / 3000) * 0.08;
    signal.rotation.y = lerp(0.5 + s * 0.4, Math.PI + 0.35, on) + yaw + sway;
    head.rotation.x = lerp(-0.55, -0.45, on);

    camera.position.set(0, lerp(2.4, 3.2, on), lerp(10, 15, on));
    lookAt.set(0, lerp(1.4, 3.4, on), lerp(0, -2, on));
    camera.lookAt(lookAt);

    updateParts(now, explode * 0.12);

    lensMat.emissiveIntensity = 0.25 + on * 1.5;
    beamMat.opacity = on * 0.35;
    skyMat.opacity = on;

    // put the symbol where the beam ends
    head.getWorldPosition(sky.position);
    dir.set(0, 0, 1).applyQuaternion(head.getWorldQuaternion(q));
    sky.position.addScaledVector(dir, 8.5);
    sky.lookAt(camera.position);

    renderer.render(scene, camera);

    labelBox.style.opacity = clamp01(1 - (s - 2.3) / 0.4);
    updateLabels();

    requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
