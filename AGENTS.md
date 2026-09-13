# Rocket Range — repository agreement

## Working rules

- Commit early and often. Make a focused commit when a coherent slice is complete. This is an explicit user requirement.
- Preserve the browser implementation under `web/`. The user explicitly requires isolation, not deletion or replacement.
- Keep improving this guide and each platform guide as decisions become established.
- Read `web/AGENTS.md` before browser changes and `ios/AGENTS.md` before native changes.
- Run locally. GitHub is for source sharing only. Do not add hosting, deployment integrations, GitHub Actions, Dependabot, or other repository automation without an explicit user request.
- Preserve user edits. Keep local credentials, personal account paths, signing identities, team IDs, and build output out of Git.
- Use a GitHub noreply contributor email or the repository's neutral contributor identity, never a personal email. Run `node web/scripts/check-public-repo.mjs` from the repository root and Gitleaks before pushing.
- Original code is MIT. Third-party assets retain their own terms. Preserve asset attribution when copying or converting models; an Estes recreation is not an official imported Estes asset.

## Layout

- `web/`: the complete Vite, React, TypeScript, and Three.js browser game, including its documentation, screenshots, assets, motor data, and tests.
- `ios/`: the native Unity game for iPhone and iPad. Read `ios/GOALS.md` for goals, milestones, and evidence of completion.
- Root documentation describes the repository and agreements that apply to both platforms.

## Shared product rules

Select a compatible motor, load it, mount the rocket, insert the safety key, and press Launch. Capture every physical input immediately, wait a random 0.25–1 second igniter delay, then let the rocket fly automatically. No steering, throttle, pause, time scaling, physical configuration changes, or mid-flight reset. Camera, sound, and display controls affect presentation only. Preserve the selected camera at launch. Follow must stay stable during descent and Onboard must move with the airframe.

Flight realism includes sourced thrust curves, impulse-based propellant depletion, wind, stability, passive attitude, launch rod constraints, timed ejection, parachute inflation, and touchdown. Do not force every configuration to recover successfully. Port existing numerical behavior before extending it, and identify approximate inputs explicitly. `web/SIMULATION.md` records the existing assumptions.

## Validation

Keep numerical tests, build checks, simulator/device playthroughs, and visual/audio review distinct. Never claim a device playthrough from source or build checks alone. Do not label a performance goal as achieved without sustained measurements on the target hardware. Record any platform tooling blockers and continue useful work that does not depend on them.
