# Rocket Range

A browser 3D model rocket field built with React, TypeScript, and Three.js. Prepare an Estes-style motor, place a rocket on the launch pad, insert the controller key, and follow the flight through burnout and parachute recovery.

## Run locally

```sh
npm ci
npm run dev
```

Open the URL printed by the development server (normally http://localhost:5173).

Development is local-only for now. Do not push or deploy to hosting unless explicitly requested.

```sh
npm test
npm run typecheck
npm run build
```

## The fleet

**Estes recreations:** Alpha III, Big Bertha, Baby Bertha, Big Daddy, Der Red Max, Mean Machine, Patriot M-104, Executioner, Cherokee-E, Bull Pup 12D, Red Nova, and Super Big Bertha.

**Scale collection:** Falcon 9, Saturn V, Mercury-Redstone, and Mercury-Atlas. These are miniature hobby rockets with parachute recovery. They do not reproduce orbital launch staging or propulsive landings.

NASA supplies the complete Saturn V and the Mercury capsules. The Falcon mesh is adapted from Fac-tory-o’s CC BY-SA model. Estes airframes, Mercury boosters, launch pads, and controllers are original parametric recreations, because reusable stock Estes meshes were not available. See [ASSETS.md](ASSETS.md) for source and licensing details.

## Controls

1. Browse the fleet and select a rocket.
2. Select and load a compatible engine. The estimate updates with the engine and field conditions.
3. Place the rocket on the pad and insert the safety key.
4. Press Launch or Space to energize the igniter. The setup locks immediately; the motor ignites after a random 0.25–1 second delay and the flight is automatic.
5. Use Orbit, Follow, Ground, or Onboard views. C cycles cameras. Drag and scroll in Orbit.
6. During flight, watch the result. Camera, sound, and trajectory display controls affect presentation only; there are no flight inputs, pause, or speed controls.
7. After touchdown, prepare another flight. Unload a prepared rocket to change its engine.

Wind and launch rod tilt are adjustable before arming. Sound and trajectory display can be toggled at any time. Smaller screens place the preparation bench below the field.

## Simulation model

Fixed 120 Hz integration in SI units. Flight uses sourced thrust samples, impulse-dependent propellant depletion, density-dependent drag, a height-dependent wind profile with repeatable gusts, launch rod constraints, estimated CP/CG stability, passive pitch/yaw response, ejection after burnout, canopy inflation, and estimated opening-load limits. Late ejection, unstable airframes, and overloaded parachutes can produce unsuccessful recoveries. The simulation records rod-exit speed, deployment airspeed, opening force, and impact speed as well as altitude and drift.

The launch button captures an immutable configuration before the igniter delay. Physics begins at ignition and advances using elapsed time and a fixed timestep; changing cameras cannot change the trajectory. Desktop mouse/keyboard are the primary controls. Before arming, configure wind speed/direction, gust amplitude, rod length/tilt/bearing, and nose ballast.

Motor sound is synthesized locally from band-limited noise, fine crackle, and a brief ignition snap. Its envelope follows the selected motor's thrust curve and stops at burnout. The sound is deliberately small and dry, without cinematic bass/reverb. Camera-relative spatial audio fades and loses high frequencies with distance; mute also works during a burn. No audio files are downloaded. This is sound design, not calibrated acoustic output.

The sky uses a single scattered cloud layer with clear gaps. Reduced haze and a 6 km terrain width extend field visibility. Follow uses a shared moving anchor for its position and aim, with wider recovery framing. Onboard is an aft-looking side camera mounted to the rocket's position and attitude. Ground and Orbit retain their existing behavior.

Motor samples come from [ThrustCurve](https://www.thrustcurve.org/info/api.html), including certification-derived and contributed data. The per-motor provenance is recorded in `lib/rocket/motor-data.json` and linked in the flight bench. Thrust impulse is integrated from the supplied curve, not normalized to the advertised impulse class. Nominal delay seconds are used; batch-to-batch motor variation is not simulated.

This is a realism-oriented approximation, not an engineering validation tool. CG, drag, inertia, damping, fin effects, and canopy strength are estimated. The nose-and-fin CP model uses a small-angle Barrowman approximation without full body transitions or canard interactions; pitch/yaw are modeled but roll is omitted. Scale rockets use virtual mounts and clear stabilizing fins where needed. Ground scenery has no collision model. See [SIMULATION.md](SIMULATION.md) for the assumptions and references.

## Project guide

Read [AGENTS.md](AGENTS.md) before editing. Commit early and often, keep asset provenance explicit, and extend targeted physics tests when changing flight behavior.

The checked-in Sites project configuration is retained for potential future publishing. Local development does not require a deployment.
