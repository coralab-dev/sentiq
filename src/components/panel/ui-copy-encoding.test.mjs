import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const sourceRoots = ["src"];
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);
const ignoredDirectories = new Set(["node_modules", ".next", "out", "coverage"]);
const mojibakePatterns = [
  [0x00c3],
  [0x00c2],
  [0x00e2, 0x20ac, 0x2013],
  [0x00e2, 0x20ac, 0x2014],
  [0x00e2, 0x20ac, 0x2122],
  [0x00e2, 0x20ac, 0x0153],
  [0x00e2, 0x20ac],
  [0xfffd],
].map((codePoints) => String.fromCodePoint(...codePoints));

async function collectSourceFiles(directory) {
  const entries = await readdir(path.join(root, directory), { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        files.push(...await collectSourceFiles(path.join(directory, entry.name)));
      }
      continue;
    }

    if (sourceExtensions.has(path.extname(entry.name))) {
      files.push(path.join(directory, entry.name));
    }
  }

  return files;
}

test("visible UI source does not contain mojibake", async () => {
  const files = (await Promise.all(sourceRoots.map(collectSourceFiles))).flat();
  const violations = [];

  for (const relativePath of files) {
    const source = await readFile(path.join(root, relativePath), "utf8");
    const lines = source.split(/\r?\n/);

    for (const [lineNumber, line] of lines.entries()) {
      for (const pattern of mojibakePatterns) {
        if (line.includes(pattern)) {
          violations.push(
            `${relativePath}:${lineNumber + 1}: ${JSON.stringify(pattern)}: ${line.trim()}`,
          );
        }
      }
    }
  }

  assert.equal(
    violations.length,
    0,
    `Mojibake detected in visible UI source:\n${violations.join("\n")}`,
  );
});
