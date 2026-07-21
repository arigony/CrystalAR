import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js";
import { ConvexGeometry } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/geometries/ConvexGeometry.js";
import { COVALENT_RADII, ELEMENT_COLORS, VDW_RADII, findBondRule, inferBonds } from "./crystal.js";

const sphereCache = new Map(), materialCache = new Map();
const DEFAULT_OPTIONS = { representation: "ball-stick", showCell: true, showBonds: true, bondRules: null, showPolyhedra: false, polyhedra: null };
function sphereGeometry(detail = 18) {
  if (!sphereCache.has(detail)) sphereCache.set(detail, new THREE.SphereGeometry(1, detail, Math.max(12, Math.round(detail * .75))));
  return sphereCache.get(detail);
}
function materialFor(element, occupancy = 1) {
  const bucket = occupancy < .5 ? "partial" : "full", key = `${element}:${bucket}`;
  if (!materialCache.has(key)) materialCache.set(key, new THREE.MeshStandardMaterial({
    color: ELEMENT_COLORS[element] ?? ELEMENT_COLORS.default, roughness: .42, metalness: .03,
    transparent: occupancy < .999, opacity: occupancy < .999 ? Math.max(.30, occupancy) : 1, depthWrite: occupancy >= .999
  }));
  return materialCache.get(key);
}
function makeCylinder(start, end, radius, material) {
  const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end), direction = b.clone().sub(a), length = direction.length();
  if (!Number.isFinite(length) || length < 1e-6) return null;
  const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 10), material);
  cylinder.position.copy(a).add(b).multiplyScalar(.5);
  cylinder.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return cylinder;
}
function addCellFrame(group, vectors, repeat) {
  const a = new THREE.Vector3(...vectors[0]).multiplyScalar(repeat), b = new THREE.Vector3(...vectors[1]).multiplyScalar(repeat), c = new THREE.Vector3(...vectors[2]).multiplyScalar(repeat), o = new THREE.Vector3();
  const corners = [o, a, b, c, a.clone().add(b), a.clone().add(c), b.clone().add(c), a.clone().add(b).add(c)];
  const edges = [[0,1],[0,2],[0,3],[1,4],[1,5],[2,4],[2,6],[3,5],[3,6],[4,7],[5,7],[6,7]];
  const positions = [];
  edges.forEach(([i, j]) => positions.push(...corners[i].toArray(), ...corners[j].toArray()));
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const lines = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0x1d6d78, transparent: true, opacity: .82 }));
  lines.name = "unit-cell-frame"; group.add(lines);
}
function angleDegrees(a, b, c) {
  const v1 = new THREE.Vector3(...a.cart).sub(new THREE.Vector3(...b.cart));
  const v2 = new THREE.Vector3(...c.cart).sub(new THREE.Vector3(...b.cart));
  return THREE.MathUtils.radToDeg(v1.angleTo(v2));
}

