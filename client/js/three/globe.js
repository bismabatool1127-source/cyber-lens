/**
 * Cyber-Lens security globe — the "lens" that watches the network.
 *
 * Built with Three.js (vendored at /vendor/three.module.min.js, loaded lazily).
 * Degrades gracefully: returns null when WebGL is unavailable so callers can
 * show a CSS fallback; renders a single static frame under prefers-reduced-motion.
 */

const FIB = (i, n, r = 1) => {
  const phi = Math.acos(1 - (2 * (i + 0.5)) / n);
  const theta = Math.PI * (1 + Math.sqrt(5)) * i;
  return [Math.sin(phi) * Math.cos(theta) * r, Math.cos(phi) * r, Math.sin(phi) * Math.sin(theta) * r];
};

export async function createGlobe(canvas) {
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;

  let THREE;
  try {
    THREE = await import('/vendor/three.module.min.js');
  } catch {
    return null;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch {
    return null;
  }

  const isSmall = window.innerWidth < 720;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isSmall ? 1.5 : 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0.18, 3.15);

  const globe = new THREE.Group();
  scene.add(globe);

  /* ---- occluding core ---- */
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.995, 48, 48),
    new THREE.MeshBasicMaterial({ color: 0x081120, transparent: true, opacity: 0.94 })
  );
  globe.add(core);

  /* ---- latitude / longitude grid ---- */
  const gridVerts = [];
  const SEG = 72;
  for (const latDeg of [-60, -30, 0, 30, 60]) {
    const lat = (latDeg * Math.PI) / 180;
    const r = Math.cos(lat);
    const y = Math.sin(lat);
    for (let i = 0; i < SEG; i++) {
      const a = (i / SEG) * Math.PI * 2;
      const b = ((i + 1) / SEG) * Math.PI * 2;
      gridVerts.push(Math.cos(a) * r, y, Math.sin(a) * r, Math.cos(b) * r, y, Math.sin(b) * r);
    }
  }
  for (let m = 0; m < 6; m++) {
    const rot = (m / 6) * Math.PI;
    for (let i = 0; i < SEG; i++) {
      const a = (i / SEG) * Math.PI * 2;
      const b = ((i + 1) / SEG) * Math.PI * 2;
      const pa = [Math.cos(a), Math.sin(a)];
      const pb = [Math.cos(b), Math.sin(b)];
      gridVerts.push(pa[0] * Math.cos(rot), pa[1], pa[0] * Math.sin(rot), pb[0] * Math.cos(rot), pb[1], pb[0] * Math.sin(rot));
    }
  }
  const gridGeo = new THREE.BufferGeometry();
  gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(gridVerts, 3));
  const gridBase = new THREE.Color(0x38bdf8);
  const gridMat = new THREE.LineBasicMaterial({ color: gridBase.clone(), transparent: true, opacity: 0.17 });
  globe.add(new THREE.LineSegments(gridGeo, gridMat));

  /* ---- observation nodes ---- */
  const NODE_COUNT = isSmall ? 110 : 170;
  const nodeVerts = [];
  for (let i = 0; i < NODE_COUNT; i++) nodeVerts.push(...FIB(i, NODE_COUNT, 1.005));
  const nodeGeo = new THREE.BufferGeometry();
  nodeGeo.setAttribute('position', new THREE.Float32BufferAttribute(nodeVerts, 3));
  const nodeBase = new THREE.Color(0x7dd3fc);
  const nodeMat = new THREE.PointsMaterial({
    color: nodeBase.clone(),
    size: 0.021,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  globe.add(new THREE.Points(nodeGeo, nodeMat));

  /* ---- threat indicators ---- */
  const THREAT_COUNT = 9;
  const threatVerts = [];
  for (let i = 0; i < THREAT_COUNT; i++) threatVerts.push(...FIB(i * 19 + 7, NODE_COUNT, 1.008));
  const threatGeo = new THREE.BufferGeometry();
  threatGeo.setAttribute('position', new THREE.Float32BufferAttribute(threatVerts, 3));
  const threatMat = new THREE.PointsMaterial({
    color: 0xfb7185,
    size: 0.032,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  globe.add(new THREE.Points(threatGeo, threatMat));

  /* ---- data-stream arcs + travelling pulses ---- */
  const curves = [];
  for (let i = 0; i < 7; i++) {
    const a = new THREE.Vector3(...FIB(i * 23 + 3, NODE_COUNT, 1));
    const b = new THREE.Vector3(...FIB(i * 31 + 41, NODE_COUNT, 1));
    const mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(1 + a.distanceTo(b) * 0.32);
    curves.push(new THREE.QuadraticBezierCurve3(a, mid, b));
  }
  const arcGroup = new THREE.Group();
  for (const curve of curves) {
    const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(42));
    arcGroup.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.2 })));
  }
  globe.add(arcGroup);

  const pulseGeo = new THREE.BufferGeometry();
  pulseGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(curves.length * 3), 3));
  const pulseMat = new THREE.PointsMaterial({
    color: 0xa5f3fc,
    size: 0.045,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  globe.add(new THREE.Points(pulseGeo, pulseMat));
  const pulseT = curves.map((_, i) => i / curves.length);

  /* ---- lens rings ---- */
  const ringMatA = new THREE.MeshBasicMaterial({
    color: 0x22d3ee,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const ringA = new THREE.Mesh(new THREE.RingGeometry(1.34, 1.352, 96), ringMatA);
  ringA.rotation.x = Math.PI / 2.25;
  scene.add(ringA);

  const ringB = new THREE.Mesh(
    new THREE.RingGeometry(1.58, 1.588, 96),
    new THREE.MeshBasicMaterial({
      color: 0x818cf8,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  ringB.rotation.x = Math.PI / 1.85;
  ringB.rotation.y = 0.4;
  scene.add(ringB);

  /* ---- ambient star field ---- */
  const starVerts = [];
  for (let i = 0; i < (isSmall ? 160 : 300); i++) {
    const v = new THREE.Vector3(...FIB(i, 300, 14 + (i % 9)));
    starVerts.push(v.x, v.y, v.z);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3));
  scene.add(
    new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: 0x94a3b8, size: 0.045, transparent: true, opacity: 0.5, depthWrite: false })
    )
  );

  /* ---- state ---- */
  let speed = 1;
  let targetSpeed = 1;
  let scanning = false;
  let flashColor = null;
  let flashUntil = 0;
  let disposed = false;
  let rafId = null;
  let visible = true;

  const resize = () => {
    const w = canvas.clientWidth || canvas.parentElement?.clientWidth || 300;
    const h = canvas.clientHeight || 300;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (reducedMotion) renderer.render(scene, camera);
  };
  resize();
  const ro = new ResizeObserver(resize);
  if (canvas.parentElement) ro.observe(canvas.parentElement);

  /* drag to explore */
  let dragging = false;
  let lastX = 0;
  let dragVel = 0;
  const onDown = (e) => {
    dragging = true;
    lastX = e.clientX;
    canvas.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    globe.rotation.y += dx * 0.005;
    dragVel = dx * 0.005;
  };
  const onUp = () => {
    dragging = false;
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);

  /* pause when off-screen or tab hidden */
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
  });
  io.observe(canvas);

  const clock = new THREE.Clock();

  function frame() {
    if (disposed) return;
    rafId = requestAnimationFrame(frame);
    if (!visible || document.hidden) return;

    const t = clock.getElapsedTime();
    const dt = Math.min(clock.getDelta() + 0.016, 0.05);

    speed += (targetSpeed - speed) * 0.04;
    if (!dragging) {
      globe.rotation.y += 0.0018 * speed + dragVel;
      dragVel *= 0.94;
    }
    ringA.rotation.z += 0.0012 * speed;
    ringB.rotation.z -= 0.0008 * speed;

    threatMat.opacity = scanning ? 0.55 + Math.sin(t * 9) * 0.4 : 0.62 + Math.sin(t * 2.2) * 0.28;
    gridMat.opacity = scanning ? 0.3 : 0.17;

    const pos = pulseGeo.attributes.position;
    for (let i = 0; i < curves.length; i++) {
      pulseT[i] = (pulseT[i] + dt * 0.16 * speed) % 1;
      const p = curves[i].getPoint(pulseT[i]);
      pos.setXYZ(i, p.x, p.y, p.z);
    }
    pos.needsUpdate = true;

    const now = performance.now();
    const flashK = flashColor && now < flashUntil ? (flashUntil - now) / 1400 : 0;
    gridMat.color.copy(gridBase).lerp(flashColor || gridBase, flashK);
    nodeMat.color.copy(nodeBase).lerp(flashColor || nodeBase, flashK * 0.8);

    camera.position.x = Math.sin(t * 0.12) * 0.06;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  if (reducedMotion) {
    renderer.render(scene, camera);
  } else {
    rafId = requestAnimationFrame(frame);
  }

  return {
    setScanning(on) {
      scanning = on;
      targetSpeed = on ? 3.2 : 1;
    },
    flash(level) {
      flashColor = new THREE.Color(level === 'LOW' ? 0x34d399 : level === 'HIGH' ? 0xfb7185 : 0xfbbf24);
      flashUntil = performance.now() + 1400;
      if (reducedMotion) renderer.render(scene, camera);
    },
    destroy() {
      disposed = true;
      if (rafId) cancelAnimationFrame(rafId);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      scene.traverse((obj) => {
        obj.geometry?.dispose?.();
        if (obj.material) {
          (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach((m) => m.dispose?.());
        }
      });
      renderer.dispose();
    },
  };
}
