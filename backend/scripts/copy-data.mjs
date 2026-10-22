import { cp, mkdir } from "node:fs/promises";

await mkdir("dist/data", { recursive: true });
await cp("data", "dist/data", { recursive: true, force: true });
