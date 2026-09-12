# Security

Rocket Range is a client-side simulator. It does not require API keys, sign-in, a database, or server-side secrets. Development and preview servers bind to the local loopback interface by default.

Please do not post credentials or sensitive personal information in public issues. Use GitHub's **Security → Report a vulnerability** when private reporting is available for this repository. If it is unavailable, open a minimal issue asking for a private reporting channel without disclosing exploit details or sensitive values.

Run `npm run check:privacy` and Gitleaks before publishing. If a real credential is committed, revoke or rotate it before rewriting history. Rewriting this repository does not remove previously shared copies from other hosts or other people's clones.
