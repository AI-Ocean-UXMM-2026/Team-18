import { cp, mkdir } from "node:fs/promises";

await mkdir("dist/data", { recursive: true });
await mkdir("dist/certs", { recursive: true });
await cp("data", "dist/data", { recursive: true, force: true });
await cp("certs", "dist/certs", { recursive: true, force: true });
