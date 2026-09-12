import type { Motor, Rocket } from "./catalog";
export type FlightPhase = "powered" | "coast" | "recovery" | "landed";
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
  path: [number, number, number][];
};
export type Conditions = { wind: number; angle: number; heading: number };
export const newFlight = (): FlightState => ({
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
  path: [[0, 0, 0]],
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
export function stepFlight(
  s: FlightState,
  r: Rocket,
  m: Motor,
  c: Conditions,
  dt: number,
): FlightState {
  if (s.phase === "landed") return s;
  const t = s.t + dt,
    thrust = thrustAt(m, t),
    mass = r.mass + m.mass - m.propellant * Math.min(t / m.burn, 1);
  let phase: FlightPhase = t < m.burn ? "powered" : "coast",
    deployedAt = s.deployedAt;
  if (t >= m.burn + m.delay) {
    phase = "recovery";
    deployedAt ??= t;
  }
  const rho = 1.225 * Math.exp(-s.y / 8500),
    inflation =
      phase === "recovery" ? Math.min(1, (t - deployedAt!) / 0.65) : 0;
  const area =
    r.drag * Math.PI * (r.diameter / 2) ** 2 +
    inflation * 0.78 * Math.PI * (r.chute / 2) ** 2;
  const relX = s.vx - c.wind,
    relY = s.vy,
    relZ = s.vz - c.wind * 0.16,
    airSpeed = Math.hypot(relX, relY, relZ);
  const drag = (0.5 * rho * area * airSpeed) / mass;
  const tilt = (c.angle * Math.PI) / 180,
    heading = (c.heading * Math.PI) / 180;
  // A restrained weathercock response; this is a game model, not a six-DOF solver.
  const weathercock =
    s.y > 1 ? Math.min(0.1, c.wind * 0.009) * Math.min(1, t) : 0;
  const ax =
    (thrust / mass) * (Math.sin(tilt) * Math.cos(heading) - weathercock) -
    drag * relX;
  const az = (thrust / mass) * Math.sin(tilt) * Math.sin(heading) - drag * relZ;
  const ay = (thrust / mass) * Math.cos(tilt) - 9.80665 - drag * relY;
  let vx = s.vx + ax * dt,
    vy = s.vy + ay * dt,
    vz = s.vz + az * dt;
  let x = s.x + vx * dt,
    y = s.y + vy * dt,
    z = s.z + vz * dt;
  const liftoff = s.liftoff || y > 0.015;
  if (!liftoff && y < 0) {
    x = y = z = vx = vy = vz = 0;
  }
  if (liftoff && y <= 0) {
    y = 0;
    vx = vy = vz = 0;
    phase = "landed";
  }
  return {
    ...s,
    t,
    x,
    y,
    z,
    vx,
    vy,
    vz,
    phase,
    liftoff,
    deployedAt,
    apogee: Math.max(s.apogee, y),
    maxSpeed: Math.max(s.maxSpeed, Math.hypot(vx, vy, vz)),
    maxG: Math.max(s.maxG, thrust / mass / 9.80665),
  };
}
export function predict(r: Rocket, m: Motor, c: Conditions) {
  let s = newFlight();
  for (let i = 0; i < 120 * 240 && s.phase !== "landed"; i++)
    s = stepFlight(s, r, m, c, 1 / 120);
  return s;
}
