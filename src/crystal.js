import { extractAtomSites, extractCell, extractMetadata, extractSymmetryOperations } from "./cif-parser.js";

const DEG = Math.PI / 180;

export const COVALENT_RADII = {
  H: 0.31, He: 0.28, Li: 1.28, Be: 0.96, B: 0.84, C: 0.76, N: 0.71, O: 0.66, F: 0.57, Ne: 0.58,
  Na: 1.66, Mg: 1.41, Al: 1.21, Si: 1.11, P: 1.07, S: 1.05, Cl: 1.02, Ar: 1.06,
  K: 2.03, Ca: 1.76, Sc: 1.70, Ti: 1.60, V: 1.53, Cr: 1.39, Mn: 1.39, Fe: 1.32, Co: 1.26, Ni: 1.24,
  Cu: 1.32, Zn: 1.22, Ga: 1.22, Ge: 1.20, As: 1.19, Se: 1.20, Br: 1.20, Kr: 1.16,
  Rb: 2.20, Sr: 1.95, Y: 1.90, Zr: 1.75, Nb: 1.64, Mo: 1.54, Tc: 1.47, Ru: 1.46, Rh: 1.42, Pd: 1.39,
  Ag: 1.45, Cd: 1.44, In: 1.42, Sn: 1.39, Sb: 1.39, Te: 1.38, I: 1.39, Xe: 1.40,
  Cs: 2.44, Ba: 2.15, La: 2.07, Ce: 2.04, Pr: 2.03, Nd: 2.01, Sm: 1.98, Eu: 1.98, Gd: 1.96,
  Tb: 1.94, Dy: 1.92, Ho: 1.92, Er: 1.89, Tm: 1.90, Yb: 1.87, Lu: 1.87, Hf: 1.75, Ta: 1.70,
  W: 1.62, Re: 1.51, Os: 1.44, Ir: 1.41, Pt: 1.36, Au: 1.36, Hg: 1.32, Tl: 1.45, Pb: 1.46, Bi: 1.48
};

export const VDW_RADII = {
  H: 1.20, C: 1.70, N: 1.55, O: 1.52, F: 1.47, P: 1.80, S: 1.80, Cl: 1.75, Br: 1.85, I: 1.98,
  Na: 2.27, Mg: 1.73, K: 2.75, Ca: 2.31, Fe: 2.00, Co: 2.00, Ni: 1.97, Cu: 1.96, Zn: 2.01,
  Ti: 2.00, Ba: 2.68, default: 1.80
};

export const ELEMENT_COLORS = {
  H: 0xffffff, C: 0x3b3b3b, N: 0x315efb, O: 0xef2b2d, F: 0x7bd85b, P: 0xff8a00, S: 0xf0c62d,
  Cl: 0x36b233, Br: 0x8b2b20, I: 0x6d2f8f, B: 0xf4a7a7, Si: 0xd7aa84, Al: 0xb8a0d7,
  Na: 0x7d55d9, K: 0x8b3fe3, Mg: 0x3cc35c, Ca: 0x45cc45, Ti: 0xbfc2c7, Fe: 0xd56a36, Co: 0xef5b8c,
  Ni: 0x50d050, Cu: 0xb87333, Zn: 0x7d7faf, Ba: 0x00b877, default: 0x9a9a9a
};

