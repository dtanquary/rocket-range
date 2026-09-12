# Contributing to Rocket Range

Use Node.js 22.13 or newer (`nvm use` selects Node 22), then run `npm ci` and `npm run dev`. The application requires no account, credentials, or environment variables.

Before opening a pull request, run:

```sh
npm run typecheck
npm test
npm run build
npm run check:privacy
```

Use a GitHub noreply email for your commits. The privacy check inspects commit metadata as well as current and historical files. Do not include credentials, personal machine paths, private deployment IDs, or local configuration. If Gitleaks is installed, run `gitleaks git --redact --log-opts=--all .` before pushing.

Read [AGENTS.md](AGENTS.md) for architecture and working conventions, [SIMULATION.md](SIMULATION.md) for physics assumptions, and [ASSETS.md](ASSETS.md) before adding models or motor data. Keep third-party attribution and licenses intact. Avoid assets whose redistribution rights are unclear.

Keep changes focused and describe what changed and how you checked it. For graphics or sound changes, distinguish numerical checks from a browser playthrough or listening review. Never add flight controls after Launch is pressed: camera and display changes affect presentation only.

Report bugs with the rocket, engine, field settings, browser/version, camera mode, and steps to reproduce. Remove personal information from logs before sharing them.
