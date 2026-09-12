import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import type { Rocket } from "./catalog";

export const materials = {
  steel: new T.MeshStandardMaterial({
    color: "#b5bcc0",
    metalness: 0.85,
    roughness: 0.25,
  }),
  black: new T.MeshStandardMaterial({ color: "#191d21", roughness: 0.55 }),
  red: new T.MeshStandardMaterial({ color: "#e33925", roughness: 0.37 }),
  yellow: new T.MeshStandardMaterial({ color: "#f2c126", roughness: 0.44 }),
};
export function mesh(
  geo: T.BufferGeometry,
  mat: T.Material,
  parent: T.Object3D,
  x = 0,
  y = 0,
  z = 0,
) {
  const m = new T.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
export function cylinder(
  parent: T.Object3D,
  r1: number,
  r2: number,
  h: number,
  y: number,
  mat: T.Material,
  x = 0,
  z = 0,
) {
  return mesh(new T.CylinderGeometry(r1, r2, h, 48), mat, parent, x, y, z);
}
export function beam(
  parent: T.Object3D,
  a: T.Vector3,
  b: T.Vector3,
  r: number,
  mat: T.Material,
) {
  const d = b.clone().sub(a);
  const m = mesh(new T.CylinderGeometry(r, r, d.length(), 8), mat, parent);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize());
  return m;
}
function labelTexture(r: Rocket) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 2048;
  const x = c.getContext("2d")!;
  x.fillStyle = r.color;
  x.fillRect(0, 0, 1024, 2048);
  x.fillStyle = r.accent;
  if (r.id === "bullpup") {
    x.fillStyle = "#26303a";
    x.fillRect(0, 1000, 1024, 20);
    x.fillRect(0, 1500, 1024, 20);
  }
  if (r.id === "nova") {
    x.fillRect(0, 1200, 1024, 600);
  }
  if (r.id === "superbertha") {
    for (let i = 0; i < 8; i++) x.fillRect(i * 128, 1450, 64, 500);
  }
  if (r.id === "bertha" || r.id === "alpha") {
    x.fillRect(0, 1530, 1024, 80);
    x.fillRect(0, 1650, 1024, 34);
  }
  if (r.id === "max") {
    x.fillStyle = "#e6ded4";
    x.font = "bold 180px Arial";
    x.textAlign = "center";
    x.fillText("✚", 512, 600);
    x.fillStyle = r.accent;
  }
  if (r.id === "patriot") {
    x.fillRect(0, 0, 1024, 150);
    x.fillRect(0, 1650, 1024, 280);
  }
  if (r.id === "baby" || r.id === "executioner") {
    x.fillRect(0, 1200, 1024, 370);
  }
  if (r.id === "mean") {
    for (let i = 0; i < 8; i++) x.fillRect(i * 128, 1320, 64, 160);
  }
  if (r.shape === "redstone" || r.shape === "saturn") {
    for (let i = 0; i < 8; i++) {
      x.fillRect(i * 128, 0, 64, 260);
      x.fillRect(i * 128, 1450, 64, 330);
    }
  }
  if (r.shape === "falcon") {
    x.fillRect(0, 480, 1024, 140);
    x.fillStyle = "#202e3c";
  }
  x.save();
  x.translate(540, 980);
  x.rotate(-Math.PI / 2);
  x.textAlign = "center";
  x.font = `700 ${r.id === "mean" ? 76 : 92}px Arial`;
  x.fillText(
    r.shape === "redstone" || r.shape === "atlas"
      ? "UNITED STATES"
      : r.shape === "falcon"
        ? "SPACEX"
        : r.name.toUpperCase(),
    0,
    0,
  );
  x.restore();
  if (r.family === "Estes classics") {
    x.font = "bold 42px Arial";
    x.textAlign = "center";
    x.fillText("ESTES", 512, 1850);
  }
  const map = new T.CanvasTexture(c);
  map.colorSpace = T.SRGBColorSpace;
  map.anisotropy = 8;
  return map;
}
function nose(
  parent: T.Object3D,
  radius: number,
  length: number,
  mat: T.Material,
  profile = "ogive",
) {
  const pts: T.Vector2[] = [];
  for (let i = 0; i <= 32; i++) {
    const t = i / 32;
    const rad =
      profile === "round"
        ? Math.cos((t * Math.PI) / 2)
        : Math.pow(1 - t * t, 0.68);
    pts.push(new T.Vector2(Math.max(0.0001, radius * rad), t * length));
  }
  return mesh(new T.LatheGeometry(pts, 48), mat, parent);
}
function finGeometry(r: Rocket) {
  const rad = r.diameter / 2,
    shape = new T.Shape();
  shape.moveTo(rad * 0.8, 0.012);
  shape.lineTo(rad + r.finSpan, 0);
  shape.lineTo(rad + r.finSpan * 0.85, r.finHeight * 0.43);
  shape.lineTo(rad, r.finHeight);
  shape.closePath();
  return new T.ExtrudeGeometry(shape, {
    depth: Math.min(0.002, r.diameter * 0.04),
    bevelEnabled: true,
    bevelSize: 0.0005,
    bevelThickness: 0.0005,
    bevelSegments: 1,
    steps: 1,
  });
}
function transparentFins() {
  return new T.MeshStandardMaterial({
    color: "#d1e5e1",
    transparent: true,
    opacity: 0.28,
    roughness: 0.18,
    metalness: 0.1,
    side: T.DoubleSide,
    depthWrite: false,
  });
}
export function createRocket(r: Rocket) {
  const root = new T.Group(),
    body = new T.Group(),
    cap = new T.Group();
  root.add(body, cap);
  root.userData = { cap, body, rocket: r };
  const rad = r.diameter / 2,
    nh = r.length * r.noseRatio,
    bh = r.length - nh;
  const painted = new T.MeshStandardMaterial({
    map: labelTexture(r),
    roughness: 0.36,
    metalness: r.shape === "atlas" ? 0.72 : 0.05,
  });
  const accent = new T.MeshStandardMaterial({
    color: r.accent,
    roughness: 0.34,
  });
  const noseMat = new T.MeshStandardMaterial({
    color: r.nose,
    roughness: 0.28,
    metalness: 0.08,
  });
  cylinder(body, rad, rad, bh, bh / 2, painted);
  cylinder(body, rad * 1.005, rad * 1.005, 0.003, 0.007, materials.steel);
  cylinder(body, rad * 0.44, rad * 0.5, 0.018, -0.005, materials.black);
  cap.position.y = bh;
  if (r.shape === "saturn") {
    nose(cap, rad, nh * 0.35, noseMat);
    cylinder(cap, rad * 0.38, rad * 0.6, nh * 0.35, nh * 0.35, noseMat);
    nose(cap, rad * 0.38, nh * 0.4, noseMat).position.y = nh * 0.52;
    cylinder(cap, 0.001, 0.002, nh * 0.24, nh * 0.96, materials.steel);
    for (const h of [0.3, 0.53, 0.72])
      cylinder(body, rad * 1.015, rad * 1.015, 0.014, bh * h, accent);
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI) / 2;
      const d = i === 4 ? 0 : rad * 0.55;
      cylinder(
        body,
        rad * 0.12,
        rad * 0.2,
        0.035,
        -0.02,
        materials.steel,
        Math.cos(a) * d,
        Math.sin(a) * d,
      );
    }
  } else if (r.shape === "redstone" || r.shape === "atlas") {
    cylinder(
      cap,
      rad * 0.4,
      rad,
      r.shape === "atlas" ? nh * 0.28 : 0.008,
      r.shape === "atlas" ? nh * 0.14 : 0,
      materials.steel,
    );
    const base = r.shape === "atlas" ? nh * 0.28 : 0;
    cylinder(
      cap,
      rad * 0.14,
      rad * 0.45,
      nh * 0.33,
      base + nh * 0.165,
      materials.black,
    );
    const towerY = base + nh * 0.33;
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      beam(
        cap,
        new T.Vector3(
          Math.cos(a) * rad * 0.17,
          towerY,
          Math.sin(a) * rad * 0.17,
        ),
        new T.Vector3(
          Math.cos(a) * rad * 0.06,
          nh * 0.9,
          Math.sin(a) * rad * 0.06,
        ),
        0.0013,
        materials.red,
      );
    }
    cylinder(cap, 0.003, 0.003, nh * 0.25, nh * 0.88, materials.red);
    nose(cap, 0.003, nh * 0.06, materials.red).position.y = nh;
  } else {
    nose(
      cap,
      rad * (r.shape === "falcon" ? 1.25 : 1),
      nh,
      noseMat,
      r.id === "bertha" ? "round" : "ogive",
    );
  }
  const finGeo = finGeometry(r);
  const finMaterial = ["saturn", "falcon", "atlas"].includes(r.shape ?? "")
    ? transparentFins()
    : accent;
  for (let i = 0; i < r.fins; i++) {
    const f = mesh(finGeo, finMaterial, body);
    f.rotation.y = (i * Math.PI * 2) / r.fins;
  }
  if (r.id === "bullpup" || r.id === "nova") {
    for (let i = 0; i < 4; i++) {
      const canard = mesh(finGeo, accent, body, 0, bh * 0.66, 0);
      canard.scale.set(0.52, 0.42, 0.8);
      canard.rotation.y = (i * Math.PI) / 2;
    }
  }
  // Launch lug, motor hook and Falcon landing-leg fairings.
  cylinder(body, 0.003, 0.003, 0.025, bh * 0.35, painted, rad + 0.002);
  if (r.shape === "falcon") {
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      beam(
        body,
        new T.Vector3(Math.cos(a) * rad, bh * 0.19, Math.sin(a) * rad),
        new T.Vector3(Math.cos(a) * rad * 1.3, 0.025, Math.sin(a) * rad * 1.3),
        0.005,
        accent,
      );
    }
  }
  root.traverse((o) => {
    o.castShadow = true;
    o.receiveShadow = true;
  });
  return root;
}
export const MODEL_PATHS: Record<string, string> = {
  falcon: "/models/falcon-9.glb",
  saturn: "/models/saturn-v.glb",
  redstone: "/models/mercury-redstone.glb",
  atlas: "/models/mercury-atlas.glb",
};
const cache = new Map<string, Promise<T.Group>>();
export async function loadRocketAsset(r: Rocket): Promise<T.Group | null> {
  const path = MODEL_PATHS[r.id];
  if (!path) return null;
  if (!cache.has(path))
    cache.set(
      path,
      new GLTFLoader()
        .loadAsync(path)
        .then((g) => {
          const model = g.scene;
          model.updateMatrixWorld(true);
          let b = new T.Box3().setFromObject(model),
            s = b.getSize(new T.Vector3());
          // Source assets use different up axes; normalize the longest axis to Y.
          if (s.z > s.y && s.z > s.x) model.rotation.x = -Math.PI / 2;
          else if (s.x > s.y) model.rotation.z = Math.PI / 2;
          model.updateMatrixWorld(true);
          b = new T.Box3().setFromObject(model);
          s = b.getSize(new T.Vector3());
          const targetHeight =
            r.shape === "redstone" || r.shape === "atlas"
              ? r.length * r.noseRatio * 0.33
              : r.length;
          model.scale.multiplyScalar(targetHeight / s.y);
          model.updateMatrixWorld(true);
          b = new T.Box3().setFromObject(model);
          const center = b.getCenter(new T.Vector3());
          model.position.sub(new T.Vector3(center.x, b.min.y, center.z));
          const wrapper = new T.Group();
          wrapper.add(model);
          wrapper.traverse((o) => {
            if (o instanceof T.Mesh) {
              o.castShadow = true;
              o.receiveShadow = true;
            }
          });
          return wrapper;
        })
        .catch((e) => {
          cache.delete(path);
          throw e;
        }),
    );
  const loaded = (await cache.get(path)!).clone(true);
  if (r.shape === "redstone" || r.shape === "atlas") {
    const complete = createRocket(r);
    const cap = complete.userData.cap as T.Group;
    const existingCapsule = cap.children[1];
    if (existingCapsule) cap.remove(existingCapsule);
    loaded.position.y = r.shape === "atlas" ? r.length * r.noseRatio * 0.28 : 0;
    cap.add(loaded);
    return complete;
  }
  if (r.shape === "falcon") {
    // The reusable STL has no paint: add a white-and-black model-scale livery.
    loaded.updateMatrixWorld(true);
    loaded.traverse((o) => {
      if (o instanceof T.Mesh) {
        const geo = o.geometry.clone();
        const pos = geo.attributes.position;
        const colors = new Float32Array(pos.count * 3);
        const v = new T.Vector3(),
          c = new T.Color();
        for (let i = 0; i < pos.count; i++) {
          v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
          const y = v.y / r.length;
          const black = y < 0.06 || (y > 0.68 && y < 0.735);
          c.set(black ? "#20242a" : "#eeeae0");
          colors.set([c.r, c.g, c.b], i * 3);
        }
        geo.setAttribute("color", new T.BufferAttribute(colors, 3));
        o.geometry = geo;
        o.material = new T.MeshStandardMaterial({
          vertexColors: true,
          roughness: 0.35,
          metalness: 0.12,
        });
      }
    });
  }
  if (r.shape === "falcon" || r.shape === "saturn") {
    const geo = finGeometry(r),
      mat = transparentFins();
    for (let i = 0; i < r.fins; i++) {
      const fin = mesh(geo, mat, loaded);
      fin.rotation.y = (i * Math.PI * 2) / r.fins;
    }
  }
  loaded.userData = { imported: true, rocket: r };
  return loaded;
}
export function createPad(large = false) {
  const g = new T.Group(),
    mat = large ? materials.black : materials.red;
  cylinder(g, 0.056, 0.075, 0.075, 0.07, mat);
  for (let i = 0; i < 3; i++) {
    const leg = new T.Group();
    leg.rotation.y = (i * 2 * Math.PI) / 3;
    g.add(leg);
    const shape = new T.Shape();
    shape.moveTo(0.02, 0.09);
    shape.lineTo(0.34, 0.023);
    shape.lineTo(0.34, 0);
    shape.lineTo(0.24, 0);
    shape.lineTo(0.035, 0.045);
    shape.closePath();
    mesh(
      new T.ExtrudeGeometry(shape, {
        depth: 0.026,
        bevelEnabled: true,
        bevelThickness: 0.005,
        bevelSize: 0.005,
        bevelSegments: 2,
      }),
      mat,
      leg,
      0,
      0,
      -0.013,
    );
  }
  const plate = cylinder(g, 0.093, 0.093, 0.003, 0.15, materials.steel);
  plate.rotation.z = 0.06;
  const rod = new T.Group();
  rod.position.set(0.043, 0.13, 0);
  g.add(rod);
  cylinder(rod, 0.002, 0.002, 1.0, 0.5, materials.steel);
  g.userData.rod = rod;
  cylinder(g, 0.011, 0.011, 0.012, 0.13, materials.black, 0.043);
  if (large) g.scale.setScalar(1.2);
  return g;
}
export function createController() {
  const g = new T.Group();
  const box = mesh(
    new T.BoxGeometry(0.18, 0.055, 0.11),
    materials.yellow,
    g,
    0,
    0.04,
    0,
  );
  const face = mesh(
    new T.BoxGeometry(0.166, 0.002, 0.098),
    materials.black,
    g,
    0,
    0.069,
    0,
  );
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#232829";
  ctx.fillRect(0, 0, 512, 256);
  ctx.fillStyle = "#e8d17f";
  ctx.font = "bold 39px Arial";
  ctx.fillText("ESTES", 20, 48);
  ctx.font = "19px Arial";
  ctx.fillText("ELECTRON BEAM", 20, 82);
  ctx.font = "15px Arial";
  ctx.fillText("CONTINUITY", 20, 227);
  ctx.fillText("LAUNCH", 332, 227);
  const texture = new T.CanvasTexture(c);
  texture.colorSpace = T.SRGBColorSpace;
  const plaque = mesh(
    new T.PlaneGeometry(0.165, 0.097),
    new T.MeshStandardMaterial({ map: texture, roughness: 0.5 }),
    g,
    0,
    0.071,
    0,
  );
  plaque.rotation.x = -Math.PI / 2;
  face.userData.label = "Electron Beam";
  box.userData.label = "Estes-inspired recreation";
  cylinder(g, 0.016, 0.017, 0.014, 0.081, materials.red, 0.045, 0.015);
  cylinder(
    g,
    0.007,
    0.007,
    0.007,
    0.074,
    new T.MeshStandardMaterial({
      color: "#daef9a",
      emissive: "#58802b",
      emissiveIntensity: 0.5,
    }),
    -0.042,
    -0.02,
  );
  cylinder(g, 0.008, 0.008, 0.009, 0.076, materials.steel, -0.04, 0.016);
  beam(
    g,
    new T.Vector3(-0.04, 0.08, 0.016),
    new T.Vector3(-0.04, 0.108, 0.016),
    0.002,
    materials.steel,
  );
  mesh(
    new T.TorusGeometry(0.011, 0.002, 6, 20),
    materials.steel,
    g,
    -0.04,
    0.112,
    0.016,
  ).rotation.x = Math.PI / 2;
  return g;
}
export function createChute(r: Rocket) {
  const g = new T.Group(),
    radius = r.chute / 2;
  const geo = new T.SphereGeometry(
    radius,
    48,
    20,
    0,
    Math.PI * 2,
    0,
    Math.PI * 0.44,
  );
  geo.scale(1, 0.5, 1);
  const orange = new T.MeshStandardMaterial({
    color: "#ff6b25",
    side: T.DoubleSide,
    roughness: 0.8,
    transparent: true,
    opacity: 0.92,
  });
  const white = new T.MeshStandardMaterial({
    color: "#fff4dd",
    side: T.DoubleSide,
    roughness: 0.8,
    transparent: true,
    opacity: 0.92,
  });
  const idx = geo.index!;
  const groups: number[][] = [[], []];
  for (let i = 0; i < idx.count; i += 3) {
    const u = geo.attributes.uv.getX(idx.getX(i));
    groups[Math.min(1, Math.floor(u * 12) % 2)].push(
      idx.getX(i),
      idx.getX(i + 1),
      idx.getX(i + 2),
    );
  }
  geo.setIndex(groups.flat());
  geo.clearGroups();
  geo.addGroup(0, groups[0].length, 0);
  geo.addGroup(groups[0].length, groups[1].length, 1);
  mesh(geo, [orange, white] as unknown as T.Material, g, 0, radius * 1.5, 0);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    beam(
      g,
      new T.Vector3(0, 0, 0),
      new T.Vector3(
        Math.cos(a) * radius * 0.98,
        radius * 1.58,
        Math.sin(a) * radius * 0.98,
      ),
      0.0006,
      new T.MeshBasicMaterial({ color: "#eee4d5" }),
    );
  }
  return g;
}
export function disposeObject(obj: T.Object3D) {
  obj.traverse((o) => {
    if (o instanceof T.Mesh) {
      o.geometry.dispose();
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        if (m.map) m.map.dispose();
        m.dispose();
      }
    }
  });
}
export async function makeThumbnails(
  rockets: Rocket[],
  onImage: (id: string, url: string) => void,
) {
  const renderer = new T.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
  });
  renderer.setSize(180, 260);
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  const scene = new T.Scene();
  scene.add(new T.HemisphereLight("#eaf5ff", "#69707b", 2.5));
  const sun = new T.DirectionalLight("#fff4da", 4);
  sun.position.set(3, 5, 6);
  scene.add(sun);
  const cam = new T.PerspectiveCamera(28, 180 / 260, 0.001, 100);
  for (const r of rockets) {
    let obj: T.Group;
    try {
      obj = (await loadRocketAsset(r)) || createRocket(r);
    } catch {
      obj = createRocket(r);
    }
    scene.add(obj);
    obj.rotation.z = -0.17;
    obj.rotation.y = 0.55;
    const h = r.length,
      dist = h * 2.5;
    cam.position.set(dist * 0.15, h * 0.53, dist);
    cam.lookAt(0, h * 0.47, 0);
    renderer.render(scene, cam);
    onImage(r.id, renderer.domElement.toDataURL("image/png"));
    scene.remove(obj);
  }
  renderer.dispose();
  renderer.forceContextLoss();
}
