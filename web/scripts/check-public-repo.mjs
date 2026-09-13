import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";

// Resolve the repository root even when invoked from a nested platform folder.
process.chdir(execFileSync("git", ["rev-parse", "--show-toplevel"]).toString().trim());

const git = (...args) =>
  execFileSync("git", args, { maxBuffer: 128 * 1024 * 1024 });
const findings = new Set();
const patterns = [
  ["private hosting identifier", /appg(?:prj|ver|dep)_[a-z0-9_~]+/i],
  [
    "private hosting URL",
    /(?:https?:\/\/)?[a-z0-9.-]+\.(?:chatgpt|chatgpt-team)\.site\b/i,
  ],
  ["local account path", /\/(?:Users|home)\/[a-z0-9_.-]+\//i],
  ["private development identity", /[a-z0-9._%+-]+@sites\.test\b/i],
  ["embedded URL credential", /https?:\/\/[^\s/:]+:[^\s/@]+@/i],
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
];
const privatePath =
  /(^|\/)(?:\.env[^/]*|\.openai|\.aws|\.ssh|\.git-credentials|\.sites-runtime)(\/|$)/;
function scan(data, label) {
  for (const [kind, pattern] of patterns) {
    if (pattern.test(data)) findings.add(`${label}: ${kind}`);
  }
}

// Check the working copy too, so edits can be inspected before making a commit.
const files = git(
  "ls-files",
  "--cached",
  "--others",
  "--exclude-standard",
  "-z",
)
  .toString()
  .split("\0")
  .filter(Boolean);
for (const file of files) {
  if (!existsSync(file)) continue;
  if (privatePath.test(file))
    findings.add(`${file}: private configuration path`);
  scan(readFileSync(file).toString("latin1"), file);
}

// Every reachable blob is checked, including content removed in later commits.
const objects = git("rev-list", "--objects", "--all")
  .toString()
  .trim()
  .split("\n")
  .filter(Boolean);
const ids = [],
  labels = new Map();
for (const line of objects) {
  const split = line.indexOf(" ");
  const id = split < 0 ? line : line.slice(0, split);
  const name = split < 0 ? id : line.slice(split + 1);
  if (privatePath.test(name)) findings.add(`${name}: private path in history`);
  ids.push(id);
  labels.set(id, name);
}
const batch = execFileSync("git", ["cat-file", "--batch"], {
  input: ids.join("\n") + "\n",
  maxBuffer: 128 * 1024 * 1024,
});
let offset = 0,
  blobs = 0,
  commits = 0;
while (offset < batch.length) {
  const end = batch.indexOf(10, offset);
  if (end < 0) throw new Error("Incomplete Git object header");
  const [id, type, size] = batch.subarray(offset, end).toString().split(" ");
  const length = Number(size);
  if (!Number.isFinite(length)) throw new Error("Invalid Git object size");
  const bytes = batch.subarray(end + 1, end + 1 + length);
  if (type === "blob") {
    scan(bytes.toString("latin1"), `history/${labels.get(id)}`);
    blobs++;
  }
  if (type === "commit" || type === "tag") {
    const content = bytes.toString();
    scan(content, `${type}/${id.slice(0, 8)}`);
    for (const match of content.matchAll(
      /^(?:author|committer|tagger) .*?<([^>]+)>/gm,
    )) {
      const email = match[1];
      if (
        !email.endsWith("@users.noreply.github.com") &&
        email !== "noreply@github.com" &&
        email !== "contributors@example.invalid"
      )
        findings.add(
          `${type}/${id.slice(0, 8)}: use a private/noreply contributor email`,
        );
    }
    if (type === "commit") commits++;
  }
  offset = end + 1 + length + 1;
}

if (findings.size) {
  console.error(
    "Public-repository privacy checks failed (matched values are not printed):",
  );
  for (const finding of findings) console.error(`- ${finding}`);
  process.exitCode = 1;
} else {
  console.log(
    `Privacy checks passed: ${files.length} working files, ${blobs} historical blobs, ${commits} commits.`,
  );
  console.log(
    "Also run Gitleaks for credential-pattern scanning; this is a separate privacy check.",
  );
}
