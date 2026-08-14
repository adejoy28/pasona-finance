// Electron main process for Pasona Finance.
//
// Responsibilities:
//   - Locate the Laravel backend (bundled in resources/backend when packaged,
//     or the sibling `pasona-finance/backend` folder in development).
//   - Start `php artisan serve` on 127.0.0.1:8000 unless something is already
//     listening there.
//   - Serve the built `dist/` folder over a local HTTP server (so BrowserRouter
//     and absolute asset paths work exactly like the web build).
//   - Inject CORS headers for API responses so the renderer (whose origin is
//     http://127.0.0.1:<static-port>) can call http://127.0.0.1:8000/api.
//
// Dev mode: set ELECTRON_START_URL to load the Vite dev server directly; the
// Vite proxy already forwards /api to the backend, so no CORS injection needed.

const { app, BrowserWindow, session, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");
const net = require("net");
const { spawn } = require("child_process");

const BACKEND_HOST = "127.0.0.1";
const BACKEND_PORT = Number(process.env.PASONA_BACKEND_PORT ?? "8000");
const BACKEND_BASE = `http://${BACKEND_HOST}:${BACKEND_PORT}`;

let backendChild = null;

function log(...args) {
  console.log("[electron]", ...args);
}

function resolveBackendSourceDir() {
  if (process.env.PASONA_BACKEND_DIR && fs.existsSync(process.env.PASONA_BACKEND_DIR)) {
    return process.env.PASONA_BACKEND_DIR;
  }
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "backend");
  }
  return path.resolve(__dirname, "..", "..", "pasona-finance", "backend");
}

// When packaged, storage/ inside the app bundle isn't reliably writable, so we
// copy the backend once into userData on first launch and run from there.
function resolveRuntimeBackendDir(sourceDir) {
  if (!app.isPackaged) return sourceDir;
  const runtimeDir = path.join(app.getPath("userData"), "backend");
  if (!fs.existsSync(path.join(runtimeDir, "artisan"))) {
    fs.rmSync(runtimeDir, { recursive: true, force: true });
    fs.cpSync(sourceDir, runtimeDir, {
      recursive: true,
      filter: (src) => {
        const rel = path.relative(sourceDir, src);
        const parts = rel.split(path.sep);
        if (parts.includes("node_modules") || parts.includes(".git") || parts.includes("tests")) {
          return false;
        }
        return true;
      },
    });
    log(`[backend] copied backend to ${runtimeDir}`);
  }
  return runtimeDir;
}

function portInUse(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: BACKEND_HOST, port });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
    socket.setTimeout(800, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function waitForBackend(timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await portInUse(BACKEND_PORT)) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

function runArtisan(cwd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn("php", ["artisan", ...args], { cwd, windowsHide: true, stdio: "ignore" });
    child.on("error", reject);
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`artisan ${args[0]} exited ${code}`))));
  });
}

async function ensureBackend() {
  const sourceDir = resolveBackendSourceDir();
  if (!fs.existsSync(path.join(sourceDir, "artisan"))) {
    dialog.showErrorBox(
      "Pasona Finance",
      `Backend not found at:\n${sourceDir}\n\nMake sure PHP and the Laravel app are present, or set PASONA_BACKEND_DIR to its location.`,
    );
    throw new Error("backend not found");
  }

  const runtimeDir = resolveRuntimeBackendDir(sourceDir);

  if (await portInUse(BACKEND_PORT)) {
    log(`[backend] already running on :${BACKEND_PORT}, reusing it`);
    return runtimeDir;
  }

  if (runtimeDir !== sourceDir) {
    try {
      await runArtisan(runtimeDir, ["migrate", "--force"]);
      log("[backend] migrations up to date");
    } catch (err) {
      log("[backend] migrate failed (continuing)", err.message);
    }
  }

  log(`[backend] starting php artisan serve on :${BACKEND_PORT}`);
  backendChild = spawn(
    "php",
    ["artisan", "serve", `--host=${BACKEND_HOST}`, `--port=${String(BACKEND_PORT)}`],
    {
      cwd: runtimeDir,
      windowsHide: true,
      env: {
        ...process.env,
        CORS_ALLOWED_ORIGINS: `http://127.0.0.1,http://localhost:8080,${process.env.CORS_ALLOWED_ORIGINS ?? ""}`.replace(/,\s*$/, ""),
      },
    },
  );
  backendChild.stdout.on("data", (d) => log("[backend]", String(d).trim()));
  backendChild.stderr.on("data", (d) => log("[backend:err]", String(d).trim()));
  backendChild.on("exit", (code) => {
    log(`[backend] exited (${code})`);
    backendChild = null;
  });

  const ok = await waitForBackend();
  if (!ok) {
    dialog.showErrorBox(
      "Pasona Finance",
      "The backend (php artisan serve) failed to start.\n\nIs PHP installed and on your PATH? Is the database reachable?",
    );
    throw new Error("backend failed to start");
  }
  return runtimeDir;
}

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json",
};

