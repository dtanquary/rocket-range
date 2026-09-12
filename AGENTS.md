# Rocket Range — agent guide

## Working agreement

- Commit early and often. Create a focused Git commit whenever a meaningful, coherent slice is complete; do not leave the entire task in one final commit. This is an explicit user rule.
- Continue improving this guide as architecture, workflows, and project decisions become established.
- Preserve the user's changes. Inspect Git status before edits, use focused commits, and never reset unrelated work.
- Build the actual playable 3D simulator. The launch field and rocket preparation are the primary interface, not a marketing page.
- Ask concise clarifying questions when a decision materially changes the experience, but continue independent work while awaiting answers.
- Do not claim an asset is an official Estes model when it is a recreation. Keep imported assets, reference-derived geometry, and original geometry clearly attributed.
- Original project code uses the MIT License. Preserve third-party notices and the adapted Falcon mesh's CC BY-SA 4.0 terms; the code license does not supersede asset licenses.

## Product scope

A high-fidelity browser model rocket game: select a rocket, fit a compatible Estes-style motor, move to the pad, arm the controller, launch, and follow parachute recovery. Include a varied Estes fleet and miniature Falcon 9, Saturn V, Mercury-Redstone, and Mercury-Atlas. These scale tributes fly as hobby rockets; they are not orbital-launch simulations.

The user explicitly prioritizes realism: engine compatibility, wind, stability, and recovery physics. Desktop browsers with mouse and keyboard are the primary target; preserve the responsive fallback without letting mobile constraints limit desktop controls. Simulation output remains an approximation, not real-world flight certification.

## Architecture

- `src/main.tsx` and `index.html`: Vite/React entry points.
- `src/styles.css`: application styling and theme tokens.
- `components/rocket-range.tsx`: React application, setup workflow, fleet selection, and flight UI.
- `components/rocket/`: browser-only 3D integration.
- `lib/rocket/catalog.ts`: rocket dimensions, visual parameters, engine compatibility, and estimated dry CG.
- `lib/rocket/motor-data.json`: sourced motor samples and provenance; update deliberately.
- `lib/rocket/physics.ts`: renderer-independent flight integration and prediction. SI units throughout.
- `lib/rocket/models.ts`: mesh construction, imported model loading, equipment, recovery geometry, and thumbnail rendering.
- `lib/rocket/environment.ts`: 3D field, lighting, sky, vegetation, and launch-site details.
- `lib/rocket/audio.ts`: procedural hobby-motor sound and browser audio resource lifecycle. Sound follows the motor curve; spatialization is presentation only.
- `lib/rocket/cameras.ts`: Follow camera boom and airframe-mounted Onboard camera transforms.
- `public/models/`: locally served assets. Keep source, creator, license, and modifications documented in `ASSETS.md`.
- `tests/`: meaningful behavioral checks, especially flight/recovery invariants and workflow transitions.

Use React and TypeScript with Three.js. Keep high-frequency simulation/render state outside React; publish telemetry at a limited rate. Use a fixed physics timestep so simulation speed and display refresh do not change flight results. Dispose Three.js resources and event listeners during teardown. Create browser resources inside effects or user gestures, and clean them up during React Strict Mode remounts.

## Flight rules

- Engines must be from the selected rocket's compatible list. Changing a rocket clears preparation and resets its recommended engine.
- Require engine loading, pad placement, and controller arming before ignition.
- Pressing Launch captures the configuration and energizes the igniter. The user requests a random 0.25–1 second delay before ignition. Lock physical setup throughout that delay and flight; repeated launch inputs must not schedule additional ignitions.
- Ignition must preserve the user's selected camera mode, whether triggered by the launch button or Space. Do not automatically switch to Follow at launch.
- Thrust ends at burnout. Ejection delay starts at burnout, not ignition or apogee.
- Gravity, changing propellant mass, air-relative drag, wind drift, and parachute inflation affect flight.
- Landed altitude must be zero. Flight reports must use actual recorded telemetry.
- Distinguish approximate motor curves and virtual scale-model parameters from verified manufacturer specifications.

## Validation and development