function parseFraction(text) {
  const value = String(text || "").trim();
  if (!value) return 0;
  if (value.includes("/")) {
    const [a, b] = value.split("/").map(Number);
    return Number.isFinite(a) && Number.isFinite(b) && b !== 0 ? a / b : 0;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function parseSymmetryComponent(component) {
  const compact = component.replace(/\s+/g, "").replace(/−/g, "-");
  const normalized = /^[+-]/.test(compact) ? compact : `+${compact}`;
  const terms = normalized.match(/[+-][^+-]+/g) || [];
  const coeff = { x: 0, y: 0, z: 0 };
  let offset = 0;
  for (const term of terms) {
    const sign = term[0] === "-" ? -1 : 1;
    const body = term.slice(1);
    const variable = body.match(/[xyz]/i)?.[0]?.toLowerCase();
    if (variable) {
      const coefficientText = body.replace(/[xyz*]/ig, "");
      coeff[variable] += sign * (coefficientText ? parseFraction(coefficientText) : 1);
    } else offset += sign * parseFraction(body);
  }
  return { coeff, offset };
}

export function parseSymmetryOperation(operation) {
  const parts = String(operation || "x,y,z").replace(/["']/g, "").split(",");
  if (parts.length !== 3) return parseSymmetryOperation("x,y,z");
  return parts.map(parseSymmetryComponent);
}

function applySymmetry(operation, fract) {
  return operation.map(({ coeff, offset }) => coeff.x * fract[0] + coeff.y * fract[1] + coeff.z * fract[2] + offset);
}
function wrap01(value) {
  const wrapped = value - Math.floor(value);
  return Math.abs(wrapped - 1) < 1e-7 ? 0 : wrapped;
}
function fractionalKey(element, fract) {
  return `${element}:${fract.map(v => Math.round(wrap01(v) * 100000)).join(":")}`;
}

export function makeCellVectors(cell) {
  const alpha = cell.alpha * DEG, beta = cell.beta * DEG, gamma = cell.gamma * DEG;
  const ax = [cell.a, 0, 0];
  const bx = [cell.b * Math.cos(gamma), cell.b * Math.sin(gamma), 0];
  const cx = cell.c * Math.cos(beta);
  const cy = cell.c * (Math.cos(alpha) - Math.cos(beta) * Math.cos(gamma)) / Math.max(Math.sin(gamma), 1e-9);
  const czSquared = Math.max(0, cell.c * cell.c - cx * cx - cy * cy);
  return [ax, bx, [cx, cy, Math.sqrt(czSquared)]];
}

export function fracToCartesian(fract, vectors) {
  return [
    fract[0] * vectors[0][0] + fract[1] * vectors[1][0] + fract[2] * vectors[2][0],
    fract[0] * vectors[0][1] + fract[1] * vectors[1][1] + fract[2] * vectors[2][1],
    fract[0] * vectors[0][2] + fract[1] * vectors[1][2] + fract[2] * vectors[2][2]
  ];
}

function expandAsymmetricUnit(atomSites, operations) {
  const parsedOps = operations.map(parseSymmetryOperation);
  const unique = new Map();
  for (const atom of atomSites) for (const operation of parsedOps) {
    const fract = applySymmetry(operation, atom.fract).map(wrap01);
    const key = fractionalKey(atom.element, fract);
    if (!unique.has(key)) unique.set(key, { ...atom, fract });
  }
  return [...unique.values()];
}

export function buildCrystalModel(doc, repeat = 1) {
  const metadata = extractMetadata(doc), cell = extractCell(doc), vectors = makeCellVectors(cell);
  const asymmetricAtoms = extractAtomSites(doc), symmetryOperations = extractSymmetryOperations(doc);
  const unitAtoms = expandAsymmetricUnit(asymmetricAtoms, symmetryOperations), atoms = [];
  for (let i = 0; i < repeat; i += 1) for (let j = 0; j < repeat; j += 1) for (let k = 0; k < repeat; k += 1) {
    for (const atom of unitAtoms) {
      const fract = [atom.fract[0] + i, atom.fract[1] + j, atom.fract[2] + k];
      atoms.push({ ...atom, fract, cart: fracToCartesian(fract, vectors), cellIndex: [i, j, k] });
    }
  }
  return { metadata, cell, vectors, asymmetricAtoms, unitAtoms, symmetryOperations, repeat, atoms };
}

function samePair(rule, a, b) {
  const [x, y] = rule.elements || [];
  return (x === a && y === b) || (x === b && y === a);
}

export function findBondRule(atomA, atomB, rules = []) {
  return rules.find(rule => samePair(rule, atomA.element, atomB.element)) || null;
}

export function inferBonds(atoms, maxBonds = 18000, rules = null) {
  if (atoms.length > 3500) return [];
  const explicitRules = Array.isArray(rules) && rules.length ? rules : null;
  const largestCutoff = explicitRules ? Math.max(...explicitRules.map(rule => Number(rule.maxDistance) || 0), 2.6) : 2.6;
  const cellSize = largestCutoff + 0.05;
  const grid = new Map();
  const keyFor = position => position.map(v => Math.floor(v / cellSize)).join(",");
  atoms.forEach((atom, index) => {
    const key = keyFor(atom.cart);
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push(index);
  });
  const bonds = [], offsets = [-1, 0, 1];
  for (let index = 0; index < atoms.length; index += 1) {
    const atom = atoms[index], base = atom.cart.map(v => Math.floor(v / cellSize));
    for (const dx of offsets) for (const dy of offsets) for (const dz of offsets) {
      const candidates = grid.get(`${base[0] + dx},${base[1] + dy},${base[2] + dz}`) || [];
      for (const otherIndex of candidates) {
        if (otherIndex <= index) continue;
        const other = atoms[otherIndex];
        const distance = Math.hypot(atom.cart[0] - other.cart[0], atom.cart[1] - other.cart[1], atom.cart[2] - other.cart[2]);
        let minDistance = 0.35, maxDistance;
        if (explicitRules) {
          const rule = findBondRule(atom, other, explicitRules);
          if (!rule) continue;
          minDistance = Number(rule.minDistance) || 0.35;
          maxDistance = Number(rule.maxDistance);
        } else maxDistance = ((COVALENT_RADII[atom.element] || 0.9) + (COVALENT_RADII[other.element] || 0.9)) * 1.24;
        if (distance > minDistance && distance <= maxDistance) {
          bonds.push([index, otherIndex, distance]);
          if (bonds.length >= maxBonds) return bonds;
        }
      }
    }
  }
  return bonds;
}
