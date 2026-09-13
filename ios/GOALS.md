# Rocket Range for iPhone and iPad

## Product goal

Build a tactile, convincing model-rocketry game for iPhone and iPad using Unity 6 and the Universal Render Pipeline. Preserve the current browser game independently in `../web/`. Native work is local development only; this task does not authorize App Store submission, hosting, or repository automation.

The intended experience is selecting and preparing a miniature hobby rocket, pressing a physical-looking launch controller, observing an autonomous flight, and recovering the rocket. Falcon 9, Saturn V, Mercury-Redstone, and Mercury-Atlas remain scale hobby tributes with parachutes. There is no orbital staging or propulsive landing.

## Non-negotiable behavior

- Carry forward all 16 rocket definitions, compatible motors, motor provenance, and the realism assumptions documented in `../web/SIMULATION.md`.
- Require engine loading, pad placement, and controller arming before Launch.
- Freeze configuration at the button press, then apply a uniformly random 0.25–1 second ignition delay.
- Flight has no steering, throttle, pause, speed changes, mid-flight reset, or configuration edits. Presentation controls remain available.
- Ground view stays Ground at launch. Follow is stable under recovery motion. Onboard moves and rotates with the airframe.
- Motor audio remains a small, dry hobby-motor hiss/crackle. It follows the thrust curve and stops at burnout.
- Preserve real outcomes, including unstable flights, failed recovery, and hard landings.
- Preserve all third-party asset credits and distinguish recreations from imported assets.

## Fidelity goals

1. Consistent close-up rocket and equipment materials: paper seams, decals, plastic, metal, paint, and soot.
2. A believable grassy club field with layered foliage, readable skies, wind animation, soft shadows, and long-distance scenery.
3. Touch-first preparation with direct equipment manipulation, clear feedback, and optional haptics on supported devices.
4. Scaled ignition smoke, wind-driven trails, restrained flame and heat effects, and distance-aware sound.
5. Convincing nose separation, cord extension, canopy inflation, pendulum motion, and touchdown.
6. A clear iPad landscape interface, an adapted iPhone layout, and camera gestures that never alter flight.
7. Sustained 60 fps on an agreed device baseline with adjustable visual quality. This is a target, not a measured claim. Validate heat and battery behavior on real hardware before choosing final quality defaults.

## Delivery milestones

### 1. Preserve and isolate the browser game

Move its source, dependencies, assets, tests, and documentation to `web/`. Update paths, retain working local development, and rerun browser type, test, build, and repository privacy checks.

### 2. Native playable foundation — current work

Create a reproducible Unity 6/URP project under `ios/`. Implement the full selection → motor → pad → arm → launch → recovery → relaunch loop, touch-friendly UI, all four cameras, sourced motor data, the existing physics model, and procedural motor sound. Reuse licensed rocket assets where supported. Provide local editor and iOS build instructions and meaningful automated flight checks.

Acceptance: project compiles; all catalog combinations and key flight rules are checked; a runnable scene is included; available local build/playthrough evidence is recorded accurately.

### 3. Polish one complete launch

Choose one Estes rocket as the visual benchmark. Refine its model, equipment, field, hands-on preparation, smoke, audio, canopy behavior, and camera feel. Validate the complete experience on an actual iPhone and iPad before expanding the same quality across the fleet.

### 4. Fleet and simulation refinement

Bring the remaining airframes to the same artistic standard. Add better measured aerodynamic inputs, full three-axis attitude, coupled recovery bodies, and structural outcomes deliberately, with comparison tests and documented assumptions.

### 5. Device quality and release readiness

Measure sustained frame pacing, memory, thermal behavior, battery use, accessibility, safe areas, lifecycle transitions, and touch ergonomics. Signing and distribution choices require a later explicit release request; no personal signing configuration belongs in the repository.

## Work log

- Repository migration started. Existing web gameplay and documentation will remain independently runnable.
- Unity 6000.3.11f1 and Xcode are available locally. Checking iOS Build Support and editor compilation before claiming native build readiness.

- Browser isolation complete: TypeScript, all 19 browser tests, production build, and privacy check pass from `web/`; local Vite server remains available.
- Native flight core implemented in C# with no Unity engine references. Nine Unity Edit Mode tests pass, including comparison of 82 calm/windy catalog flights against the browser reference to within 0.00002 in the checked SI metrics. Compatibility, immutable launch capture, ignition limits, recovery failures, and elapsed-time catch-up are covered.
- Unity iOS Build Support is installed. Native visual scene and touch interface are in progress.
