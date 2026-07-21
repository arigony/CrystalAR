import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js";
import { COVALENT_RADII, ELEMENT_COLORS, VDW_RADII, inferBonds } from "./crystal.js";

const sphereCache = new Map();
const materialCache = new Map();

function sphereGeometry(detail = 18) {
  if (!sphereCache.has(detail)) sphereCache.set(detail, new THREE.SphereGeometry(1, detail, Math.max(12, Math.round(detail * .75))));
  return sphereCache.get(detail);
}

function materialFor(element) {
  if (!materialCache.has(element)) {
    materialCache.set(element, new THREE.MeshStandardMaterial({ color: ELEMENT_COLORS[element] ?? ELEMENT_COLORS.default, roughness: .42, metalness: .03 }));
  }
  return materialCache.get(element);
}

function makeCylinder(start, end, radius, material) {
  const a = new THREE.Vector3(...start);
  const b = new THREE.Vector3(...end);
  const direction = b.clone().sub(a);
  const length = direction.length();
  if (!Number.isFinite(length) || length < 1e-6) return null;
  const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 10), material);
  cylinder.position.copy(a).add(b).multiplyScalar(.5);
  cylinder.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return cylinder;
}

function addCellFrame(group, vectors, repeat) {
  const a = new THREE.Vector3(...vectors[0]).multiplyScalar(repeat);
  const b = new THREE.Vector3(...vectors[1]).multiplyScalar(repeat);
  const c = new THREE.Vector3(...vectors[2]).multiplyScalar(repeat);
  const o = new THREE.Vector3();
  const corners = [o, a, b, c, a.clone().add(b), a.clone().add(c), b.clone().add(c), a.clone().add(b).add(c)];
  const edges = [[0,1],[0,2],[0,3],[1,4],[1,5],[2,4],[2,6],[3,5],[3,6],[4,7],[5,7],[6,7]];
  const material = new THREE.LineBasicMaterial({ color: 0x1d6d78, transparent: true, opacity: .82 });
  const positions = [];
  edges.forEach(([i, j]) => positions.push(...corners[i].toArray(), ...corners[j].toArray()));
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const lines = new THREE.LineSegments(geometry, material);
  lines.name = "unit-cell-frame";
  group.add(lines);
}

