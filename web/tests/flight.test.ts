import test from "node:test";
import assert from "node:assert/strict";
import { ROCKETS, MOTORS, getMotor, engineFits } from "../lib/rocket/catalog";
import {
  newFlight,
  stepFlight,
  predict,
  thrustAt,
  stabilityOf,
  windAt,
  launchAxis,
  impulseAt,
  flightConfiguration,
} from "../lib/rocket/physics";
const calm = { wind: 0, angle: 0, heading: 0 };
test("every offered rocket and motor reaches liftoff, ejects, and lands with finite telemetry", () => {
  for (const r of ROCKETS)
    for (const id of r.motors) {
      const m = getMotor(id);
      assert.ok(m, `${r.id}/${id}: valid motor`);
      for (const c of [calm, { wind: 6, angle: 10, heading: 0 }]) {
        const s = predict(r, m, c);
        const name = `${r.id}/${id}, wind=${c.wind}`;
        assert.equal(s.phase, "landed", name);
        assert.ok(s.liftoff, name);
        assert.ok(s.apogee > 10, name);
        assert.equal(s.y, 0, name);
        assert.ok(
          s.deployedAt !== null && s.deployedAt < s.t,
          `${name}: parachute deploys before touchdown`,
        );
        assert.ok(
          [s.x, s.y, s.z, s.t, s.apogee, s.maxSpeed, s.maxG].every(
            Number.isFinite,
          ),
          name,
        );
        assert.ok(s.t < 240, name);
      }
    }
});
test("engine curves deliver their declared impulse and stop at burnout", () => {
  for (const m of MOTORS) {
    let impulse = 0;
    const dt = 0.0005;
    for (let t = 0; t < m.burn; t += dt) impulse += thrustAt(m, t) * dt;
    assert.ok(Math.abs(impulse - m.impulse) < 0.01, m.id);
    assert.equal(thrustAt(m, -1), 0);
    assert.equal(thrustAt(m, m.burn), 0);
    assert.equal(thrustAt(m, m.burn + 1), 0);
  }
});
test("ejection clock starts at burnout, and parachute slows the descent", () => {
  const r = ROCKETS[0],
    m = getMotor("C6-5");
  let s = newFlight();
  let descentSpeed = 0;
  for (let i = 0; i < 120 * 240 && s.phase !== "landed"; i++) {
    const next = stepFlight(s, r, m, calm, 1 / 120);
    if (next.t < m.burn + m.delay) assert.equal(next.deployedAt, null);
    if (next.phase === "recovery" && next.y > 5 && next.vy < 0)
      descentSpeed = Math.abs(next.vy);
    s = next;
  }
  assert.ok(Math.abs(s.deployedAt! - (m.burn + m.delay)) <= 1 / 120 + 0.000001);
  assert.ok(descentSpeed < 8 && descentSpeed > 1);
});
test("stronger engines increase altitude and wind moves the recovery downrange", () => {
  const r = ROCKETS[0];
  const a = predict(r, getMotor("A8-3"), calm),
    b = predict(r, getMotor("B6-4"), calm),
    c = predict(r, getMotor("C6-5"), calm);
  assert.ok(a.apogee < b.apogee && b.apogee < c.apogee);
  assert.ok(Math.abs(b.x) < 0.001 && Math.abs(b.z) < 0.001);
  const windy = predict(r, getMotor("B6-4"), { ...calm, wind: 4 });
  assert.ok(windy.x > 50);
});
test("landed flight is immutable and the next flight starts empty", () => {
  const r = ROCKETS[1],
    m = getMotor(r.recommended),
    landed = predict(r, m, calm);
  assert.strictEqual(stepFlight(landed, r, m, calm, 1), landed);
  const fresh = newFlight();
  assert.equal(fresh.t, 0);
  assert.equal(fresh.apogee, 0);
  assert.equal(fresh.deployedAt, null);
  assert.equal(fresh.liftoff, false);
});