export class CrystalRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); this.renderer.outputColorSpace = THREE.SRGBColorSpace; this.renderer.shadowMap.enabled = true;
    this.scene = new THREE.Scene(); this.scene.background = new THREE.Color(0xe8edf0);
    this.camera = new THREE.PerspectiveCamera(42, 1, .05, 500); this.camera.position.set(9, 7, 11);
    this.controls = new OrbitControls(this.camera, canvas); this.controls.enableDamping = true; this.controls.dampingFactor = .08; this.controls.enablePan = true; this.controls.autoRotate = true; this.controls.autoRotateSpeed = .45;
    this.modelGroup = null; this.contentGroup = null; this.atomGroup = null; this.currentModel = null; this.modelMaxDimension = 5;
    this.options = { ...DEFAULT_OPTIONS }; this.arActive = false;
    this.arTargetPosition = new THREE.Vector3(0, .08, 0); this.arTargetQuaternion = new THREE.Quaternion(); this.arTargetScale = new THREE.Vector3(1, 1, 1);
    this.measurementMode = false; this.measurementAtoms = []; this.measurementCallback = null; this.raycaster = new THREE.Raycaster(); this.pointer = new THREE.Vector2(); this.pointerDown = null;
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x56616d, 2.0));
    const key = new THREE.DirectionalLight(0xffffff, 2.5); key.position.set(8, 12, 10); key.castShadow = true; this.scene.add(key);
    const fill = new THREE.DirectionalLight(0x9fcbd0, 1.2); fill.position.set(-10, 2, -8); this.scene.add(fill);
    this.canvas.addEventListener("pointerdown", event => { this.pointerDown = [event.clientX, event.clientY]; });
    this.canvas.addEventListener("pointerup", event => {
      if (!this.measurementMode || this.arActive || !this.pointerDown) return;
      if (Math.hypot(event.clientX - this.pointerDown[0], event.clientY - this.pointerDown[1]) <= 6) this.pickAtom(event);
    });
    this.resize(); addEventListener("resize", () => this.resize()); this.animate(); globalThis.CrystalARRenderer = this;
  }
  resize() { const width = innerWidth, height = innerHeight; this.renderer.setSize(width, height, false); this.camera.aspect = width / Math.max(height, 1); this.camera.updateProjectionMatrix(); }
  getARBaseScale() { return THREE.MathUtils.clamp(6 / Math.max(this.modelMaxDimension, 1), .38, 1.05); }
  resetARTarget() {
    const base = this.getARBaseScale(); this.arTargetPosition.set(0, .08, 0); this.arTargetQuaternion.identity(); this.arTargetScale.set(base, base, base);
    if (this.modelGroup && this.arActive) { this.modelGroup.position.copy(this.arTargetPosition); this.modelGroup.quaternion.copy(this.arTargetQuaternion); this.modelGroup.scale.copy(this.arTargetScale); }
  }
  setARTarget({ position, quaternion, scale } = {}) { if (position) this.arTargetPosition.set(position[0], position[1], position[2]); if (quaternion) this.arTargetQuaternion.copy(quaternion); if (Number.isFinite(scale)) this.arTargetScale.setScalar(scale); }
  setAR(active) {
    this.arActive = Boolean(active); this.scene.background = this.arActive ? null : new THREE.Color(0xe8edf0); this.renderer.setClearColor(this.arActive ? 0x000000 : 0xe8edf0, this.arActive ? 0 : 1);
    this.controls.enabled = !this.arActive; this.controls.autoRotate = !this.arActive;
    if (this.arActive) this.resetARTarget(); else if (this.modelGroup) { this.modelGroup.position.set(0, 0, 0); this.modelGroup.quaternion.identity(); this.modelGroup.scale.set(1, 1, 1); this.fitToObject(this.modelGroup); }
  }
  addPolyhedra(group, model, bonds, config) {
    if (!config) return 0;
    const neighbors = new Map();
    for (const [a,b] of bonds) { if (!neighbors.has(a)) neighbors.set(a, []); if (!neighbors.has(b)) neighbors.set(b, []); neighbors.get(a).push(b); neighbors.get(b).push(a); }
    const central = new Set(config.centralElements || []), ligands = new Set(config.ligandElements || []), minNeighbors = Number(config.minNeighbors) || 4;
    const material = new THREE.MeshStandardMaterial({ color: config.color ?? 0x5f8fc4, transparent: true, opacity: .20, side: THREE.DoubleSide, depthWrite: false, roughness: .6 });
    let count = 0;
    for (let i=0; i<model.atoms.length && count<180; i+=1) {
      if (!central.has(model.atoms[i].element)) continue;
      const ids = (neighbors.get(i) || []).filter(j => ligands.has(model.atoms[j].element));
      if (ids.length < minNeighbors) continue;
      const points = ids.map(j => new THREE.Vector3(...model.atoms[j].cart));
      try { const mesh = new THREE.Mesh(new ConvexGeometry(points), material); mesh.name = "coordination-polyhedron"; group.add(mesh); count += 1; } catch { /* incomplete or coplanar environment */ }
    }
    return count;
  }
  renderModel(model, options = {}) {
    this.currentModel = model; this.options = { ...DEFAULT_OPTIONS, ...options }; this.clearMeasurements();
    if (this.modelGroup) this.scene.remove(this.modelGroup);
    const content = new THREE.Group(), atomGroup = new THREE.Group(), bondGroup = new THREE.Group(), polyhedraGroup = new THREE.Group();
    atomGroup.name = "atoms"; bondGroup.name = "bonds"; polyhedraGroup.name = "polyhedra";
    const representation = this.options.representation, detail = model.atoms.length > 900 ? 10 : 18;
    for (const atom of model.atoms) {
      const occupancy = Number.isFinite(atom.occupancy) ? atom.occupancy : 1;
      const mesh = new THREE.Mesh(sphereGeometry(detail), materialFor(atom.element, occupancy));
      const radius = representation === "space-fill" ? (VDW_RADII[atom.element] || VDW_RADII.default) * .58 : representation === "wire" ? .11 : Math.max(.18, (COVALENT_RADII[atom.element] || .8) * .34);
      mesh.scale.setScalar(radius * (occupancy < .999 ? .86 : 1)); mesh.position.set(...atom.cart); mesh.userData = atom; atomGroup.add(mesh);
    }
    let bonds = [];
    if ((this.options.showBonds && representation !== "space-fill") || this.options.showPolyhedra) bonds = inferBonds(model.atoms, 18000, this.options.bondRules);
    if (this.options.showBonds && representation !== "space-fill") {
      const materials = {
        covalent: new THREE.MeshStandardMaterial({ color: 0xb9c0c5, roughness: .55 }),
        coordination: new THREE.MeshStandardMaterial({ color: 0x5e91ad, roughness: .6, transparent: true, opacity: .72 }),
        generic: new THREE.MeshStandardMaterial({ color: representation === "wire" ? 0x5e6c74 : 0xb9c0c5, roughness: .55 })
      };
      for (const [a,b] of bonds) {
        const rule = findBondRule(model.atoms[a], model.atoms[b], this.options.bondRules || []), kind = rule?.kind || "generic";
        const radius = representation === "wire" ? .035 : kind === "coordination" ? .045 : .075;
        const cylinder = makeCylinder(model.atoms[a].cart, model.atoms[b].cart, radius, materials[kind] || materials.generic); if (cylinder) bondGroup.add(cylinder);
      }
    }
    const polyhedronCount = this.options.showPolyhedra ? this.addPolyhedra(polyhedraGroup, model, bonds, this.options.polyhedra) : 0;
    content.add(polyhedraGroup, bondGroup, atomGroup); if (this.options.showCell) addCellFrame(content, model.vectors, model.repeat);
    const initialBox = new THREE.Box3().setFromObject(content), center = new THREE.Vector3(), size = new THREE.Vector3(); initialBox.getCenter(center); initialBox.getSize(size); content.position.sub(center); this.modelMaxDimension = Math.max(size.x, size.y, size.z, 2);
    const root = new THREE.Group(); root.add(content); this.scene.add(root); this.modelGroup = root; this.contentGroup = content; this.atomGroup = atomGroup; this.clearMeasurements();
    if (this.arActive) this.resetARTarget(); else this.fitToObject(root);
    return { atomCount: model.atoms.length, bondCount: bondGroup.children.length, polyhedronCount };
  }
  setMeasurementMode(active, callback = null) { this.measurementMode = Boolean(active); this.measurementCallback = callback; this.canvas.classList.toggle("measurement-active", this.measurementMode); if (!active) this.clearMeasurements(); }
  clearMeasurements() { this.measurementAtoms = []; if (this.measurementGroup && this.contentGroup) this.contentGroup.remove(this.measurementGroup); this.measurementGroup = new THREE.Group(); this.measurementGroup.name = "measurements"; if (this.contentGroup) this.contentGroup.add(this.measurementGroup); }
  pickAtom(event) {
    if (!this.atomGroup || !this.currentModel) return;
    const rect = this.canvas.getBoundingClientRect(); this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1; this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera); const hit = this.raycaster.intersectObjects(this.atomGroup.children, false)[0]; if (!hit) return;
    const atom = hit.object.userData; if (this.measurementAtoms.length >= 3) this.clearMeasurements(); this.measurementAtoms.push(atom);
    const marker = new THREE.Mesh(sphereGeometry(12), new THREE.MeshBasicMaterial({ color: 0xffb000, wireframe: true })); marker.position.copy(hit.object.position); marker.scale.copy(hit.object.scale).multiplyScalar(1.5); this.measurementGroup.add(marker);
    const atoms = this.measurementAtoms; let text = `${atoms.length}/3 átomo(s) selecionado(s)`; let distance = null, angle = null;
    if (atoms.length >= 2) { distance = Math.hypot(atoms[0].cart[0]-atoms[1].cart[0],atoms[0].cart[1]-atoms[1].cart[1],atoms[0].cart[2]-atoms[1].cart[2]); text = `${atoms[0].label}–${atoms[1].label}: ${distance.toFixed(3)} Å`; }
    if (atoms.length === 3) { angle = angleDegrees(atoms[0], atoms[1], atoms[2]); text += ` · ∠${atoms[0].label}–${atoms[1].label}–${atoms[2].label}: ${angle.toFixed(2)}°`; }
    this.measurementCallback?.({ atoms: [...atoms], distance, angle, text });
  }
  fitToObject(object) {
    const box = new THREE.Box3().setFromObject(object); if (box.isEmpty()) return; const size = new THREE.Vector3(); box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z, 2), distance = Math.min(Math.max(maxDim * 1.75, 5), 80); this.camera.position.set(distance * .8, distance * .65, distance); this.camera.near = Math.max(.02, distance / 1000); this.camera.far = Math.max(250, distance * 20); this.camera.updateProjectionMatrix(); this.controls.target.set(0,0,0); this.controls.update();
  }
  resetView() { if (this.arActive) this.resetARTarget(); else if (this.modelGroup) this.fitToObject(this.modelGroup); }
  animate() { requestAnimationFrame(() => this.animate()); if (this.arActive && this.modelGroup) { this.modelGroup.position.lerp(this.arTargetPosition, .16); this.modelGroup.quaternion.slerp(this.arTargetQuaternion, .14); this.modelGroup.scale.lerp(this.arTargetScale, .14); } this.controls.update(); this.renderer.render(this.scene, this.camera); }
}
