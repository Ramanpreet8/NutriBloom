import { spawn } from "node:child_process";
import { resolve } from "node:path";

const seedProcess = spawn("tsx", [resolve("..", "prisma", "seed.ts")], {
  stdio: "inherit",
});

seedProcess.on("error", (error) => {
  console.error("Failed to start Prisma seed script:", error);
  process.exitCode = 1;
});

seedProcess.on("exit", (code, signal) => {
  if (code !== 0) {
    console.error(`Prisma seed script exited with ${signal ?? `code ${code}`}`);
    process.exitCode = code ?? 1;
  }
});
