# iOS / iPadOS development

Read `../AGENTS.md`, `GOALS.md`, and `../web/SIMULATION.md` first.

- Use Unity 6000.3.11f1 with URP for the native game. Keep the project self-contained and commit deterministic asset metadata and package locks.
- Keep the numerical flight core independent of Unity scene, rendering, UI, and audio state. Use double precision and a fixed 120 Hz step. Capture immutable launch inputs.
- Generate portable catalog data from the established web catalog; record provenance and make regeneration explicit. Do not silently drift copied motor data.
- Build a touch-first landscape experience for iPhone and iPad. Respect safe areas; camera gestures must not steal touches from controls.
- Keep generated Xcode projects, signing settings, Library/Temp/Logs, user preferences, and machine paths out of Git. No Apple development team or Unity service project IDs in tracked configuration.
- A local build command is permitted. Do not add hosting, cloud builds, GitHub Actions, or deployment automation.
- Test compatibility, ejection timing, drift, stability, immutable launches, camera independence, and finite catalog outcomes. Compare the port against saved browser reference results before changing the physical model.
- Record actual editor/build/device verification in `GOALS.md`. Keep future fidelity goals separate from completed implementation.
- Use SMAA with a single render-target sample for the current Simulator baseline. HDR MSAA produced render-pass attachment errors on the tested iOS Simulator; validate any quality change on both Simulator and hardware.
- Keep procedural mesh normals outward-facing and destroy only runtime-owned meshes/materials. Imported assets and shared paint materials must remain reusable across fleet selections.