test("mount fit checks diameter, length, and recommended engine variant", () => {
  const r = ROCKETS[0],
    m = getMotor("B6-4");
  assert.ok(engineFits(r, m));
  assert.equal(engineFits(r, getMotor("D12-3")), false);
  assert.equal(engineFits(r, { ...m, length: 95 }), false);
  assert.equal(engineFits(r, { ...m, diameter: 24 }), false);
  assert.throws(
    () => flightConfiguration(r, getMotor("E12-4"), calm),
    /incompatible/,
  );
});
test("rod constrains motion until release; a longer rod gives more exit speed", () => {
  const r = ROCKETS[0],
    m = getMotor("B6-4"),
    c = { ...calm, angle: 8, heading: 270, wind: 4, rodLength: 1.2 };
  const rod = launchAxis(c);
  let s = newFlight(c);
  while (s.rodExitTime === null) {
    s = stepFlight(s, r, m, c, 1 / 120);
    assert.deepEqual(s.axis, rod);
    assert.deepEqual(s.omega, [0, 0, 0]);
    assert.ok(Math.abs(s.x * rod[1] - s.y * rod[0]) < 1e-8);
    assert.ok(s.t < 2);
  }
  assert.ok(s.rodExitSpeed! > 0);
  const short = predict(r, m, { ...c, rodLength: 0.6 }),
    long = predict(r, m, { ...c, rodLength: 1.8 });
  assert.ok(long.rodExitSpeed! > short.rodExitSpeed!);
});
test("nose ballast and propellant consumption shift CG forward", () => {
  const r = ROCKETS[0],
    m = getMotor("C6-5"),
    start = stabilityOf(r, m, calm),
    ballasted = stabilityOf(r, m, { ...calm, ballast: 15 }),
    burned = stabilityOf(r, m, calm, 1);
  assert.ok(
    ballasted.cg < start.cg &&
      ballasted.margin > start.margin &&
      ballasted.mass > start.mass,
  );
  assert.ok(burned.cg < start.cg && burned.mass < start.mass);
  assert.equal(start.cp, ballasted.cp);
  assert.ok(Math.abs(impulseAt(m, m.burn) - m.impulse) < 1e-9);
});
test("stable airframe restores a disturbed axis; an aft CG amplifies it", () => {
  const r = ROCKETS[0],
    m = getMotor("B6-4");
  const state = {
    ...newFlight(),
    t: m.burn + 0.1,
    impulse: m.impulse,
    y: 40,
    vy: 30,
    axis: [0.15, Math.sqrt(1 - 0.15 ** 2), 0] as [number, number, number],
    rodExitTime: 0.2,
    liftoff: true,
  };
  const stable = stepFlight(state, r, m, calm, 1 / 120),
    unstable = stepFlight(state, { ...r, dryCg: 0.98 }, m, calm, 1 / 120);
  assert.ok(stable.axis[0] < state.axis[0]);
  assert.ok(unstable.axis[0] > state.axis[0]);
});
test("wind direction mirrors drift, and deterministic gusts vary with time and height", () => {
  const r = ROCKETS[0],
    m = getMotor("B6-4");
  const west = predict(r, m, { ...calm, wind: 3, windDirection: 270 }),
    east = predict(r, m, { ...calm, wind: 3, windDirection: 90 });
  assert.ok(west.x > 0 && east.x < 0);
  assert.ok(Math.abs(west.x + east.x) < 0.1);
  assert.ok(Math.abs(west.apogee - east.apogee) < 0.1);
  const c = { ...calm, wind: 3, gusts: 1 };
  assert.deepEqual(windAt(c, 50, 2), windAt(c, 50, 2));
  assert.notDeepEqual(windAt(c, 50, 2), windAt(c, 50, 3));
  assert.ok(Math.abs(windAt(c, 100, 2)[0]) > Math.abs(windAt(c, 1, 2)[0]));
});
test("early and late ejection have physical consequences rather than guaranteed recovery", () => {
  const r = ROCKETS[0],
    m = getMotor("C6-5");
  const early = predict(r, { ...m, delay: 0 }, calm);
  assert.ok(early.chuteFailed);
  assert.equal(early.outcome, "hard-landing");
  assert.ok(early.impactSpeed > 8);
  const late = predict(r, { ...m, delay: 25 }, calm);
  assert.equal(late.deployedAt, null);
  assert.equal(late.outcome, "no-recovery");
  assert.ok(late.impactSpeed > 20);
  const underpowered = predict(r, m, { ...calm, ballast: 10000 });
  assert.equal(underpowered.outcome, "no-liftoff");
  assert.equal(underpowered.phase, "landed");
});
test("launch snapshot is isolated from subsequent preparation changes", () => {
  const r = { ...ROCKETS[0], motors: [...ROCKETS[0].motors] },
    m = {
      ...getMotor("B6-4"),
      curve: getMotor("B6-4").curve.map((p) => [...p] as [number, number]),
    },
    c = { ...calm };
  const snapshot = flightConfiguration(r, m, c),
    expected = predict(snapshot.rocket, snapshot.motor, snapshot.conditions);
  c.wind = 6;
  r.mass = 1;
  r.motors.length = 0;
  m.curve[1][1] = 9999;
  assert.deepEqual(
    predict(snapshot.rocket, snapshot.motor, snapshot.conditions),
    expected,
  );
  assert.ok(
    Object.isFrozen(snapshot.conditions) &&
      Object.isFrozen(snapshot.motor.curve) &&
      Object.isFrozen(snapshot.motor.curve[0]),
  );
});
test("maximum selectable gusts and ballast remain numerically finite through impact", () => {
  for (const r of ROCKETS) {
    const s = predict(r, getMotor(r.recommended), {
      wind: 6,
      gusts: 3,
      windDirection: 225,
      angle: 10,
      heading: 270,
      rodLength: 0.6,
      ballast: 75,
    });
    assert.equal(s.phase, "landed", r.id);
    assert.ok(
      [
        s.x,
        s.y,
        s.z,
        s.mass,
        s.cg,
        s.cp,
        s.impactSpeed,
        ...s.axis,
        ...s.omega,
      ].every(Number.isFinite),
      r.id,
    );
    assert.equal(s.y, 0);
  }
});
