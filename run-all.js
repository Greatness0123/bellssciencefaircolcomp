import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const backendCmd = path.join(__dirname, "backend", "venv", "Scripts", "python.exe");
const backendArgs = ["-m", "uvicorn", "app.main:app", "--app-dir", "backend", "--reload", "--port", "8000"];

const viteBin = path.join(__dirname, "node_modules", "vite", "bin", "vite.js");

// console.log("\x1b[36m%s\x1b[0m", "==================================================");
console.log("\x1b[36m%s\x1b[0m", "  SENTINEL AI - STARTING FULL STACK ENVIRONMENT");
// console.log("\x1b[36m%s\x1b[0m", "==================================================");
console.log("\x1b[34m[BACKEND]\x1b[0m  Port: 8000  (API Docs: http://localhost:8000/api/docs)");
console.log("\x1b[32m[FRONTEND]\x1b[0m Port: 5173  (Web App:  http://localhost:5173)");
// console.log("\x1b[36m%s\x1b[0m", "--------------------------------------------------");

const backend = spawn(backendCmd, backendArgs, {
  stdio: "inherit",
});

const frontend = spawn(process.execPath, [viteBin], {
  stdio: "inherit",
});

function cleanup() {
  backend.kill();
  frontend.kill();
  process.exit();
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
