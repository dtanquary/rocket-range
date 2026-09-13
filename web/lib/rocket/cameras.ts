import * as T from "three";

/** A translating camera boom: position and aim share the same moving anchor. */
export class FollowCameraRig {
  private offset = new T.Vector3();
  private desiredOffset = new T.Vector3();
  private anchor = new T.Vector3();
  private lift = 0;

  reset(camera: T.Camera, focus: T.Vector3) {
    this.offset.copy(camera.position).sub(focus);
    this.lift = 0;
  }

  update(
    camera: T.Camera,
    focus: T.Vector3,
    length: number,
    chute: number,
    inflation: number,
    dt: number,
  ) {
    const smoothing = 1 - Math.exp(-5 * dt);
    const recovery = Math.max(0, Math.min(1, inflation));
    // Include the canopy in the frame instead of chasing the airframe at close range.
    const distance = Math.max(
      0.65,
      length * 2,
      recovery * (length + chute * 2.2),
    );
    this.desiredOffset.set(
      distance * 0.8,
      Math.max(0.4, distance * 0.33),
      distance * 1.35,
    );
    this.offset.lerp(this.desiredOffset, smoothing);
    this.lift +=
      (recovery * (length * 0.2 + chute * 0.4) - this.lift) * smoothing;
    this.anchor.copy(focus);
    this.anchor.y += this.lift;
    // Follow the translation exactly. Damping the camera's world position while
    // aiming at the undamped rocket caused pitching/jerking during descent.
    camera.position.copy(this.anchor).add(this.offset);
    camera.lookAt(this.anchor);
  }
}

const onboardPosition = new T.Vector3();
const onboardDirection = new T.Vector3();

/** An aft-looking side camera rigidly attached to the airframe. */
export function positionOnboardCamera(
  camera: T.Camera,
  rocket: T.Object3D,
  length: number,
  diameter: number,
) {
  onboardPosition.set(diameter * 0.85, length * 0.72, 0);
  onboardPosition.applyQuaternion(rocket.quaternion).add(rocket.position);
  onboardDirection
    .set(0.22, -1, -0.08)
    .normalize()
    .applyQuaternion(rocket.quaternion);
  camera.position.copy(onboardPosition);
  camera.up.set(1, 0, 0).applyQuaternion(rocket.quaternion);
  camera.lookAt(onboardDirection.add(onboardPosition));
}
