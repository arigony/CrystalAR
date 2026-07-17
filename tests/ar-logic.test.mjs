import test from "node:test";
import assert from "node:assert/strict";
import { computeHandPose } from "../src/ar-logic.js";

function hand(pinch = 0.25) {
  const points = Array.from({ length: 21 }, () => ({ x: .5, y: .5, z: 0 }));
  points[0] = { x: .5, y: .78, z: 0 };
  points[5] = { x: .62, y: .55, z: 0 };
  points[9] = { x: .5, y: .48, z: 0 };
  points[17] = { x: .38, y: .55, z: 0 };
  points[4] = { x: .48, y: .35, z: 0 };
  points[8] = { x: .48 + pinch, y: .35, z: 0 };
  return points;
}

test("pose da mão gera ângulos e escala finitos", () => {
  const result = computeHandPose(hand(.16), { baseScale: .8, isMobile: false });
  for (const key of ["angleX", "angleY", "angleZ", "scale", "pinchRatio"]) assert.equal(Number.isFinite(result[key]), true);
  assert.ok(result.scale >= .8 * .62 && result.scale <= .8 * 1.55);
});

test("pinça mantém escala dentro dos limites", () => {
  const first = computeHandPose(hand(.35), { baseScale: .7, pinchScaleFactor: 1 });
  const second = computeHandPose(hand(.08), {
    baseScale: .7,
    pinchScaleFactor: first.pinchScaleFactor,
    lastPinchDistance: first.lastPinchDistance
  });
  assert.ok(second.scale >= .7 * .62 && second.scale <= .7 * 1.55);
});
