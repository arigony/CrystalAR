export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function computeHandPose(hand, options = {}) {
  if (!Array.isArray(hand) || hand.length < 18) throw new Error("Landmarks de mão incompletos.");

  const isMobile = Boolean(options.isMobile);
  const baseScale = Number.isFinite(options.baseScale) ? options.baseScale : 0.8;
  let pinchScaleFactor = Number.isFinite(options.pinchScaleFactor) ? options.pinchScaleFactor : 1;
  let lastPinchDistance = Number.isFinite(options.lastPinchDistance) ? options.lastPinchDistance : null;

  const wrist = hand[0];
  const thumbTip = hand[4];
  const indexTip = hand[8];
  const indexBase = hand[5];
  const middleBase = hand[9];
  const pinkyBase = hand[17];

  const points = [wrist, thumbTip, indexTip, indexBase, middleBase, pinkyBase];
  if (points.some(point => !Number.isFinite(point?.x) || !Number.isFinite(point?.y))) {
    throw new Error("Landmarks de mão inválidos.");
  }

  const cx = (wrist.x + indexBase.x + middleBase.x + pinkyBase.x) / 4;
  const cy = (wrist.y + indexBase.y + middleBase.y + pinkyBase.y) / 4;
  const acrossX = indexBase.x - pinkyBase.x;
  const acrossY = indexBase.y - pinkyBase.y;
  const verticalY = middleBase.y - wrist.y;

  const angleZ = Math.atan2(acrossY, acrossX);
  const angleY = (0.5 - cx) * Math.PI * (isMobile ? 1.35 : 1.7);
  const angleX = (cy - 0.5) * Math.PI * (isMobile ? 0.85 : 1.1) + verticalY * 1.1;

  const palm = Math.max(0.001, Math.hypot(middleBase.x - wrist.x, middleBase.y - wrist.y));
  const pinchDistance = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
  const pinchRatio = clamp(pinchDistance / palm, 0.20, 1.90);

  if (lastPinchDistance === null) lastPinchDistance = pinchRatio;
  const delta = pinchRatio - lastPinchDistance;
  pinchScaleFactor = clamp(pinchScaleFactor + delta * 0.70, 0.62, 1.55);
  lastPinchDistance = lastPinchDistance * 0.72 + pinchRatio * 0.28;

  return {
    angleX,
    angleY,
    angleZ: -angleZ,
    scale: clamp(baseScale * pinchScaleFactor, baseScale * 0.62, baseScale * 1.55),
    pinchScaleFactor,
    lastPinchDistance,
    isPinching: pinchRatio < 0.62,
    pinchRatio
  };
}
