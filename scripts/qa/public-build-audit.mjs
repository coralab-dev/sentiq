import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const OUT_DIR = "out";

const FORBIDDEN_PATTERNS = [
  { name: "SUPABASE_SERVICE_ROLE_KEY", regex: /SUPABASE_SERVICE_ROLE_KEY/i },
  { name: "service_role", regex: /service_role/i },
  { name: "token_hash", regex: /token_hash/i },
  { name: "postgres connection string", regex: /postgres(?:ql)?:\/\/[^"'\s)]+/i },
  { name: "private key", regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: "JWT admin secret", regex: /\b(jwt|admin)[_-]?secret\b/i },
  { name: "rate limit salt", regex: /rate[_-]?limit[_-]?salt/i },
  { name: "token secret", regex: /token[_-]?secret/i },
  { name: "demo admin email", regex: /admin\.demo@sentiq\.dev/i },
  { name: "demo manager email", regex: /manager\.demo@sentiq\.dev/i },
  { name: "demo platform email", regex: /platform\.demo@sentiq\.dev/i },
  { name: "demo password placeholder", regex: /change-this-dev-password/i },
];

const TEXT_EXTENSIONS = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".svg",
  ".txt",
  ".webmanifest",
  ".xml",
]);

if (!existsSync(OUT_DIR)) {
  console.error(`FAIL public build audit: ${OUT_DIR}/ does not exist. Run pnpm build first.`);
  process.exit(1);
}

const findings = [];

for (const filePath of walk(OUT_DIR)) {
  const relativePath = relative(process.cwd(), filePath).replace(/\\/g, "/");

  if (filePath.endsWith(".map")) {
    findings.push({ file: relativePath, pattern: "source map" });
    continue;
  }

  if (!isTextFile(filePath)) {
    continue;
  }

  const content = readFileSync(filePath, "utf8");
  for (const { name, regex } of FORBIDDEN_PATTERNS) {
    if (regex.test(content)) {
      findings.push({ file: relativePath, pattern: name });
    }
  }
}

if (findings.length > 0) {
  console.error("FAIL public build audit: forbidden markers found.");
  for (const finding of findings) {
    console.error(`- ${finding.file}: ${finding.pattern}`);
  }
  process.exit(1);
}

console.log("PASS public build audit: no forbidden markers or source maps found in out/.");

function* walk(directory) {
  for (const entry of readdirSync(directory)) {
    const filePath = join(directory, entry);
    const stats = statSync(filePath);
    if (stats.isDirectory()) {
      yield* walk(filePath);
    } else if (stats.isFile()) {
      yield filePath;
    }
  }
}

function isTextFile(filePath) {
  const dotIndex = filePath.lastIndexOf(".");
  if (dotIndex === -1) return false;
  return TEXT_EXTENSIONS.has(filePath.slice(dotIndex).toLowerCase());
}
