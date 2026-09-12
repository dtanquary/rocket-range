# Rocket Range

A browser 3D model rocket field built with React, TypeScript, and Three.js. Prepare an Estes-style motor, place a rocket on the launch pad, insert the controller key, and follow the flight through burnout and parachute recovery.

## Run locally

```sh
npm ci
npm run dev
```

Open the URL printed by the development server (normally http://localhost:5173).

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
4. Launch with the button or Space. Escape aborts the countdown.
5. Use Orbit, Follow, Ground, or Onboard views. C cycles cameras. Drag and scroll in Orbit.
6. During flight, Space pauses; the 1×, 3×, and 8× controls change simulation speed.
7. After touchdown, prepare another flight. Unload a prepared rocket to change its engine.

Wind and launch rod tilt are adjustable before arming. Sound and trajectory display can be toggled at any time. Smaller screens place the preparation bench below the field.

## Simulation model

Fixed 120 Hz integration in SI units with variable propellant mass, approximate impulse-normalized thrust curves, altitude-dependent air density, air-relative drag, gravity, a limited weathercock response, timed ejection after burnout, canopy inflation, and wind drift. Display refresh and simulation speed do not change the physics timestep. The game reports measured altitude, velocity, flight time, peak altitude, and downrange distance.

This is an approachable game model, not OpenRocket, a six-degree-of-freedom flight solver, or real-world launch guidance. Motor curves and drag coefficients are approximate. Scale vehicle mass and recovery systems are virtual model parameters. Ground outside the playable field and field props are visual scenery, not collision obstacles.

## Project guide

Read [AGENTS.md](AGENTS.md) before editing. Commit early and often, keep asset provenance explicit, and extend targeted physics tests when changing flight behavior.

The checked-in Sites project configuration identifies the private hosted app. Do not create another Site for this checkout.