- Install using the existing lockfile; add dependencies only for required capabilities.
- `npm run dev`: local development at the URL printed by the server.
- `npm run build`: static production build in `dist/`.
- `npm run check:privacy`: inspect working files, all reachable history, and contributor email metadata before pushing.
- `npx tsc --noEmit`: TypeScript validation.
- Add targeted behavioral tests for complex simulation changes; do not write tests that merely restate UI markup.
- When browser testing is requested, verify selection → engine → pad → arm → launch → recovery → relaunch, camera controls, configuration locking, and at least one small viewport. Check console errors and asset failures.
- Never commit `.env` files, credentials, dependency folders, build output, or downloaded assets with unclear redistribution rights.

## Local development and publishing

Run the app locally during development. The source repository is prepared for public GitHub sharing; pushing source does not authorize deploying the app to a hosting service. Continue making focused Git commits.

This is a standalone Vite/React application with no account, secret, or hosting-platform requirement. Never commit private deployment metadata, credentials, local account paths, or personal email addresses. Use a GitHub noreply identity for contributions. Run the privacy check and Gitleaks before publishing, including after any history rewrite.

## Established implementation details

- `components/rocket/field.tsx` owns the Three.js lifecycle, fixed-step simulation accumulator, camera updates, smoke particle pool, trajectory buffer, and telemetry delivery. React receives updates at roughly 13 Hz.
- `npm test` runs Node's test runner through `tsx`; it covers all offered rocket/motor combinations in calm and maximum wind, impulse integration, ejection timing, descent speed, wind drift, and reset behavior.
- `npm run typecheck` runs TypeScript without emitting application files.
- NASA Mercury assets contain capsules, not full vehicles. Preserve the original booster/escape-tower assembly around them. The complete Saturn V and Falcon assets use the imported-mesh recovery split.
- Original imported material and geometry resources can be shared by clones. Do not dispose a shared resource while another visible model still uses it. Include retired scene objects in teardown.
- Keep canopy materials consolidated into two geometry groups, grass instanced, smoke pooled, and telemetry throttled to avoid avoidable draw calls or React work.
- Use the sky's single scattered cloud layer; do not stack broad translucent cloud sheets over it. Preserve clear gaps for tracking small rockets.
- Engine audio should be a small, dry hiss/crackle, without cinematic bass or reverberation. Mute must affect an active motor immediately, and dispose audio resources on teardown.
- `public/models/ATTRIBUTION.md` records the full asset audit. Falcon mesh derivatives remain CC BY-SA 4.0 and must keep an accessible attribution/license link.
- No database, authentication customization, or external APIs are required for the game. Do not add them without a product requirement.
- Do not describe source checks or numerical tests as a successful browser playthrough; report exactly which validation was performed.

## Autonomous flight — explicit user requirement

All flight decisions happen during preparation. After pressing Launch, users observe the rocket; do not add steering, throttle, pause, time scaling, mid-flight reset, or changes to engine, ballast, wind, or recovery. Camera, sound, and display controls may change presentation only. Freeze the launch configuration when the button is pressed so presentation changes cannot affect physics. Apply a random 0.25–1 second igniter delay, then start motor audio and physical flight. No countdown/abort control is exposed. Desktop mouse and keyboard are the primary interface. The user has no additional must-have models or field requirements.

Follow camera position and aim must share the same translating anchor: smoothing only the camera position causes angular shake during recovery. Smooth boom/framing changes and include the canopy in recovery framing. Onboard position, view direction, and roll are attached to the rendered airframe. Reset the camera up vector when leaving Onboard so other views retain their horizon.

## Realism model and validation

- Read `SIMULATION.md` before changing physics assumptions. Document estimated properties as estimates. Do not present CG, canopy strength, or the simplified aerodynamic model as measured/certified.
- Motor mass depletion follows integrated impulse, not a linear timer. Preserve exact source curve samples and per-motor provenance.
- `flightConfiguration()` checks mount diameter, length, and engine variant, then clones and freezes every flight input when Launch is pressed. The field integrates against this snapshot after ignition until touchdown.
- `FlightState.axis` is the simulated pitch/yaw attitude. The renderer must use this, not point the rocket along its velocity or invent weathercock angles.
- Wind bearings use meteorological FROM directions. Rod bearing uses compass direction toward which the rod leans. North is -Z and east is +X.
- A fixed-step accumulator catches up with elapsed time after a delayed display frame. Never discard physics time to maintain graphics FPS.
- Tests cover compatibility, rod confinement, ballast/CG movement, restoring moments, wind symmetry, overload/late-ejection failures, launch snapshot isolation, and finite outcomes at the UI limits. Do not force every setup to recover successfully.
