import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { existsSync, unlinkSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

try {
  const conflictingRoute = join(__dirname, "src/app/report/[company]/route.js");
  if (existsSync(conflictingRoute)) {
    unlinkSync(conflictingRoute);
    console.log("SUCCESS: Deleted conflicting route.js on startup.");
  }
} catch (e) {
  console.error("Error deleting conflicting route:", e);
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
