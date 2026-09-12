import motorData from "./motor-data.json";
export type Rocket = {
  id: string;
  name: string;
  family: "Estes classics" | "Scale fleet";
  subtitle: string;
  length: number;
  diameter: number;
  mass: number;
  chute: number;
  color: string;
  accent: string;
  nose: string;
  fins: number;
  finSpan: number;
  finHeight: number;
  noseRatio: number;
  motors: string[];
  recommended: string;
  drag: number;
  shape?: "saturn" | "falcon" | "redstone" | "atlas" | "v2";
  source: string;
  /** Estimated dry CG measured aft of the nose, as a fraction of length. */
  dryCg?: number;
  mountDiameter?: number;
  mountLength?: number;
  model?: string;
  modelCredit?: string;
};
const estes = "Estes classics" as const,
  scale = "Scale fleet" as const;
export const ROCKETS: Rocket[] = [
  {
    id: "alpha",
    name: "Alpha III",
    family: estes,
    subtitle: "The first-flight classic",
    length: 0.307,
    diameter: 0.025,
    mass: 0.034,
    chute: 0.305,
    color: "#f4f0de",
    accent: "#f35a17",
    nose: "#f35a17",
    fins: 3,
    finSpan: 0.043,
    finHeight: 0.067,
    noseRatio: 0.24,
    motors: ["A8-3", "B6-4", "C6-5", "C6-7"],
    recommended: "B6-4",
    drag: 0.56,
    source: "https://estesrockets.com/products/alpha-iii-launch-set",
  },
  {
    id: "bertha",
    name: "Big Bertha",
    family: estes,
    subtitle: "Slow lift. Big personality.",
    length: 0.61,
    diameter: 0.042,
    mass: 0.071,
    chute: 0.457,
    color: "#f7bf17",
    accent: "#16191a",
    nose: "#171a1c",
    fins: 4,
    finSpan: 0.078,
    finHeight: 0.17,
    noseRatio: 0.2,
    motors: ["B6-4", "C6-5"],
    recommended: "C6-5",
    drag: 0.64,
    source: "https://estesrockets.com/products/big-bertha",
  },
  {
    id: "baby",
    name: "Baby Bertha",
    family: estes,
    subtitle: "A pocket-sized favorite",
    length: 0.325,
    diameter: 0.042,
    mass: 0.054,
    chute: 0.305,
    color: "#25272a",
    accent: "#ee4030",
    nose: "#27282b",
    fins: 4,
    finSpan: 0.05,
    finHeight: 0.075,
    noseRatio: 0.28,
    motors: ["A8-3", "B6-4", "C6-5"],
    recommended: "B6-4",
    drag: 0.6,
    source: "https://estesrockets.com/products/baby-bertha",
  },
  {
    id: "daddy",
    name: "Big Daddy",
    family: estes,
    subtitle: "Wide body. Powerful liftoff.",
    length: 0.483,
    diameter: 0.076,
    mass: 0.15,
    chute: 0.61,
    color: "#f4d52e",
    accent: "#202025",
    nose: "#242328",
    fins: 4,
    finSpan: 0.075,
    finHeight: 0.135,
    noseRatio: 0.4,
    motors: ["C11-3", "D12-3", "E12-4"],
    recommended: "D12-3",
    drag: 0.56,
    source: "https://estesrockets.com/products/big-daddy",
  },
  {
    id: "max",
    name: "Der Red Max",
    family: estes,
    subtitle: "The unmistakable red legend",
    length: 0.419,
    diameter: 0.042,
    mass: 0.068,
    chute: 0.457,
    color: "#cf2824",
    accent: "#151719",
    nose: "#16191b",
    fins: 3,
    finSpan: 0.064,
    finHeight: 0.13,
    noseRatio: 0.3,
    motors: ["B6-4", "C6-5"],
    recommended: "C6-5",
    drag: 0.62,
    source: "https://estesrockets.com/products/der-red-max",
  },
  {
    id: "mean",
    name: "Mean Machine",
    family: estes,
    subtitle: "Two meters of attitude",
    length: 2.032,
    diameter: 0.042,
    mass: 0.241,
    chute: 0.61,
    color: "#111c24",
    accent: "#eaedec",
    nose: "#161b22",
    fins: 3,
    finSpan: 0.055,
    finHeight: 0.15,
    noseRatio: 0.067,
    motors: ["D12-3", "E12-4", "E12-6"],
    recommended: "E12-4",
    drag: 0.62,
    source: "https://estesrockets.com/products/mean-machine",
  },
  {
    id: "patriot",
    name: "Patriot M-104",
    family: estes,
    subtitle: "A field-ready scale classic",
    length: 0.533,
    diameter: 0.041,
    mass: 0.057,
    chute: 0.305,
    color: "#edece0",
    accent: "#b92727",
    nose: "#e4b724",
    fins: 4,
    finSpan: 0.043,
    finHeight: 0.1,
    noseRatio: 0.22,
    motors: ["B6-4", "C6-5"],
    recommended: "C6-5",
    drag: 0.55,
    source: "https://estesrockets.com/products/patriot-m-104",
  },
  {
    id: "executioner",
    name: "Executioner",
    family: estes,
    subtitle: "A commanding D and E flyer",
    length: 0.965,
    diameter: 0.066,
    mass: 0.235,
    chute: 0.61,
    color: "#d8dadd",
    accent: "#76439c",
    nose: "#24252c",
    fins: 3,
    finSpan: 0.09,
    finHeight: 0.23,
    noseRatio: 0.22,
    motors: ["D12-3", "E12-4", "E12-6"],
    recommended: "E12-4",
    drag: 0.65,
    source: "https://estesrockets.com/products/executioner",
  },
  {
    id: "cherokee",
    name: "Cherokee-E",
    family: estes,
    subtitle: "A long, clean climb",
    length: 0.75,
    diameter: 0.033,
    mass: 0.163,
    chute: 0.457,
    color: "#eee9d7",
    accent: "#d63c24",
    nose: "#da3d24",
    fins: 3,
    finSpan: 0.05,
    finHeight: 0.125,
    noseRatio: 0.18,
    motors: ["D12-5", "D12-7", "E12-6"],
    recommended: "D12-5",
    drag: 0.5,
    source: "https://estesrockets.com/products/cherokee",
  },
  {
    id: "bullpup",
    name: "Bull Pup 12D",
    family: estes,
    subtitle: "A detailed sport-scale favorite",
    length: 0.396,
    diameter: 0.034,
    mass: 0.051,
    chute: 0.305,
    color: "#e8e9e2",
    accent: "#e6e7e0",
    nose: "#eeece4",
    fins: 4,
    finSpan: 0.039,
    finHeight: 0.07,
    noseRatio: 0.31,
    motors: ["A8-3", "B6-4", "C6-5"],
    recommended: "B6-4",
    drag: 0.66,
    source: "https://estesrockets.com/products/bull-pup-12d",
  },
  {
    id: "nova",
    name: "Red Nova",
    family: estes,
    subtitle: "The bold D-engine flyer",
    length: 0.549,
    diameter: 0.042,
    mass: 0.085,
    chute: 0.381,
    color: "#e8e9e5",
    accent: "#c7302b",
    nose: "#d63a2b",
    fins: 4,
    finSpan: 0.055,
    finHeight: 0.15,
    noseRatio: 0.22,
    motors: ["C11-3", "D12-5", "D12-7"],
    recommended: "D12-5",
    drag: 0.61,
    source: "https://estesrockets.com/products/red-nova",
  },
  {
    id: "superbertha",
    name: "Super Big Bertha",
    family: estes,
    subtitle: "A Pro Series powerhouse",
    length: 0.935,
    diameter: 0.066,
    mass: 0.2523,
    chute: 0.61,
    color: "#e8e7df",
    accent: "#cf342e",
    nose: "#e7e5de",
    fins: 4,
    finSpan: 0.081,
    finHeight: 0.255,
    noseRatio: 0.21,
    motors: ["E16-4", "F15-6"],
    recommended: "E16-4",
    drag: 0.66,
    source: "https://estesrockets.com/products/super-big-bertha",
  },
  {
    id: "falcon",
    name: "Falcon 9",
    family: scale,
    subtitle: "SpaceX · miniature tribute",
    length: 0.96,
    diameter: 0.052,
    mass: 0.18,
    chute: 0.61,
    color: "#eeeeeb",
    accent: "#15191d",
    nose: "#efeee9",
    fins: 4,
    finSpan: 0.045,
    finHeight: 0.09,
    noseRatio: 0.15,
    motors: ["D12-3", "E12-4"],
    recommended: "E12-4",
    drag: 0.5,
    shape: "falcon",
    source: "https://www.spacex.com/vehicles/falcon-9/",
  },
  {
    id: "saturn",
    name: "Saturn V",
    family: scale,
    subtitle: "Apollo · miniature tribute",
    length: 1.1,
    diameter: 0.1,
    mass: 0.3,
    chute: 0.76,
    color: "#eeeae1",
    accent: "#191c20",
    nose: "#efebe2",
    fins: 4,
    finSpan: 0.065,
    finHeight: 0.09,
    noseRatio: 0.18,
    motors: ["E12-4"],
    recommended: "E12-4",
    drag: 0.6,
    shape: "saturn",
    source: "https://science.nasa.gov/3d-resources/",
  },
  {
    id: "redstone",
    name: "Mercury-Redstone",
    family: scale,
    subtitle: "Freedom 7 · miniature tribute",
    length: 0.72,
    diameter: 0.051,
    mass: 0.125,
    chute: 0.51,
    color: "#f1eee5",
    accent: "#181b21",
    nose: "#21252a",
    fins: 4,
    finSpan: 0.055,
    finHeight: 0.11,
    noseRatio: 0.22,
    motors: ["C11-3", "D12-3", "E12-4"],
    recommended: "D12-3",
    drag: 0.63,
    shape: "redstone",
    source: "https://science.nasa.gov/3d-resources/",
  },
  {
    id: "atlas",
    name: "Mercury-Atlas",
    family: scale,
    subtitle: "Friendship 7 · miniature tribute",
    length: 0.81,
    diameter: 0.079,
    mass: 0.19,
    chute: 0.61,
    color: "#aab2b6",
    accent: "#11171d",
    nose: "#22272b",
    fins: 3,
    finSpan: 0.05,
    finHeight: 0.11,
    noseRatio: 0.22,
    motors: ["D12-3", "E12-4"],
    recommended: "E12-4",
    drag: 0.52,
    shape: "atlas",
    source: "https://science.nasa.gov/3d-resources/",
  },
];
export type Motor = {
  id: string;
  diameter: number;
  length: number;
  impulse: number;
  burn: number;
  delay: number;
  mass: number;
  propellant: number;
  curve: [number, number][];
  source: string;
  provenance: string;
};
function motor(id: string): Motor {
  const designation = id.split("-")[0] as keyof typeof motorData;
  const data = motorData[designation];
  return {
    id,
    diameter: data.diameter,
    length: data.length,
    mass: data.mass,
    propellant: data.propellant,
    impulse: data.impulse,
    burn: data.burn,
    delay: Number(id.split("-")[1]),
    curve: data.samples.map((p) => [p[0], p[1]]),
    source: data.source,
    provenance:
      data.classification === "cert"
        ? "Certification-derived samples"
        : "Contributed simulation samples",
  };
}
export const MOTORS: Motor[] = [
  "A8-3",
  "B6-4",
  "C6-5",
  "C6-7",
  "C11-3",
  "D12-3",
  "D12-5",
  "D12-7",
  "E16-4",
  "F15-6",
  "E12-4",
  "E12-6",
].map(motor);
export function getMotor(id: string) {
  const m = MOTORS.find((m) => m.id === id);
  if (!m) throw new Error(`Unknown engine: ${id}`);
  return m;
}

// Mount dimensions are fixed properties of each airframe, independent of selection.
for (const rocket of ROCKETS) {
  const mount: Record<string, [number, number]> = {
    alpha: [18, 70],
    bertha: [18, 70],
    baby: [18, 70],
    daddy: [24, 95],
    max: [18, 70],
    mean: [24, 95],
    patriot: [18, 70],
    executioner: [24, 95],
    cherokee: [24, 95],
    bullpup: [18, 70],
    nova: [24, 70],
    superbertha: [29, 114],
    falcon: [24, 95],
    saturn: [24, 95],
    redstone: [24, 95],
    atlas: [24, 95],
  };
  [rocket.mountDiameter, rocket.mountLength] = mount[rocket.id];
  // Dry CG is an explicit game estimate until a measured, finished-kit CG is supplied.
  rocket.dryCg =
    rocket.shape === "saturn"
      ? 0.38
      : rocket.shape === "atlas"
        ? 0.4
        : rocket.shape === "falcon"
          ? 0.46
          : 0.47;
}
export function engineFits(r: Rocket, m: Motor) {
  return (
    r.motors.includes(m.id) &&
    m.diameter === r.mountDiameter &&
    m.length <= (r.mountLength ?? 0)
  );
}
