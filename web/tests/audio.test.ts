import assert from "node:assert/strict";
import test from "node:test";
import { motorSoundSamples } from "../lib/rocket/audio";
import { getMotor, MOTORS } from "../lib/rocket/catalog";

test("every motor has finite, unclipped audio ending at its own burnout", () => {
  for (const motor of MOTORS) {
    const pcm = motorSoundSamples(motor, 24000);
    assert.equal(pcm.length, Math.ceil(motor.burn * 24000));
    assert.equal(Math.abs(pcm.at(-1)!), 0);
    let energy = 0;
    for (const sample of pcm) {
      assert.ok(Number.isFinite(sample) && Math.abs(sample) < 1, motor.id);
      energy += sample * sample;
    }
    assert.ok(energy / pcm.length > 0.0001, `${motor.id} is audible`);
  }
});

test("hiss follows the thrust envelope and goes quiet during a zero-thrust gap", () => {
  const motor = {
    ...getMotor("C6-5"),
    burn: 1,
    curve: [
      [0, 0],
      [0.02, 10],
      [0.2, 10],
      [0.22, 0],
      [0.65, 0],
      [0.67, 10],
      [0.95, 10],
      [1, 0],
    ] as [number, number][],
  };
  const pcm = motorSoundSamples(motor, 24000);
  const rms = (start: number, end: number) =>
    Math.sqrt(
      pcm.slice(start * 24000, end * 24000).reduce((sum, x) => sum + x * x, 0) /
        ((end - start) * 24000),
    );
  assert.ok(rms(0.1, 0.2) > 0.04);
  assert.ok(rms(0.4, 0.6) < 0.00001);
  assert.ok(rms(0.7, 0.8) > 0.04);
});

test("motor noise has little low-frequency rumble", () => {
  for (const id of ["B6-4", "F15-6"]) {
    const pcm = motorSoundSamples(getMotor(id), 24000);
    let low = 0,
      lowEnergy = 0,
      totalEnergy = 0;
    const alpha = 1 - Math.exp((-2 * Math.PI * 120) / 24000);
    for (const x of pcm) {
      low += alpha * (x - low);
      lowEnergy += low * low;
      totalEnergy += x * x;
    }
    assert.ok(
      lowEnergy / totalEnergy < 0.035,
      `${id} should sound small and bright`,
    );
  }
});
