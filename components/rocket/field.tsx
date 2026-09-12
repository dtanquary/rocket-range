"use client";
import { useEffect, useRef } from "react";
import * as T from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { buildEnvironment } from "@/lib/rocket/environment";
import {
  createRocket,
  createPad,
  createChute,
  loadRocketAsset,
  makeThumbnails,
  mesh,
  materials,
} from "@/lib/rocket/models";
import { ROCKETS, type Rocket, type Motor } from "@/lib/rocket/catalog";
import {
  newFlight,
  stepFlight,
  type FlightState,
  type Conditions,
} from "@/lib/rocket/physics";
export type Stage =
  "rocket" | "engine" | "pad" | "armed" | "countdown" | "flight" | "landed";
export type CameraMode = "orbit" | "follow" | "ground" | "onboard";
export type FieldProps = {
  rocket: Rocket;
  motor: Motor;
  conditions: Conditions;
  stage: Stage;
  camera: CameraMode;
  trail: boolean;
  onTelemetry: (s: FlightState) => void;
  onLand: () => void;
  onReady: () => void;
  onError: (message: string) => void;
  onThumbnail: (id: string, url: string) => void;
};
export default function Field(props: FieldProps) {
  const host = useRef<HTMLDivElement>(null),
    latest = useRef(props);
  latest.current = props;
  useEffect(() => {
    const el = host.current!;
    let renderer: T.WebGLRenderer;
    try {
      renderer = new T.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      latest.current.onError(
        "The 3D field needs WebGL. Enable hardware acceleration in your browser, then reload.",
      );
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.localClippingEnabled = true;
    renderer.debug.onShaderError = () =>
      latest.current.onError(
        "Your graphics driver could not render the field. Try a current browser with hardware acceleration enabled.",
      );
    el.appendChild(renderer.domElement);
    const scene = new T.Scene();
    const environment = buildEnvironment(scene);
    const camera = new T.PerspectiveCamera(44, 1, 0.01, 12000);
    camera.position.set(2.1, 1.25, 3.3);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.target.set(0.45, 0.6, 0);
    controls.minDistance = 0.45;
    controls.maxDistance = 1200;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.enablePan = false;
    const rocketRoot = new T.Group();
    scene.add(rocketRoot);
    let rocketVisual: T.Group | null = null,
      chute: T.Group | null = null,
      pad: T.Group | null = null,
      activeId = "",
      lastStage: Stage = "rocket",
      lastCamera: CameraMode = "orbit",
      flight = newFlight(),
      frame = 0,
      disposed = false,
      loadId = 0;
    const retired: T.Object3D[] = [];
    let importedCap: T.Group | null = null;
    const lowerPlane = new T.Plane(),
      upperPlane = new T.Plane();
    let capCut = 0.8;
    const lowerLocal = new T.Plane(),
      upperLocal = new T.Plane();
    const engine = mesh(
      new T.CylinderGeometry(0.009, 0.009, 0.07, 28),
      new T.MeshStandardMaterial({ color: "#b79a69", roughness: 0.9 }),
      rocketRoot,
      0,
      -0.025,
      0,
    );
    const fire = new T.Group();
    rocketRoot.add(fire);
    const flame = mesh(
      new T.ConeGeometry(0.017, 0.18, 16),
      new T.MeshBasicMaterial({
        color: "#fff2b0",
        transparent: true,
        opacity: 0.9,
      }),
      fire,
      0,
      -0.08,
      0,
    );
    flame.rotation.z = Math.PI;
    const outer = mesh(
      new T.ConeGeometry(0.03, 0.26, 16),
      new T.MeshBasicMaterial({
        color: "#ff8929",
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      }),
      fire,
      0,
      -0.11,
      0,
    );
    outer.rotation.z = Math.PI;
    fire.visible = false;
    const glow = new T.PointLight("#ff952b", 0, 4);
    fire.add(glow);
    // Pooled smoke particles: fixed capacity for long recovery flights.
    const count = 400,
      pPos = new Float32Array(count * 3),
      pSize = new Float32Array(count),
      pAlpha = new Float32Array(count),
      pAge = new Float32Array(count);
    pAge.fill(100);
    const pVel = new Float32Array(count * 3);
    let particleCursor = 0;
    const smokeGeo = new T.BufferGeometry();
    smokeGeo.setAttribute("position", new T.BufferAttribute(pPos, 3));
    smokeGeo.setAttribute("size", new T.BufferAttribute(pSize, 1));
    smokeGeo.setAttribute("alpha", new T.BufferAttribute(pAlpha, 1));
    const smokeMat = new T.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { pixelRatio: { value: renderer.getPixelRatio() } },
      vertexShader:
        "attribute float size; attribute float alpha; varying float vAlpha; uniform float pixelRatio; void main(){vAlpha=alpha; vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=min(180.,size*700.*pixelRatio/max(1.,-mv.z));}",
      fragmentShader:
        "varying float vAlpha;void main(){float d=length(gl_PointCoord-.5)*2.;float a=pow(max(0.,1.-d),1.8)*vAlpha;gl_FragColor=vec4(.9,.89,.84,a);}",
    });
    const smoke = new T.Points(smokeGeo, smokeMat);
    smoke.frustumCulled = false;
    scene.add(smoke);
    const trailGeo = new T.BufferGeometry();
    const trailPositions = new Float32Array(9000 * 3);
    trailGeo.setAttribute("position", new T.BufferAttribute(trailPositions, 3));
    trailGeo.setDrawRange(0, 0);
    const trailLine = new T.Line(
      trailGeo,
      new T.LineBasicMaterial({
        color: "#f9e6ad",
        transparent: true,
        opacity: 0.45,
      }),
    );
    scene.add(trailLine);
    let trailCount = 0,
      trailTime = 0;
    const resize = () => {
      const w = el.clientWidth,
        h = el.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();
    let accumulator = 0,
      last = performance.now(),
      elapsed = 0,
      lastReport = 0,
      ready = false;
    async function setRocket(r: Rocket) {
      activeId = r.id;
      const token = ++loadId;
      const f = new T.Vector3(1.24, 0.73 + r.length * 0.5, 0.33),
        d = Math.max(0.55, r.length * 1.8);
      controls.target.copy(f);
      camera.position.copy(f).add(new T.Vector3(d * 0.75, d * 0.38, d * 1.4));
      if (rocketVisual) {
        retired.push(rocketVisual);
        rocketRoot.remove(rocketVisual);
      }
      if (importedCap) {
        retired.push(importedCap);
        rocketRoot.remove(importedCap);
      }
      importedCap = null;
      if (chute) {
        retired.push(chute);
        rocketRoot.remove(chute);
      }
      if (pad) {
        retired.push(pad);
        scene.remove(pad);
      }
      rocketVisual = createRocket(r);
      rocketRoot.add(rocketVisual);
      chute = createChute(r);
      chute.visible = false;
      rocketRoot.add(chute);
      pad = createPad(r.motors.some((m) => m.startsWith("E")));
      scene.add(pad);
      try {
        const asset = await loadRocketAsset(r);
        if (asset && !disposed && token === loadId) {
          retired.push(rocketVisual);
          rocketRoot.remove(rocketVisual);
          rocketVisual = asset;
          rocketRoot.add(asset);
          // Split the original imported mesh at its capsule/nose for a visible tethered recovery.
          if (!asset.userData.cap) {
            capCut =
              r.length *
              (r.shape === "saturn"
                ? 0.9
                : r.shape === "falcon"
                  ? 0.87
                  : r.shape === "atlas"
                    ? 0.83
                    : 0.78);
            importedCap = asset.clone(true);
            importedCap.visible = false;
            rocketRoot.add(importedCap);
            asset.traverse((o) => {
              if (o instanceof T.Mesh) {
                o.material = Array.isArray(o.material)
                  ? o.material.map((m) => m.clone())
                  : o.material.clone();
              }
            });
            importedCap.traverse((o) => {
              if (o instanceof T.Mesh) {
                o.material = Array.isArray(o.material)
                  ? o.material.map((m) => m.clone())
                  : o.material.clone();
                for (const m of Array.isArray(o.material)
                  ? o.material
                  : [o.material])
                  m.clippingPlanes = [upperPlane];
              }
            });
          }
        }
      } catch {
        /* Parametric model remains available if an imported asset cannot load. */
      }
    }
    const tetherGeometry = new T.BufferGeometry();
    tetherGeometry.setAttribute(
      "position",
      new T.BufferAttribute(new Float32Array(12), 3),
    );
    const tether = new T.Line(
      tetherGeometry,
      new T.LineBasicMaterial({ color: "#e7dfc7" }),
    );
    rocketRoot.add(tether);
    tether.visible = false;
    const target = new T.Vector3(),
      desiredPos = new T.Vector3(),
      up = new T.Vector3(0, 1, 0),
      vel = new T.Vector3();
    const desiredQuat = new T.Quaternion();
    const onContextLost = (event: Event) => {
      event.preventDefault();
      latest.current.onError(
        "The graphics context was interrupted. Reload to reopen the field.",
      );
    };
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);
    const tick = (now: number) => {
      if (disposed) return;
      frame = requestAnimationFrame(tick);
      const p = latest.current;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      elapsed += dt;
      environment.update(elapsed, p.conditions.wind);
      if (activeId !== p.rocket.id) setRocket(p.rocket);
      if (p.stage !== lastStage) {
        if (p.stage === "flight") {
          flight = newFlight();
          accumulator = 0;
          trailCount = 0;
          trailTime = 0;
          trailGeo.setDrawRange(0, 0);
          pAge.fill(100);
        }
        if (p.stage === "rocket") {
          flight = newFlight();
          trailCount = 0;
          trailGeo.setDrawRange(0, 0);
          const f = new T.Vector3(1.24, 0.73 + p.rocket.length * 0.5, 0.33),
            d = Math.max(0.55, p.rocket.length * 1.8);
          controls.target.copy(f);
          camera.position
            .copy(f)
            .add(new T.Vector3(d * 0.75, d * 0.38, d * 1.4));
        }
        if (p.stage === "engine") engine.position.y = -0.12;
        lastStage = p.stage;
      }
      if (p.stage === "flight") {
        accumulator += dt;
        while (accumulator >= 1 / 120 && flight.phase !== "landed") {
          flight = stepFlight(flight, p.rocket, p.motor, p.conditions, 1 / 120);
          accumulator -= 1 / 120;
        }
        if (flight.t - trailTime > 0.09 && trailCount < 9000) {
          trailPositions.set(
            [flight.x, flight.y + 0.17, flight.z],
            trailCount++ * 3,
          );
          trailGeo.attributes.position.needsUpdate = true;
          trailGeo.setDrawRange(0, trailCount);
          trailTime = flight.t;
        }
        if (flight.phase === "landed") {
          p.onTelemetry({ ...flight });
          p.onLand();
        } else if (now - lastReport > 75) {
          p.onTelemetry({ ...flight });
          lastReport = now;
        }
      }
      const flying = p.stage === "flight" || p.stage === "landed";
      const mounted = !["rocket", "engine"].includes(p.stage);
      const padHeight = p.rocket.motors.some((m) => m.startsWith("E"))
        ? 0.2
        : 0.17;
      const base = mounted
        ? new T.Vector3(0, padHeight, 0)
        : new T.Vector3(1.24, 0.73, 0.33);
      target.copy(base);
      if (flying) target.add(new T.Vector3(flight.x, flight.y, flight.z));
      if (p.stage === "landed")
        target.y = p.rocket.diameter / 2 + p.rocket.finSpan * 0.65;
      rocketRoot.position.lerp(target, flying ? 1 : Math.min(1, dt * 5));
      const angle =
        p.stage === "landed"
          ? Math.PI / 2
          : mounted
            ? (-p.conditions.angle * Math.PI) / 180
            : 0;
      if (
        flying &&
        flight.phase === "coast" &&
        Math.hypot(flight.vx, flight.vy, flight.vz) > 0.4
      ) {
        vel.set(flight.vx, flight.vy, flight.vz).normalize();
        desiredQuat.setFromUnitVectors(up, vel);
      } else {
        desiredQuat.setFromEuler(
          new T.Euler(
            0,
            0,
            flight.phase === "recovery" && flying
              ? Math.sin(elapsed * 2) * 0.12
              : angle,
          ),
        );
      }
      rocketRoot.quaternion.slerp(desiredQuat, Math.min(1, dt * 5));
      engine.visible = p.stage !== "rocket";
      engine.scale.set(
        p.motor.diameter / 18,
        p.motor.length / 70,
        p.motor.diameter / 18,
      );
      engine.position.y = T.MathUtils.lerp(
        engine.position.y,
        0.027,
        Math.min(1, dt * 4),
      );
      if (pad?.userData.rod)
        pad.userData.rod.rotation.z = (-p.conditions.angle * Math.PI) / 180;
      const recovery = flying && flight.deployedAt !== null;
      const inflation = recovery
        ? Math.min(1, (flight.t - flight.deployedAt!) / 0.65)
        : 0;
      tether.visible = recovery;
      const tp = tetherGeometry.attributes.position;
      tp.setXYZ(0, 0, p.rocket.length * 0.7, 0);
      tp.setXYZ(1, p.rocket.diameter * 0.4, p.rocket.length * 0.82, 0.01);
      tp.setXYZ(2, 0, p.rocket.length * 0.9, 0);
      tp.setXYZ(
        3,
        p.rocket.diameter * 1.7,
        p.rocket.length * (1 - p.rocket.noseRatio) + p.rocket.chute * 0.5,
        0,
      );
      tp.needsUpdate = true;
      if (chute) {
        chute.visible = recovery;
        chute.position.y = p.rocket.length * 0.9;
        chute.scale.set(
          Math.max(0.01, inflation),
          p.stage === "landed" ? 0.06 : Math.max(0.01, inflation),
          Math.max(0.01, inflation),
        );
        chute.rotation.z = p.stage === "landed" ? -Math.PI / 2 : 0;
        if (p.stage === "landed")
          chute.position.set(
            -target.y + 0.02,
            p.rocket.length * 0.6,
            p.rocket.chute * 0.8,
          );
        else {
          chute.position.x = 0;
          chute.position.z = 0;
        }
      }
      if (rocketVisual) {
        const cap = rocketVisual.userData.cap as T.Group | undefined;
        if (cap) {
          cap.position.set(
            recovery ? p.rocket.diameter * 2 : 0,
            p.rocket.length * (1 - p.rocket.noseRatio) +
              (recovery ? p.rocket.chute * 0.6 : 0),
            0,
          );
          cap.rotation.z = recovery ? 0.7 : 0;
        }
        if (importedCap) {
          importedCap.visible = recovery;
          importedCap.position.set(
            recovery ? p.rocket.diameter * 1.7 : 0,
            recovery ? p.rocket.chute * 0.45 : 0,
            0,
          );
          rocketVisual.traverse((o) => {
            if (o instanceof T.Mesh)
              for (const m of Array.isArray(o.material)
                ? o.material
                : [o.material])
                m.clippingPlanes = recovery ? [lowerPlane] : null;
          });
          rocketRoot.updateMatrixWorld(true);
          lowerLocal.set(new T.Vector3(0, -1, 0), capCut);
          lowerPlane.copy(lowerLocal).applyMatrix4(rocketVisual.matrixWorld);
          upperLocal.set(new T.Vector3(0, 1, 0), -capCut);
          upperPlane.copy(upperLocal).applyMatrix4(importedCap.matrixWorld);
        }
      }
      fire.visible = flying && flight.phase === "powered" && flight.liftoff;
      fire.scale.setScalar(
        (p.motor.diameter / 18) * (1 + Math.sin(elapsed * 70) * 0.15),
      );
      glow.intensity = fire.visible ? 2 : 0;
      if (fire.visible) {
        for (let j = 0; j < 3; j++) {
          const i = particleCursor++ % count;
          pPos.set(
            [
              rocketRoot.position.x + (Math.random() - 0.5) * 0.03,
              Math.max(0.05, rocketRoot.position.y - 0.03),
              rocketRoot.position.z,
            ],
            i * 3,
          );
          pVel.set(
            [
              (Math.random() - 0.5) * 0.16,
              -0.25 - Math.random() * 0.6,
              (Math.random() - 0.5) * 0.16,
            ],
            i * 3,
          );
          pAge[i] = 0;
        }
      }
      for (let i = 0; i < count; i++) {
        pAge[i] += dt;
        const age = pAge[i];
        if (age < 9) {
          pPos[i * 3] += (pVel[i * 3] + p.conditions.wind * 0.28) * dt;
          pPos[i * 3 + 1] = Math.max(
            0.035,
            pPos[i * 3 + 1] + pVel[i * 3 + 1] * dt,
          );
          pPos[i * 3 + 2] += pVel[i * 3 + 2] * dt;
          pSize[i] = 0.035 + age * 0.16;
          pAlpha[i] = Math.max(0, 1 - age / 9) * 0.4;
        } else pAlpha[i] = 0;
      }
      smokeGeo.attributes.position.needsUpdate = true;
      smokeGeo.attributes.size.needsUpdate = true;
      smokeGeo.attributes.alpha.needsUpdate = true;
      trailLine.visible = p.trail && flying;
      const focus = rocketRoot.position
        .clone()
        .add(new T.Vector3(0, p.rocket.length * 0.5, 0));
      const mode = p.camera;
      if (mode !== lastCamera) {
        lastCamera = mode;
        controls.enabled = mode === "orbit";
      }
      controls.enabled = mode === "orbit";
      if (mode === "orbit") {
        if (flying) {
          camera.position.add(focus.clone().sub(controls.target));
          controls.target.copy(focus);
        } else {
          controls.target.lerp(focus, dt * 3);
          if (p.rocket.length > 1.5 && camera.position.distanceTo(focus) < 3)
            camera.position.lerp(
              focus.clone().add(new T.Vector3(2, 1.2, 3)),
              dt * 3,
            );
        }
        controls.update();
      } else if (mode === "follow") {
        const d = Math.max(0.65, p.rocket.length * 2);
        desiredPos
          .copy(focus)
          .add(new T.Vector3(d * 0.8, Math.max(0.4, d * 0.33), d * 1.35));
        camera.position.lerp(desiredPos, Math.min(1, dt * (flying ? 5 : 2)));
        camera.lookAt(focus);
      } else if (mode === "ground") {
        desiredPos.set(6, 1.65, 9);
        camera.position.lerp(desiredPos, dt * 4);
        camera.lookAt(focus);
        camera.fov = T.MathUtils.lerp(
          camera.fov,
          Math.max(4, 44 - flight.y * 0.12),
          dt * 3,
        );
        camera.updateProjectionMatrix();
      } else {
        desiredPos
          .copy(rocketRoot.position)
          .add(new T.Vector3(0.12, p.rocket.length * 0.8, 0.12));
        camera.position.copy(desiredPos);
        camera.lookAt(
          rocketRoot.position.x + 1,
          Math.max(0, rocketRoot.position.y - 3),
          rocketRoot.position.z + 1,
        );
      }
      if (mode !== "orbit") controls.target.copy(focus);
      if (mode !== "ground" && camera.fov !== 44) {
        camera.fov = T.MathUtils.lerp(camera.fov, 44, dt * 5);
        camera.updateProjectionMatrix();
      }
      renderer.render(scene, camera);
      if (!ready) {
        ready = true;
        p.onReady();
        makeThumbnails(ROCKETS, (id, url) => {
          if (!disposed) latest.current.onThumbnail(id, url);
        }).catch(() => {});
      }
    };
    frame = requestAnimationFrame(tick);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      ro.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener(
        "webglcontextlost",
        onContextLost,
      );
      const geos = new Set<T.BufferGeometry>(),
        mats = new Set<T.Material>(),
        textures = new Set<T.Texture>();
      for (const object of [scene, ...retired])
        object.traverse((o) => {
          if (
            o instanceof T.Mesh ||
            o instanceof T.Points ||
            o instanceof T.Line
          ) {
            geos.add(o.geometry);
            for (const m of Array.isArray(o.material)
              ? o.material
              : [o.material]) {
              mats.add(m);
              if ("map" in m && m.map instanceof T.Texture) textures.add(m.map);
            }
          }
        });
      geos.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      renderer.dispose();
      el.replaceChildren();
    };
  }, []);
  return (
    <div
      ref={host}
      className="field-canvas"
      aria-label="Interactive 3D rocket launch field. Drag to orbit and scroll to zoom."
    />
  );
}
