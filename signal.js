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
addPart(new THREE.CylinderGeometry(1.2, 1.4, 0.3, 32), darkMetal, signal, 0, 0.15, 0, [0, -3, 0]);
addPart(new THREE.CylinderGeometry(0.2, 0.26, 0.8, 16), metal, signal, 0, 0.7, 0, [0, -3, 0]);
addPart(new THREE.BoxGeometry(2.3, 0.16, 0.36), metal, signal, 0, 1.1, 0, [0, -2, 0]);
addPart(new THREE.BoxGeometry(0.14, 1.0, 0.36), metal, signal, -1.08, 1.6, 0, [-3, 0, 0]);
addPart(new THREE.BoxGeometry(0.14, 1.0, 0.36), metal, signal, 1.08, 1.6, 0, [3, 0, 0]);

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
for (let i = 0; i < 3; i++) {
    const z = -0.6 + i * 0.3;
    addPart(new THREE.TorusGeometry(0.84 + i * 0.02, 0.05, 8, 48), darkMetal, head, 0, 0, z, [0, 0, -2 - i]);
}

addPart(new THREE.TorusGeometry(0.93, 0.07, 12, 48), metal, head, 0, 0, 0.85, [0, 0, 3]);
addPart(new THREE.CircleGeometry(0.88, 48), lensMat, head, 0, 0, 0.84, [0, 0, 4]);

const batShape = new THREE.Shape();
traceBat(batShape, 0.78);
addPart(new THREE.ExtrudeGeometry(batShape, { depth: 0.03, bevelEnabled: false }), batMat, head, 0, 0, 0.86, [0, 0, 5]);

// build animation
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let buildStart = reduceMotion ? -1 : performance.now();

function updateBuild(now) {
    const t = buildStart < 0 ? 99 : (now - buildStart) / 1000;
    parts.forEach((p, i) => {
        let k = Math.min(Math.max((t - i * 0.06) / 0.7, 0), 1);
        k = 1 - Math.pow(1 - k, 3);
        p.position.copy(p.userData.from).multiplyScalar(1 - k).add(p.userData.home);
        p.visible = k > 0;
    });
}

document.getElementById("replay").addEventListener("click", () => {
    buildStart = performance.now();
});

// drag to spin it
let yaw = 0.5;
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

function frame(now) {
    updateBuild(now);
    signal.rotation.y = yaw + (reduceMotion ? 0 : Math.sin(now / 3000) * 0.08);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