function createStaticServer(rootDir) {
  const root = path.resolve(rootDir);
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const pathname = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
      let filePath = path.resolve(root, "." + pathname);
      if (!filePath.startsWith(root)) {
        res.writeHead(403).end("Forbidden");
        return;
      }
      fs.stat(filePath, (err, stat) => {
        if (err || !stat.isFile()) {
          filePath = path.join(root, "index.html");
        }
        fs.readFile(filePath, (readErr, data) => {
          if (readErr) {
            res.writeHead(404).end("Not found");
            return;
          }
          const ext = path.extname(filePath).toLowerCase();
          res.writeHead(200, {
            "Content-Type": MIME_TYPES[ext] ?? "application/octet-stream",
            "Cache-Control": "no-cache",
          });
          res.end(data);
        });
      });
    });
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

// The renderer origin (http://127.0.0.1:<static-port>) differs from the API
// origin, and the frontend uses Bearer tokens (credentials: "omit"), so a
// permissive CORS response makes the desktop build behave like the proxied
// web build without touching the backend's own CORS policy.
function installCorsBypass(allowedOrigin) {
  session.defaultSession.webRequest.onHeadersReceived(
    { urls: [`${BACKEND_BASE}/*`] },
    (details, callback) => {
      const headers = { ...(details.responseHeaders ?? {}) };
      headers["Access-Control-Allow-Origin"] = [allowedOrigin];
      headers["Access-Control-Allow-Headers"] = ["*"];
      headers["Access-Control-Allow-Methods"] = ["GET, POST, PUT, PATCH, DELETE, OPTIONS"];
      headers["Access-Control-Max-Age"] = ["600"];
      headers["Vary"] = ["Origin"];
      callback({ responseHeaders: headers });
    },
  );
}

async function createWindow(devUrl, staticOrigin) {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    autoHideMenuBar: true,
    backgroundColor: "#1B2D6B",
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  win.once("ready-to-show", () => win.show());
  if (devUrl) {
    await win.loadURL(devUrl);
  } else {
    await win.loadURL(staticOrigin);
  }
  return win;
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  let mainWindow = null;

  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    const devUrl = process.env.ELECTRON_START_URL || "";

    try {
      await ensureBackend();
    } catch {
      app.exit(1);
      return;
    }

    let staticOrigin = devUrl;
    if (!devUrl) {
      const distDir = path.resolve(__dirname, "..", "dist");
      if (!fs.existsSync(path.join(distDir, "index.html"))) {
        dialog.showErrorBox(
          "Pasona Finance",
          `Build not found at ${distDir}.\n\nRun "pnpm build" or "pnpm electron:build" first.`,
        );
        app.exit(1);
        return;
      }
      const server = await createStaticServer(distDir);
      const port = server.address().port;
      staticOrigin = `http://127.0.0.1:${port}`;
      installCorsBypass(staticOrigin);
      log(`[web] serving dist at ${staticOrigin}`);
    }

    mainWindow = await createWindow(devUrl, staticOrigin);

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow(devUrl, staticOrigin);
      }
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });

  app.on("will-quit", () => {
    if (backendChild) {
      backendChild.kill();
      backendChild = null;
    }
  });
}
