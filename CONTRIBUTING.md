# Contributing to Rocket Range

Read [AGENTS.md](AGENTS.md) and the platform guide before making changes. The browser application is preserved under `web/`; native iPhone/iPad work lives under `ios/`.

For browser checks:

```sh
cd web
npm ci
npm run typecheck
npm test
npm run build
```

For native setup and checks, see [ios/README.md](ios/README.md).

From the repository root, run `node web/scripts/check-public-repo.mjs` and `gitleaks git --redact --log-opts=--all .` before pushing. Use a GitHub noreply commit identity. Do not commit credentials, personal paths, signing identities, team IDs, or generated build output.

Keep changes focused, retain asset provenance, and distinguish numerical/build checks from device playthroughs and listening reviews. No flight controls may be added after Launch; cameras and display settings affect presentation only. Keep web and native source independently runnable, and do not add hosting or repository automation.
