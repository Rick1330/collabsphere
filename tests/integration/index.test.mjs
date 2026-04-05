import { tsImport } from "tsx/esm/api";

// Keep Node's built-in directory contract alive while the source-of-truth
// integration suite remains TypeScript.
await tsImport("./service-smoke.test.ts", import.meta.url);
