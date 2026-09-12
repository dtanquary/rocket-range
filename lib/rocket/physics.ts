import { engineFits, type Motor, type Rocket } from "./catalog";
export type Vec3 = [number, number, number];
export type FlightPhase = "powered" | "coast" | "recovery" | "landed";
export type Conditions = {
  wind: number;
  angle: number;
  heading: number;
  /** Meteorological wind FROM bearing: north=0, east=90, west=270. */
  windDirection?: number;
  gusts?: number;
  rodLength?: number;
  ballast?: number;
};
export type FlightState = {
  t: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  phase: FlightPhase;
  apogee: number;
  maxSpeed: number;
  maxG: number;
  deployedAt: number | null;
  liftoff: boolean;
  axis: Vec3;
  omega: Vec3;
  impulse: number;
  mass: number;
  cg: number;
  cp: number;
  stability: number;
  rodExitTime: number | null;
  rodExitSpeed: number | null;
  deploymentSpeed: number | null;
  inflation: number;
  chuteFailed: boolean;
  maxOpeningForce: number;
  impactSpeed: number;
  maxAngleOfAttack: number;
  outcome:
    "flying" | "recovered" | "hard-landing" | "no-recovery" | "no-liftoff";
};
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const length = (a: Vec3) => Math.hypot(...a);
const unit = (a: Vec3): Vec3 => mul(a, 1 / Math.max(1e-12, length(a)));
const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const G = 9.80665;
export function launchAxis(c: Conditions): Vec3 {
  const tilt = (c.angle * Math.PI) / 180,
    az = (c.heading * Math.PI) / 180;
  return [
    Math.sin(tilt) * Math.sin(az),
    Math.cos(tilt),
    -Math.sin(tilt) * Math.cos(az),
  ];
}
export const newFlight = (c?: Conditions): FlightState => ({
  t: 0,
  x: 0,
  y: 0,
  z: 0,
  vx: 0,
  vy: 0,
  vz: 0,
  phase: "powered",
  apogee: 0,
  maxSpeed: 0,
  maxG: 0,
  deployedAt: null,
  liftoff: false,
  axis: c ? launchAxis(c) : [0, 1, 0],
  omega: [0, 0, 0],
  impulse: 0,
  mass: 0,
  cg: 0,
  cp: 0,
  stability: 0,
  rodExitTime: null,
  rodExitSpeed: null,
  deploymentSpeed: null,
  inflation: 0,
  chuteFailed: false,
  maxOpeningForce: 0,
  impactSpeed: 0,
  maxAngleOfAttack: 0,
  outcome: "flying",
});
export function thrustAt(m: Motor, t: number) {
  if (t < 0 || t >= m.burn) return 0;
  for (let i = 1; i < m.curve.length; i++)
    if (t < m.curve[i][0]) {
      const [a, f] = m.curve[i - 1],
        [b, g] = m.curve[i];
      return f + ((g - f) * (t - a)) / (b - a);
    }
  return 0;
}
/** Exact piecewise-linear impulse, including partial segments. */
export function impulseAt(m: Motor, t: number) {
  let impulse = 0;
  for (let i = 1; i < m.curve.length; i++) {
    const [a, f] = m.curve[i - 1],
      [b, g] = m.curve[i];
    if (t <= a) break;
    const end = Math.min(t, b),
      duration = end - a,
      force = f + ((g - f) * duration) / (b - a);
    impulse += ((f + force) * duration) / 2;
    if (t <= b) break;
  }
  return impulse;
}
/** Small-angle Barrowman nose + trapezoidal fin approximation, nose-relative coordinates.
 * Dry CG, damping, Cd and recovery strength are estimated, not measured kit properties.
 */