export class CrystalRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xe8edf0);
    this.camera = new THREE.PerspectiveCamera(42, 1, .05, 500);
    this.camera.position.set(9, 7, 11);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = .08;
    this.controls.enablePan = true;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = .45;

    this.modelGroup = null;
    this.contentGroup = null;
    this.currentModel = null;
    this.modelMaxDimension = 5;
    this.options = { representation: "ball-stick", showCell: true, showBonds: true };
    this.arActive = false;
    this.arTargetPosition = new THREE.Vector3(0, .08, 0);
    this.arTargetQuaternion = new THREE.Quaternion();
    this.arTargetScale = new THREE.Vector3(1, 1, 1);

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x56616d, 2.0));
    const key = new THREE.DirectionalLight(0xffffff, 2.5);
    key.position.set(8, 12, 10);
    key.castShadow = true;
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0x9fcbd0, 1.2);
    fill.position.set(-10, 2, -8);
    this.scene.add(fill);

    this.resize();
    addEventListener("resize", () => this.resize());
    this.animate();
  }

  resize() {
    const width = innerWidth;
    const height = innerHeight;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / Math.max(height, 1);
    this.camera.updateProjectionMatrix();
  }

  getARBaseScale() {
    return THREE.MathUtils.clamp(6 / Math.max(this.modelMaxDimension, 1), .38, 1.05);
  }

  resetARTarget() {
    const base = this.getARBaseScale();
    this.arTargetPosition.set(0, .08, 0);
    this.arTargetQuaternion.identity();
    this.arTargetScale.set(base, base, base);
    if (this.modelGroup && this.arActive) {
      this.modelGroup.position.copy(this.arTargetPosition);
      this.modelGroup.quaternion.copy(this.arTargetQuaternion);
      this.modelGroup.scale.copy(this.arTargetScale);
    }
  }

  setARTarget({ position, quaternion, scale } = {}) {
    if (position) this.arTargetPosition.set(position[0], position[1], position[2]);
    if (quaternion) this.arTargetQuaternion.copy(quaternion);
    if (Number.isFinite(scale)) this.arTargetScale.setScalar(scale);
  }

  setAR(active) {
    this.arActive = Boolean(active);
    this.scene.background = this.arActive ? null : new THREE.Color(0xe8edf0);
    this.renderer.setClearColor(this.arActive ? 0x000000 : 0xe8edf0, this.arActive ? 0 : 1);
    this.controls.enabled = !this.arActive;
    this.controls.autoRotate = !this.arActive;

    if (this.arActive) {
      this.resetARTarget();
    } else if (this.modelGroup) {
      this.modelGroup.position.set(0, 0, 0);
      this.modelGroup.quaternion.identity();
      this.modelGroup.scale.set(1, 1, 1);
      this.fitToObject(this.modelGroup);
    }
  }

  renderModel(model, options = {}) {
    this.currentModel = model;
    this.options = { ...this.options, ...options };
    if (this.modelGroup) this.scene.remove(this.modelGroup);

    const content = new THREE.Group();
    const atomGroup = new THREE.Group();
    atomGroup.name = "atoms";
    const bondGroup = new THREE.Group();
    bondGroup.name = "bonds";

    const representation = this.options.representation;
    const detail = model.atoms.length > 900 ? 10 : 18;
    for (const atom of model.atoms) {
      const mesh = new THREE.Mesh(sphereGeometry(detail), materialFor(atom.element));
      const radius = representation === "space-fill"
        ? (VDW_RADII[atom.element] || VDW_RADII.default) * .58
        : representation === "wire" ? .11 : Math.max(.18, (COVALENT_RADII[atom.element] || .8) * .34);
      mesh.scale.setScalar(radius);
      mesh.position.set(...atom.cart);
      mesh.userData = atom;
      atomGroup.add(mesh);
    }

    if (this.options.showBonds && representation !== "space-fill") {
      const bonds = inferBonds(model.atoms);
      const material = new THREE.MeshStandardMaterial({ color: representation === "wire" ? 0x5e6c74 : 0xb9c0c5, roughness: .55 });
      const radius = representation === "wire" ? .035 : .075;
      for (const [a, b] of bonds) {
        const cylinder = makeCylinder(model.atoms[a].cart, model.atoms[b].cart, radius, material);
        if (cylinder) bondGroup.add(cylinder);
      }
    }

    content.add(bondGroup, atomGroup);
    if (this.options.showCell) addCellFrame(content, model.vectors, model.repeat);

    const initialBox = new THREE.Box3().setFromObject(content);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    initialBox.getCenter(center);
    initialBox.getSize(size);
    content.position.sub(center);
    this.modelMaxDimension = Math.max(size.x, size.y, size.z, 2);

    const root = new THREE.Group();
    root.add(content);
    this.scene.add(root);
    this.modelGroup = root;
    this.contentGroup = content;

    if (this.arActive) this.resetARTarget();
    else this.fitToObject(root);

    return { atomCount: model.atoms.length, bondCount: bondGroup.children.length };
  }

  fitToObject(object) {
    const box = new THREE.Box3().setFromObject(object);
    if (box.isEmpty()) return;
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z, 2);
    const distance = Math.min(Math.max(maxDim * 1.75, 5), 80);
    this.camera.position.set(distance * .8, distance * .65, distance);
    this.camera.near = Math.max(.02, distance / 1000);
    this.camera.far = Math.max(250, distance * 20);
    this.camera.updateProjectionMatrix();
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  resetView() {
    if (this.arActive) this.resetARTarget();
    else if (this.modelGroup) this.fitToObject(this.modelGroup);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    if (this.arActive && this.modelGroup) {
      this.modelGroup.position.lerp(this.arTargetPosition, .16);
      this.modelGroup.quaternion.slerp(this.arTargetQuaternion, .14);
      this.modelGroup.scale.lerp(this.arTargetScale, .14);
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
