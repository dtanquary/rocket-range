import assert from "node:assert/strict";
import test from "node:test";
import * as T from "three";
import { FollowCameraRig, positionOnboardCamera } from "../lib/rocket/cameras";
import { ROCKETS } from "../lib/rocket/catalog";

test("Follow keeps a steady viewing angle when descent speed and drift change", () => {
  const camera = new T.PerspectiveCamera(44, 1.6, 0.01, 18000);
  camera.position.set(2, 2, 3);
  const focus = new T.Vector3(0, 120, 0),
    rig = new FollowCameraRig();
  rig.reset(camera, focus);
  for (let i = 0; i < 240; i++)
    rig.update(camera, focus, 0.307, 0.305, 1, 1 / 30);
  const direction = camera.getWorldDirection(new T.Vector3());
  for (let i = 0; i < 300; i++) {
    const dt = i % 3 === 0 ? 1 / 30 : 1 / 60;
    focus.x += (2 + Math.sin(i * 0.9)) * dt;
    focus.y -= (5 + Math.sin(i * 1.3) * 3) * dt;
    rig.update(camera, focus, 0.307, 0.305, 1, dt);
    assert.ok(
      camera.getWorldDirection(new T.Vector3()).distanceTo(direction) < 0.00001,
      "Camera and aim must translate together rather than pitch with tracking lag",
    );
  }
});

test("Follow recovery framing fits both airframe and parachute across the fleet", () => {
  for (const rocket of ROCKETS) {
    const camera = new T.PerspectiveCamera(44, 1.6, 0.01, 18000);
    const focus = new T.Vector3(0, 100 + rocket.length * 0.5, 0);
    const rig = new FollowCameraRig();
    camera.position.copy(focus).add(new T.Vector3(1, 1, 2));
    rig.reset(camera, focus);
    for (let i = 0; i < 240; i++)
      rig.update(camera, focus, rocket.length, rocket.chute, 1, 1 / 30);
    camera.updateMatrixWorld();
    for (const point of [
      new T.Vector3(0, 100, 0),
      new T.Vector3(0, 100 + rocket.length + rocket.chute, 0),
    ]) {
      point.project(camera);
      assert.ok(Math.abs(point.x) < 0.9 && Math.abs(point.y) < 0.9, rocket.id);
    }
  }
});

test("Onboard translates and rotates with its airframe, including recovery", () => {
  const camera = new T.PerspectiveCamera(),
    rocket = new T.Object3D();
  positionOnboardCamera(camera, rocket, 0.6, 0.04);
  const origin = camera.position.clone(),
    direction = camera.getWorldDirection(new T.Vector3());
  rocket.position.set(17, 150, -12);
  positionOnboardCamera(camera, rocket, 0.6, 0.04);
  assert.ok(
    camera.position.clone().sub(origin).distanceTo(rocket.position) < 1e-10,
  );
  rocket.quaternion.setFromAxisAngle(new T.Vector3(0, 0, 1), Math.PI * 0.65);
  positionOnboardCamera(camera, rocket, 0.6, 0.04);
  assert.ok(
    camera.position.distanceTo(
      origin.applyQuaternion(rocket.quaternion).add(rocket.position),
    ) < 1e-10,
  );
  assert.ok(
    camera
      .getWorldDirection(new T.Vector3())
      .distanceTo(direction.applyQuaternion(rocket.quaternion)) < 1e-10,
  );
  assert.ok(Number.isFinite(camera.quaternion.w));
});