export function stabilityOf(
  r: Rocket,
  m: Motor,
  c: Conditions,
  burnFraction = 0,
) {
  const root = r.finHeight,
    tip = root * 0.43,
    sweep = root * 0.57,
    span = r.finSpan;
  const midSpan = Math.hypot(span, sweep + (tip - root) / 2);
  const finSlope =
    ((1 + r.diameter / 2 / (span + r.diameter / 2)) *
      (4 * r.fins * (span / r.diameter) ** 2)) /
    (1 + Math.sqrt(1 + ((2 * midSpan) / (root + tip)) ** 2));
  const finCp =
    r.length -
    root +
    (sweep * (root + 2 * tip)) / (3 * (root + tip)) +
    (root + tip - (root * tip) / (root + tip)) / 6;
  const noseCp = (r.length * r.noseRatio * 2) / 3;
  const cp = (2 * noseCp + finSlope * finCp) / (2 + finSlope);
  const motorMass = m.mass - m.propellant * clamp(burnFraction, 0, 1),
    ballast = (c.ballast ?? 0) / 1000;
  const mass = r.mass + motorMass + ballast;
  const dryCg = r.length * (r.dryCg ?? 0.47),
    motorCg = r.length - m.length / 2000,
    noseBallastCg = r.length * 0.12;
  const cg =
    (r.mass * dryCg + motorMass * motorCg + ballast * noseBallastCg) / mass;
  const inertia =
    (r.mass * r.length * r.length) / 12 +
    r.mass * (dryCg - cg) ** 2 +
    motorMass * (motorCg - cg) ** 2 +
    ballast * (noseBallastCg - cg) ** 2;
  return {
    mass,
    cg,
    cp,
    margin: (cp - cg) / r.diameter,
    normalSlope: 2 + finSlope,
    inertia,
    ballast,
  };
}
/** Repeatable gusts and a near-ground power-law wind profile; no random per-frame forcing. */
export function windAt(c: Conditions, height: number, t: number): Vec3 {
  const profile = Math.pow(Math.max(1, height) / 10, 0.14);
  const gust =
    (c.gusts ?? 0) *
    (0.55 * Math.sin(t * 1.31) +
      0.3 * Math.sin(t * 2.73 + 0.7) +
      0.15 * Math.sin(t * 0.43 + 2));
  const speed = Math.max(0, c.wind + gust) * profile;
  const bearing = ((c.windDirection ?? 270) * Math.PI) / 180;
  return [-Math.sin(bearing) * speed, 0, Math.cos(bearing) * speed];
}
export function stepFlight(
  s: FlightState,
  r: Rocket,
  m: Motor,
  c: Conditions,
  dt: number,
): FlightState {
  if (s.phase === "landed") return s;
  if (!Number.isFinite(dt) || (!(dt > 0) && dt !== 0))
    throw new Error("Timestep must be non-negative");
  if (dt === 0) return s;
  const t = s.t + dt,
    impulse = impulseAt(m, t),
    thrust = (impulse - s.impulse) / dt;
  const props = stabilityOf(r, m, c, impulse / m.impulse),
    { mass, cg, cp, inertia, normalSlope } = props;
  let phase: FlightPhase = t < m.burn ? "powered" : "coast",
    deployedAt = s.deployedAt,
    deploymentSpeed = s.deploymentSpeed;
  let axis: Vec3 = s.t === 0 ? launchAxis(c) : s.axis,
    omega: Vec3 = s.omega;
  const velocity: Vec3 = [s.vx, s.vy, s.vz],
    relative = add(velocity, mul(windAt(c, s.y, t), -1)),
    airspeed = length(relative);
  const flow = unit(relative),
    axialSpeed = dot(relative, axis),
    perpendicular = add(relative, mul(axis, -axialSpeed));
  const rho = 1.195 * Math.exp(-Math.max(0, s.y) / 8500),
    area = Math.PI * (r.diameter / 2) ** 2,
    q = 0.5 * rho * airspeed ** 2;
  const axialDrag = mul(
    axis,
    -0.5 * rho * r.drag * area * axialSpeed * Math.abs(axialSpeed),
  );
  const normalForce = add(
    mul(perpendicular, (-q * area * normalSlope) / Math.max(0.2, airspeed)),
    mul(
      perpendicular,
      -0.5 * rho * 0.8 * r.length * r.diameter * length(perpendicular),
    ),
  );
  let inflation = s.inflation,
    chuteFailed = s.chuteFailed;
  if (t >= m.burn + m.delay && s.liftoff) {
    phase = "recovery";
    if (deployedAt === null) {
      deployedAt = t;
      deploymentSpeed = airspeed;
    }
    inflation = clamp((t - deployedAt) / 0.7, 0, 1);
  }
  let chuteArea =
    inflation * 0.78 * Math.PI * (r.chute / 2) ** 2 * (chuteFailed ? 0.12 : 1);
  const openingForce = q * chuteArea;
  // Estimated model canopy/cord capacity; deterministic overload, not random failures.
  if (!chuteFailed && inflation > 0 && openingForce > r.mass * G * 28) {
    chuteFailed = true;
    chuteArea *= 0.12;
  }
  const chuteForce = mul(relative, -0.5 * rho * chuteArea * airspeed);
  let force = add(
    add(add(mul(axis, thrust), axialDrag), normalForce),
    chuteForce,
  );
  force = add(force, [0, -mass * G, 0]);
  let position: Vec3 = [s.x, s.y, s.z],
    nextVelocity: Vec3;
  let rodExitTime = s.rodExitTime,
    rodExitSpeed = s.rodExitSpeed;
  if (rodExitTime === null) {
    axis = launchAxis(c);
    omega = [0, 0, 0];
    const oldSpeed = dot(velocity, axis),
      speed = Math.max(0, oldSpeed + (dot(force, axis) / mass) * dt);
    nextVelocity = mul(axis, speed);
    position = add(position, mul(nextVelocity, dt));
    const guidedTravel = Math.max(0.25, (c.rodLength ?? 1) - r.length * 0.3);
    if (dot(position, axis) >= guidedTravel) {
      rodExitTime = t;
      rodExitSpeed = speed;
    }
  } else {
    nextVelocity = add(velocity, mul(force, dt / mass));
    position = add(position, mul(nextVelocity, dt));
    const aeroTorque = cross(mul(axis, cg - cp), normalForce);
    const recoveryTorque = cross(mul(axis, cg * 0.8), chuteForce);
    const torque = add(aeroTorque, recoveryTorque);
    const damping =
      0.5 *
        rho *
        Math.max(1, airspeed) *
        area *
        normalSlope *
        (cp - cg) ** 2 *
        1.4 +
      (inflation > 0 ? mass * r.length * r.length * 0.9 : 0);
    omega = mul(
      add(omega, mul(torque, dt / Math.max(1e-7, inertia))),
      1 / (1 + (damping * dt) / Math.max(1e-7, inertia)),
    );
    omega = add(omega, mul(axis, -dot(omega, axis))); // No simulated roll degree of freedom.
    axis = unit(add(axis, mul(cross(omega, axis), dt)));
  }
  const liftoff = s.liftoff || position[1] > 0.015;
  let outcome: FlightState["outcome"] = "flying",
    impactSpeed = s.impactSpeed;
  if (liftoff && position[1] <= 0) {
    impactSpeed = length(nextVelocity);
    position[1] = 0;
    nextVelocity = [0, 0, 0];
    phase = "landed";
    outcome =
      deployedAt === null
        ? "no-recovery"
        : chuteFailed || impactSpeed > 8
          ? "hard-landing"
          : "recovered";
  } else if (!liftoff && t >= m.burn) {
    phase = "landed";
    outcome = "no-liftoff";
    position = [0, 0, 0];
    nextVelocity = [0, 0, 0];
  }
  const aoa =
    airspeed > 0.1
      ? (Math.acos(clamp(dot(axis, flow), -1, 1)) * 180) / Math.PI
      : 0;
  return {
    ...s,
    t,
    x: position[0],
    y: position[1],
    z: position[2],
    vx: nextVelocity[0],
    vy: nextVelocity[1],
    vz: nextVelocity[2],
    phase,
    axis,
    omega,
    impulse,
    mass,
    cg,
    cp,
    stability: props.margin,
    deployedAt,
    deploymentSpeed,
    inflation,
    chuteFailed,
    liftoff,
    rodExitTime,
    rodExitSpeed,
    outcome,
    impactSpeed,
    apogee: Math.max(s.apogee, position[1]),
    maxSpeed: Math.max(s.maxSpeed, length(nextVelocity)),
    maxG: Math.max(s.maxG, thrust / mass / G),
    maxOpeningForce: Math.max(s.maxOpeningForce, openingForce),
    maxAngleOfAttack: Math.max(
      s.maxAngleOfAttack,
      rodExitTime !== null && phase !== "recovery" && phase !== "landed"
        ? aoa
        : 0,
    ),
  };
}
export function predict(r: Rocket, m: Motor, c: Conditions) {
  let s = newFlight(c);
  for (let i = 0; i < 120 * 300 && s.phase !== "landed"; i++)
    s = stepFlight(s, r, m, c, 1 / 120);
  return s;
}
/** Copy only prelaunch flight inputs. Camera/UI state never enters this snapshot. */
export function flightConfiguration(r: Rocket, m: Motor, c: Conditions) {
  if (!engineFits(r, m))
    throw new Error("Engine is incompatible with this airframe");
  const rocket = { ...r, motors: [...r.motors] },
    motor = { ...m, curve: m.curve.map((p) => [...p] as [number, number]) };
  Object.freeze(rocket.motors);
  motor.curve.forEach((p) => Object.freeze(p));
  Object.freeze(motor.curve);
  return Object.freeze({
    rocket: Object.freeze(rocket),
    motor: Object.freeze(motor),
    conditions: Object.freeze({ ...c }),
  });
}
