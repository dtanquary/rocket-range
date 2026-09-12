"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  AudioLines,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Crosshair,
  Eye,
  Flag,
  Gauge,
  KeyRound,
  Maximize,
  Mouse,
  MoveUpRight,
  Orbit,
  PackageOpen,
  Pause,
  Play,
  Radio,
  RotateCcw,
  Rocket as RocketIcon,
  SlidersHorizontal,
  Sun,
  Volume2,
  VolumeX,
  Wind,
  X,
  Zap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import Field, { type CameraMode, type Stage } from "@/components/rocket/field";
import { ROCKETS, getMotor, type Rocket } from "@/lib/rocket/catalog";
import {
  newFlight,
  predict,
  type Conditions,
  type FlightState,
} from "@/lib/rocket/physics";
const STAGE_LABELS: Record<Stage, string> = {
  rocket: "IN THE WORKSHOP",
  engine: "ENGINE LOADED",
  pad: "ON THE PAD",
  armed: "READY FOR LAUNCH",
  countdown: "COUNTDOWN",
  flight: "FLIGHT IN PROGRESS",
  landed: "RECOVERY COMPLETE",
};
function fmt(n: number, digits = 0) {
  return n.toLocaleString("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}
let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
function audioDestination() {
  if (!masterGain && audioCtx) {
    masterGain = audioCtx.createGain();
    masterGain.connect(audioCtx.destination);
  }
  return masterGain!;
}
function beep(frequency = 660, duration = 0.09, volume = 0.06) {
  try {
    audioCtx ??= new AudioContext();
    void audioCtx.resume();
    const o = audioCtx.createOscillator(),
      g = audioCtx.createGain();
    o.frequency.value = frequency;
    o.connect(g);
    g.connect(audioDestination());
    g.gain.setValueAtTime(volume, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    o.start();
    o.stop(audioCtx.currentTime + duration);
  } catch {}
}
function roar(duration: number) {
  try {
    audioCtx ??= new AudioContext();
    void audioCtx.resume();
    const buffer = audioCtx.createBuffer(
      1,
      audioCtx.sampleRate * duration,
      audioCtx.sampleRate,
    );
    const a = buffer.getChannelData(0);
    for (let i = 0; i < a.length; i++) a[i] = (Math.random() * 2 - 1) * 0.35;
    const s = audioCtx.createBufferSource(),
      filter = audioCtx.createBiquadFilter(),
      g = audioCtx.createGain();
    s.buffer = buffer;
    filter.type = "lowpass";
    filter.frequency.value = 1100;
    s.connect(filter);
    filter.connect(g);
    g.connect(audioDestination());
    g.gain.setValueAtTime(0.01, audioCtx.currentTime);
    g.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.1);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    s.start();
  } catch {}
}
export default function RocketRange() {
  const [rocketId, setRocketId] = useState("alpha"),
    [motorId, setMotorId] = useState("B6-4"),
    [stage, setStage] = useState<Stage>("rocket"),
    [camera, setCamera] = useState<CameraMode>("orbit");
  const [conditions, setConditions] = useState<Conditions>({
      wind: 1.5,
      angle: 0,
      heading: 0,
    }),
    [fleetOpen, setFleetOpen] = useState(false),
    [settingsOpen, setSettingsOpen] = useState(false),
    [helpOpen, setHelpOpen] = useState(false),
    [creditsOpen, setCreditsOpen] = useState(false);
  const [thumbs, setThumbs] = useState<Record<string, string>>({}),
    [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [telemetry, setTelemetry] = useState<FlightState>(newFlight),
    [countdown, setCountdown] = useState(3),
    [sound, setSound] = useState(true),
    [trail, setTrail] = useState(true),
    [flightNumber, setFlightNumber] = useState(1);
  const [tab, setTab] = useState<
    "All rockets" | "Estes classics" | "Scale fleet"
  >("All rockets");
  useEffect(() => {
    if (masterGain && audioCtx)
      masterGain.gain.setTargetAtTime(
        sound ? 1 : 0,
        audioCtx.currentTime,
        0.03,
      );
  }, [sound]);
  const rocket = ROCKETS.find((r) => r.id === rocketId)!,
    motor = getMotor(motorId);
  const prediction = useMemo(
    () => predict(rocket, motor, conditions),
    [rocket, motor, conditions],
  );
  const busy = stage === "flight" || stage === "countdown",
    loaded = stage !== "rocket",
    mounted = !["rocket", "engine"].includes(stage),
    armed = stage === "armed" || stage === "countdown";
  const current = useRef({ stage, sound, motor });
  current.current = { stage, sound, motor };
  const chooseRocket = (r: Rocket) => {
    if (busy) return;
    setRocketId(r.id);
    setMotorId(r.recommended);
    setStage("rocket");
    setTelemetry(newFlight());
    setCamera("orbit");
    setFleetOpen(false);
  };
  const reset = () => {
    setStage("rocket");
    setTelemetry(newFlight());
    setCamera("orbit");
    setFlightNumber((n) => n + 1);
  };
  const launch = useCallback(() => {
    if (current.current.stage !== "armed") return;
    if (current.current.sound) beep(540, 0.15);
    setCountdown(3);
    setStage("countdown");
  }, []);
  useEffect(() => {
    if (stage !== "countdown") return;
    const timer = setInterval(() => setCountdown((n) => n - 1), 1000);
    return () => clearInterval(timer);
  }, [stage]);
  useEffect(() => {
    if (stage === "countdown") {
      if (countdown <= 0) {
        setStage("flight");
        setCamera("follow");
        if (sound) roar(motor.burn);
      } else if (sound) beep(540, 0.14);
    }
  }, [countdown, stage, sound, motor.burn]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLElement &&
        e.target.closest('button,input,[role="slider"],[role="dialog"]')
      )
        return;
      if (e.code === "Space") {
        e.preventDefault();
        if (current.current.stage === "armed") launch();
      }
      if (e.key.toLowerCase() === "c")
        setCamera((c) =>
          c === "orbit"
            ? "follow"
            : c === "follow"
              ? "ground"
              : c === "ground"
                ? "onboard"
                : "orbit",
        );
      if (e.key === "Escape" && current.current.stage === "countdown")
        setStage("armed");
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [launch]);
  const onThumbnail = useCallback(
    (id: string, url: string) => setThumbs((t) => ({ ...t, [id]: url })),
    [],
  );
  const onLand = useCallback(() => {
    setStage("landed");
  }, []);
  const flightStatus =
    stage === "flight"
      ? {
          powered: "POWERED ASCENT",
          coast: telemetry.vy >= 0 ? "COASTING TO APOGEE" : "EJECTION DELAY",
          recovery: "PARACHUTE DESCENT",
          landed: "TOUCHDOWN",
        }[telemetry.phase]
      : STAGE_LABELS[stage];
  return (
    <main className="range-app">
      <div className="world">
        <Field
          rocket={rocket}
          motor={motor}
          conditions={conditions}
          stage={stage}
          camera={camera}
          trail={trail}
          onTelemetry={setTelemetry}
          onLand={onLand}
          onReady={() => setReady(true)}
          onError={setError}
          onThumbnail={onThumbnail}
        />
      </div>
      <header className="topbar">
        <a className="brand" href="/" aria-label="Rocket Range home">
          <span className="brand-mark">
            <RocketIcon size={22} />
          </span>
          <span>
            ROCKET<span className="brand-light">RANGE</span>
            <small>MODEL ROCKET FLIGHT SIMULATOR</small>
          </span>
        </a>
        <div className="location">
          <span className="location-line" />
          <span>
            CEDAR RIDGE<small>OPEN FLIGHT FIELD</small>
          </span>
        </div>
        <div className="header-actions">
          <span className="live-badge">
            <span />
            RANGE OPEN
          </span>
          <button
            className="icon-button"
            onClick={() => setHelpOpen(true)}
            aria-label="Flight guide"
          >
            <CircleHelp size={19} />
          </button>
          <button
            className="icon-button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Field settings"
          >
            <SlidersHorizontal size={19} />
          </button>
        </div>
      </header>
      <aside className="flight-bench">
        <div className="bench-heading">
          <div>
            <span className="eyebrow">PRE-FLIGHT</span>
            <h1>Your next launch.</h1>
          </div>
          <span className="flight-number">
            /{String(flightNumber).padStart(2, "0")}
          </span>
        </div>
        <div className="step-title">
          <span className="step-num">01</span>
          <h2>The rocket</h2>
          <button disabled={busy} onClick={() => setFleetOpen(true)}>
            Browse fleet <ArrowUpRight size={14} />
          </button>
        </div>
        <button
          className="selected-rocket"
          disabled={busy}
          onClick={() => setFleetOpen(true)}
          aria-label={`Selected rocket: ${rocket.name}. Browse fleet`}
        >
          <div className="rocket-card-grid" />
          <div className="rocket-preview">
            {thumbs[rocket.id] ? (
              <img src={thumbs[rocket.id]} alt={`${rocket.name} 3D model`} />
            ) : (
              <RocketIcon size={64} strokeWidth={1} />
            )}
          </div>
          <span className="series-tag">
            {rocket.family === "Scale fleet"
              ? "SCALE COLLECTION"
              : "ESTES CLASSICS"}
          </span>
          <span className="preview-label">
            {rocket.name}
            <small>{rocket.subtitle}</small>
          </span>
          <span className="preview-change">
            <ChevronDown size={16} />
          </span>
        </button>
        <div className="spec-strip">
          <div>
            <span>LENGTH</span>
            <strong>
              {fmt(rocket.length * 100, 1)}
              <small>cm</small>
            </strong>
          </div>
          <div>
            <span>DIAMETER</span>
            <strong>
              {fmt(rocket.diameter * 1000)}
              <small>mm</small>
            </strong>
          </div>
          <div>
            <span>DRY MASS</span>
            <strong>
              {fmt(rocket.mass * 1000)}
              <small>g</small>
            </strong>
          </div>
        </div>
        <div className="bench-divider" />
        <div className="step-title">
          <span className={"step-num " + (loaded ? "complete" : "")}>
            {loaded ? <Check size={12} /> : "02"}
          </span>
          <h2>The engine</h2>
          <span className="subtle">{motor.diameter} mm mount</span>
        </div>
        <div className="motor-grid">
          {rocket.motors.map((id) => {
            const m = getMotor(id);
            return (
              <button
                key={id}
                className={"motor-option " + (motorId === id ? "selected" : "")}
                disabled={busy || mounted}
                onClick={() => {
                  setMotorId(id);
                  setStage("rocket");
                }}
              >
                <span className="motor-code">{id}</span>
                <small>
                  {m.impulse} N·s <span> / </span> {m.delay}s delay
                </small>
                {id === rocket.recommended && (
                  <span
                    className="recommend-dot"
                    title="Recommended for this game"
                  />
                )}
              </button>
            );
          })}
        </div>
        <div className="estimate">
          <Gauge size={16} />
          <span>Estimated apogee</span>
          <strong>
            {fmt(prediction.apogee)} <small>m</small>
          </strong>
        </div>
        {stage === "rocket" && (
          <button
            className="secondary-action"
            onClick={() => {
              setStage("engine");
              if (sound) beep(880);
            }}
          >
            <PackageOpen size={16} /> Load {motor.id} engine{" "}
            <ChevronRight size={16} />
          </button>
        )}
        {loaded && (
          <div className="checkline">
            <Check size={14} /> {motor.id} seated · recovery packed
            {!busy && stage !== "landed" && (
              <button
                className="unload-button"
                onClick={() => {
                  setStage("rocket");
                  setCamera("orbit");
                }}
              >
                Unload
              </button>
            )}
          </div>
        )}
        <div className="bench-divider" />
        <div className="step-title">
          <span className={"step-num " + (mounted ? "complete" : "")}>
            {mounted ? <Check size={12} /> : "03"}
          </span>
          <h2>The launch pad</h2>
        </div>
        <div className="equipment-line">
          <span className="equipment-icon">
            <Radio size={20} />
          </span>
          <div>
            <strong>
              {motor.diameter === 29
                ? "Pro Series II style"
                : rocket.motors.some((m) => m.startsWith("E"))
                  ? "Porta-Pad E style"
                  : "Porta-Pad II style"}
            </strong>
            <span>
              {motor.diameter === 29
                ? "Pro Series II style"
                : rocket.motors.some((m) => m.startsWith("E"))
                  ? "E Controller style"
                  : "Electron Beam style"}{" "}
              controller
            </span>
          </div>
        </div>
        {stage === "engine" ? (
          <button
            className="secondary-action"
            onClick={() => {
              setStage("pad");
              setCamera("follow");
              if (sound) beep(760);
            }}
          >
            Place on launch pad <MoveUpRight size={16} />
          </button>
        ) : (
          <div className={"pad-status " + (mounted ? "ready" : "")}>
            <span />
            {mounted
              ? "Rocket mounted · igniter connected"
              : "Load an engine to prepare the pad"}
          </div>
        )}
        <div className="bench-footer">
          <span>{ROCKETS.length} ROCKETS IN THE HANGAR</span>
          <button onClick={() => setCreditsOpen(true)}>
            Models & credits <ArrowUpRight size={12} />
          </button>
        </div>
      </aside>
      <section className="field-info" aria-label="Field conditions">
        <span className="eyebrow">A GOOD DAY TO FLY</span>
        <div>
          <Sun size={21} />
          <strong>22°</strong>
          <span className="weather-divider" />
          <Wind size={18} />
          <span>
            {fmt(conditions.wind, 1)} m/s <small>W</small>
          </span>
        </div>
        <button onClick={() => setSettingsOpen(true)}>
          Field conditions <ChevronRight size={12} />
        </button>
      </section>
      <div className="scene-label">
        <span className="small-cross" />
        <span>
          PAD 01<small>{mounted ? "LAUNCH POSITION" : "WORKSHOP VIEW"}</small>
        </span>
      </div>
      <section className="telemetry" aria-label="Live flight telemetry">
        <div className="telemetry-heading">
          <span className="eyebrow">FLIGHT TELEMETRY</span>
          <Radio size={14} />
        </div>
        <div className="altitude">
          <span>ALTITUDE AGL</span>
          <strong>
            {fmt(telemetry.y)}
            <small>m</small>
          </strong>
        </div>
        <div className="telemetry-grid">
          <div>
            <span>VELOCITY</span>
            <strong>
              {fmt(telemetry.vy, 1)} <small>m/s</small>
            </strong>
          </div>
          <div>
            <span>FLIGHT TIME</span>
            <strong>
              {fmt(telemetry.t, 1)} <small>s</small>
            </strong>
          </div>
        </div>
        <div className="flight-phase">
          <span className={stage === "flight" ? "pulse" : ""} />
          {flightStatus}
        </div>
      </section>
      {(stage === "flight" || stage === "landed") && (
        <div className="flight-event" aria-live="polite">
          <span className="eyebrow">
            {rocket.name} · {motor.id}
          </span>
          <h2>
            {stage === "landed"
              ? "Back on Earth."
              : telemetry.phase === "recovery"
                ? "Enjoy the way down."
                : telemetry.phase === "coast"
                  ? "A moment of weightlessness."
                  : "We have liftoff."}
          </h2>
          <p>
            {stage === "landed"
              ? `${fmt(telemetry.apogee)} m apogee · ${fmt(Math.hypot(telemetry.x, telemetry.z))} m downrange`
              : telemetry.phase === "recovery"
                ? "Parachute deployed. Following the wind."
                : telemetry.phase === "coast"
                  ? "Motor burned out. Waiting for recovery ejection."
                  : "Follow your rocket all the way to apogee."}
          </p>
        </div>
      )}
      {stage === "countdown" && (
        <div className="countdown-overlay" aria-live="assertive">
          <span>RANGE CLEAR · IGNITION IN</span>
          <strong key={countdown}>{countdown}</strong>
          <button onClick={() => setStage("armed")}>
            Abort countdown <span>ESC</span>
          </button>
        </div>
      )}
      <div className="view-tools">
        <div className="camera-switch" role="group" aria-label="Camera view">
          {(
            [
              { id: "orbit", label: "Orbit", icon: Orbit },
              { id: "follow", label: "Follow", icon: Crosshair },
              { id: "ground", label: "Ground", icon: Eye },
              { id: "onboard", label: "Onboard", icon: RocketIcon },
            ] as const
          ).map((c) => (
            <button
              key={c.id}
              className={camera === c.id ? "active" : ""}
              onClick={() => setCamera(c.id)}
              aria-pressed={camera === c.id}
            >
              <c.icon size={16} />
              <span>{c.label}</span>
            </button>
          ))}
        </div>
        <div className="view-hint">
          <Mouse size={13} />
          <span>Drag to orbit</span>
          <span>·</span>
          <span>Scroll to zoom</span>
          <span className="keycap">C</span>
          <span>Camera</span>
        </div>
      </div>
      <div className="bottom-left-info">
        <span className="compass">
          N<ArrowUp size={16} />
        </span>
        <span>
          CEDAR RIDGE<small>38.82° N · 104.76° W</small>
        </span>
      </div>
      <section
        className={"launch-controller " + (armed ? "is-armed" : "")}
        aria-label="Launch controller"
      >
        <div className="controller-heading">
          <span>
            <Zap size={14} /> LAUNCH CONTROL
          </span>
          <button
            onClick={() => setSound(!sound)}
            aria-label={sound ? "Mute sound" : "Enable sound"}
          >
            {sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
        {stage === "landed" ? (
          <>
            <div className="recovered-title">
              <Flag size={18} />
              <strong>
                Flight {String(flightNumber).padStart(2, "0")} recovered
              </strong>
            </div>
            <button className="launch-button" onClick={reset}>
              <RotateCcw size={17} /> Prepare another flight
            </button>
          </>
        ) : stage === "flight" ? (
          <>
            <div className="flight-observation">
              <Radio size={17} />
              <strong>Flight in progress</strong>
              <span>OBSERVATION ONLY</span>
            </div>
            <div className="controller-foot">
              {telemetry.phase === "recovery"
                ? "Parachute open · recovery in progress"
                : "Tracking vehicle · radio link active"}
            </div>
          </>
        ) : (
          <>
            <div className="continuity">
              <span className={mounted ? "lit" : ""} />
              <span>
                {mounted ? "Continuity confirmed" : "Awaiting pad preparation"}
              </span>
              <KeyRound size={17} />
            </div>
            <button
              className={"launch-button " + (stage === "armed" ? "hot" : "")}
              disabled={
                !ready ||
                !!error ||
                ["rocket", "engine", "countdown"].includes(stage)
              }
              onClick={() => {
                if (stage === "pad") {
                  setStage("armed");
                  if (sound) beep(990, 0.12);
                } else launch();
              }}
            >
              {stage === "armed" ? (
                <>
                  <RocketIcon size={18} /> Launch rocket <span>SPACE</span>
                </>
              ) : stage === "countdown" ? (
                "Ignition sequence…"
              ) : (
                <>
                  <KeyRound size={17} /> Insert safety key
                </>
              )}
            </button>
            <div className="controller-foot">
              {stage === "armed" ? (
                <button onClick={() => setStage("pad")}>
                  Remove key & disarm
                </button>
              ) : (
                "Prepare your rocket, then arm the controller."
              )}
            </div>
          </>
        )}
      </section>
      {!ready && !error && (
        <div className="loading-field">
          <span className="loading-orbit">
            <RocketIcon size={26} />
          </span>
          <strong>Opening the range</strong>
          <span>Preparing the field and your fleet…</span>
        </div>
      )}
      {error && (
        <div className="loading-field error">
          <strong>The field couldn’t open</strong>
          <p>{error}</p>
          <button
            className="secondary-action"
            onClick={() => window.location.reload()}
          >
            Reload field
          </button>
        </div>
      )}
      <Dialog open={fleetOpen} onOpenChange={setFleetOpen}>
        <DialogContent className="fleet-dialog">
          <div className="modal-top">
            <span className="eyebrow">
              THE HANGAR / {ROCKETS.length} ROCKETS
            </span>
            <DialogTitle>Choose your next flight.</DialogTitle>
            <DialogDescription>
              Estes favorites and miniature icons of spaceflight.
            </DialogDescription>
          </div>
          <div
            className="fleet-tabs"
            role="group"
            aria-label="Rocket collections"
          >
            {(["All rockets", "Estes classics", "Scale fleet"] as const).map(
              (t) => (
                <button
                  className={tab === t ? "active" : ""}
                  key={t}
                  onClick={() => setTab(t)}
                >
                  {t}
                  <span>
                    {t === "All rockets"
                      ? ROCKETS.length
                      : ROCKETS.filter((r) => r.family === t).length}
                  </span>
                </button>
              ),
            )}
          </div>
          <div className="fleet-grid">
            {ROCKETS.filter(
              (r) => tab === "All rockets" || r.family === tab,
            ).map((r) => (
              <button
                className={
                  "fleet-card " + (rocketId === r.id ? "selected" : "")
                }
                key={r.id}
                onClick={() => chooseRocket(r)}
                disabled={busy}
              >
                <span className="fleet-card-index">
                  {String(ROCKETS.indexOf(r) + 1).padStart(2, "0")}
                </span>
                {rocketId === r.id && (
                  <span className="fleet-selected">
                    <Check size={13} />
                  </span>
                )}
                <div className="fleet-model">
                  {thumbs[r.id] ? (
                    <img src={thumbs[r.id]} alt={`${r.name} 3D model`} />
                  ) : (
                    <RocketIcon size={40} />
                  )}
                </div>
                <strong>{r.name}</strong>
                <small>
                  {fmt(r.length * 100, 1)} cm <span>·</span> {r.recommended}
                </small>
                <span className="fleet-family">
                  {r.family === "Scale fleet"
                    ? "SCALE TRIBUTE"
                    : "ESTES RECREATION"}
                </span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="range-dialog">
          <span className="eyebrow">MAKE IT YOUR FLIGHT</span>
          <DialogTitle>Field conditions</DialogTitle>
          <DialogDescription>
            Adjust the breeze and the launch rod before arming.
          </DialogDescription>
          <div className="setting-row">
            <label htmlFor="wind">Wind speed</label>
            <strong>{fmt(conditions.wind, 1)} m/s</strong>
          </div>
          <Slider
            id="wind"
            aria-label="Wind speed"
            min={0}
            max={6}
            step={0.5}
            value={[conditions.wind]}
            disabled={busy || stage === "armed"}
            onValueChange={(v) => setConditions((c) => ({ ...c, wind: v[0] }))}
          />
          <div className="slider-endpoints">
            <span>Still air</span>
            <span>Steady breeze</span>
          </div>
          <div className="setting-row">
            <label htmlFor="angle">Launch rod tilt</label>
            <strong>{conditions.angle}°</strong>
          </div>
          <Slider
            id="angle"
            aria-label="Launch rod tilt"
            min={0}
            max={10}
            step={1}
            value={[conditions.angle]}
            disabled={busy || stage === "armed"}
            onValueChange={(v) => setConditions((c) => ({ ...c, angle: v[0] }))}
          />
          <div className="slider-endpoints">
            <span>Vertical</span>
            <span>Downwind</span>
          </div>
          <div className="setting-row">
            <label htmlFor="flight-trail">Show flight trail</label>
            <Switch
              id="flight-trail"
              checked={trail}
              onCheckedChange={setTrail}
            />
          </div>
          <div className="setting-row">
            <label htmlFor="flight-sound">Launch sounds</label>
            <Switch
              id="flight-sound"
              checked={sound}
              onCheckedChange={setSound}
            />
          </div>
          <p className="settings-note">
            Flight runs automatically after ignition. Wind, stability, motor
            thrust, and recovery determine its path.
          </p>
        </DialogContent>
      </Dialog>
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="range-dialog">
          <span className="eyebrow">YOUR FIRST FLIGHT</span>
          <DialogTitle>From the bench to the sky.</DialogTitle>
          <DialogDescription>
            Everything you need for a flight at Rocket Range.
          </DialogDescription>
          <ol className="guide-list">
            <li>
              <span>01</span>
              <div>
                <strong>Pick your rocket</strong>
                <p>
                  Open the hangar to explore the Estes classics and scale fleet.
                </p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <strong>Load an engine</strong>
                <p>
                  Choose a compatible motor. The letter is its impulse class;
                  the last number is the ejection delay after burnout.
                </p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <strong>Prepare the pad</strong>
                <p>
                  Place the rocket on the rod, then insert the controller’s
                  safety key.
                </p>
              </div>
            </li>
            <li>
              <span>04</span>
              <div>
                <strong>Launch and recover</strong>
                <p>
                  Launch with the button or Space. Follow the flight through
                  burnout, ejection, and parachute landing.
                </p>
              </div>
            </li>
          </ol>
          <div className="shortcut-grid">
            <span>
              <kbd>C</kbd> Change camera
            </span>
            <span>
              <kbd>SPACE</kbd> Launch
            </span>
            <span>
              <kbd>ESC</kbd> Abort countdown
            </span>
            <span>
              <Mouse size={16} /> Drag / scroll to explore
            </span>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={creditsOpen} onOpenChange={setCreditsOpen}>
        <DialogContent className="range-dialog credits-dialog">
          <span className="eyebrow">BUILT FOR THE LOVE OF ROCKETRY</span>
          <DialogTitle>Models & credits</DialogTitle>
          <DialogDescription>
            Asset sources and the difference between a model and a recreation.
          </DialogDescription>
          <p>
            <strong>Saturn V & Mercury capsules</strong>
            <br />
            NASA 3D Resources. The Mercury capsules sit on original Redstone and
            Atlas booster geometry.
          </p>
          <p>
            <strong>Falcon 9</strong>
            <br />
            Fac-tory-o, via Wikimedia Commons, CC BY-SA 4.0. Adapted for browser
            rendering.
          </p>
          <p>
            <strong>Estes fleet & launch equipment</strong>
            <br />
            Original 3D recreations using manufacturer dimensions and product
            references. The pad and controller are Estes-style recreations;
            official downloadable meshes were not available.
          </p>
          <p>
            Scale rockets use virtual hobby-model dimensions, engines, and
            parachutes. No affiliation with or endorsement by Estes, NASA, or
            SpaceX.
          </p>
          <div className="credit-links">
            <a
              href="https://github.com/nasa/NASA-3D-Resources"
              target="_blank"
              rel="noreferrer"
            >
              NASA assets <ArrowUpRight size={14} />
            </a>
            <a
              href="https://creativecommons.org/licenses/by-sa/4.0/"
              target="_blank"
              rel="noreferrer"
            >
              Falcon mesh license · CC BY-SA 4.0 <ArrowUpRight size={14} />
            </a>
            <a href="/models/falcon-9.glb" download>
              Download adapted Falcon 9 mesh <ArrowDown size={14} />
            </a>
            <a
              href="https://commons.wikimedia.org/wiki/File:Falcon_9.stl"
              target="_blank"
              rel="noreferrer"
            >
              Falcon 9 source <ArrowUpRight size={14} />
            </a>
            <a href={rocket.source} target="_blank" rel="noreferrer">
              Selected rocket reference <ArrowUpRight size={14} />
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
