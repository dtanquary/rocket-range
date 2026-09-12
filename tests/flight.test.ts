import test from "node:test";
import assert from "node:assert/strict";
import { ROCKETS, MOTORS, getMotor } from "../lib/rocket/catalog";
import {
  newFlight,
  stepFlight,
  predict,
  thrustAt,
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
