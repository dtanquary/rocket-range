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

- Native scene now includes the procedural field and launch equipment, all 16 rocket choices, four imported GLBs with recovery splitting, engine/setup controls, four cameras, automatic flight, and procedural motor audio. Twelve Unity Edit Mode tests pass, including camera attachment/descent stability and motor PCM checks. iOS Simulator export and visual playthrough are being checked next.

- Native foundation verification complete for this implementation slice: all 14 Unity Edit Mode tests pass, including the 82 browser-reference flights, outward-facing procedural mesh normals, initial orbit elevation, bundled model imports, camera behavior, and motor PCM. The catalog exporter confirms the native copy matches all 16 rockets and 12 motor variants.
- Unity successfully exported an ARM64 iOS Simulator project, and Xcode 27 beta compiled its Debug app with signing disabled. The app was installed and launched on the iPad Pro 13-inch (M5), iOS 27 Simulator. Initial HDR multisample render-pass errors were corrected by using one sample with SMAA; subsequent startup logs contain no application exceptions or those render-pass errors. Simulator texture-decompression and engine shadow-depth fallback warnings remain.
- Visual and touch playthrough remain unverified: the UI automation connection to Xcode beta's Device Hub repeatedly timed out. Compilation, numerical tests, and startup logs do not establish visual quality or a complete interactive playthrough. No physical iPhone/iPad, sustained frame-rate, thermal, accessibility, or listening review has been completed.
- Next: complete a hands-on native playthrough, then polish one Estes launch as the visual benchmark. The current field, equipment, interface, smoke, and recovery visuals establish the workflow; detailed materials, direct equipment manipulation, layered clouds, flame/heat effects, haptics, and coupled recovery bodies remain fidelity work.

### Local testing and first fidelity pass

- Retried Device Hub by bundle ID, exact app path, a fresh UI session, and opening it through Finder. Native UI attachment still returns `timeoutReached`; Finder attachment succeeds. The user confirmed that Device Hub and Rocket Range on the booted iPad are visible and responsive manually. This narrows the blocker to the automated UI connection; it does not establish the cause of that connection failure.
- Built and launched a native Mac preview of the same scene. Screenshots exposed washed-out default button styling, excessive ground-texture scale, and a uniformly plain bench/sky. Automated clicks did not reach the intended controls; temporary event logging showed a mismatch between requested click locations and Unity's received pointer locations. Removed that instrumentation and left the working input implementation unchanged. A full automated launch playthrough remains unverified.
- First polish pass: explicit UI Toolkit button styling and narrower engine cards, unobtrusive scrollbars, a red armed launch button, finer grass/earth texture, weathered tabletop planks and screws, high sparse procedural clouds with wind drift, reduced shadow bias, and a removable controller key/continuity lamp that follows preparation state. All 14 native tests still pass. Updated player builds and screenshot review are in progress.
- Polish verification: Mac and ARM64 Simulator player builds succeed; Xcode's unsigned Simulator build succeeds. Reviewed the updated Mac startup screenshot: button styling is readable, engine options fit two columns, and the bench grain/plank gaps are visible. The updated iPad app was installed and launched. Full-flight cloud readability and equipment animation, touch gestures, recovery, and listening still need the controlled playthrough in [TESTING.md](TESTING.md).
- Enabled a resizable window for the local Mac preview in player settings and the configuration script. Rebuilt and launched it, then verified the native window zoom action enlarges the window and the interface adapts. Left the enlarged game open for manual testing.
- Fixed Orbit remaining at the pad after launch. The native camera explicitly replaced the airframe target with the pad during flight; removed that override. A regression test first failed at ignition, then passed through simulated ascent, recovery, and landing with the user's orbit offset/angle preserved and drag/zoom still available. All 15 native tests pass. Rebuilt and reopened the resizable Mac app for manual flight review. The regression test now covers the flight lifecycle that the original Orbit startup check missed.
