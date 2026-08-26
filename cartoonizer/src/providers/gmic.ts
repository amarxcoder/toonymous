import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

// Shells out to the `gmic` CLI (G'MIC), not GIMP itself — GIMP's batch mode
// can host G'MIC filters too, but the standalone `gmic` binary is lighter
// (no GIMP process) and does the same filtering. Works on arbitrary photos
// (no face detection needed), no GPU, small per-image memory footprint —
// the right fit for this project's memory-constrained deploy target.
//
// Verified against gmic 2.9.4 installed on this box: `cartoon` takes its
// params as one comma-separated positional argument (smoothness, sharpening,
// threshold, thickness, color, quantization) and does NOT take an output
// path as an argument — output must go through an explicit `-o` command.
// Passing a bare path after `cartoon` (as an early version of this file did)
// gets silently consumed as the smoothness argument and gmic errors out
// deep inside its `blur` sub-command instead of writing a file.
export async function gmicCartoonize(input: Buffer): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), "toonymous-gmic-"));
  const inputPath = join(dir, "in.png");
  const outputPath = join(dir, "out.png");
  try {
    await writeFile(inputPath, input);
    await execFileAsync("gmic", [
      inputPath,
      "cartoon",
      "40,90,15,0.5,1.25,10",
      "-o",
      outputPath,
    ]);
    return await readFile(outputPath);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
