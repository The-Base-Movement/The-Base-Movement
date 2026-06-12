# The Base: Desktop Application Conversion Plan

This document outlines the strategic plan, technical options, and architectural requirements for converting **The Base** (currently a Vite + React + TypeScript web application) into a fully functional cross-platform desktop application.

---

## 📊 Comparison of Pathways

Before starting development, we must select the correct wrapper layer. Here is a breakdown of the three primary paths:

### 1. Tauri ⚡ (Recommended)

Tauri uses a Rust-based backend and leverages the operating system's native Webview (WebView2 on Windows, WebKit on macOS/Linux).

- **Bundle Size:** ~3MB to 10MB
- **Memory Usage:** ~30MB - 50MB RAM
- **Pros:** Exceptional performance, incredibly lightweight installers, secure by design, fits perfectly with Vite.
- **Cons:** Requires Rust installed on build machines; more complex native integration if deep Rust knowledge is required.

### 2. Electron ⚛️ (The Veteran)

Electron bundles a full Chromium browser and a Node.js runtime.

- **Bundle Size:** ~120MB+
- **Memory Usage:** ~150MB+ RAM per instance
- **Pros:** Full Node.js environment, incredibly mature ecosystem, 100% JavaScript/TypeScript, completely consistent rendering across all platforms.
- **Cons:** Heavy resource usage, massive package sizes.

### 3. Progressive Web App (PWA) 🌐 (Low-Cost Alternative)

A PWA turns the web app into an installable application via modern browser engines.

- **Bundle Size:** 0MB (runs from the browser cache)
- **Memory Usage:** Low (standard browser tab)
- **Pros:** Easiest to implement, zero native dependencies, updates automatically with web deploys.
- **Cons:** Cannot access advanced native APIs (e.g. system trays, raw filesystems, local ports); still relies on browser frames.

---

## 🛠️ Implementation Architecture for The Base

Converting our project requires modifying how build targets, authentication, and state management are handled.

### 1. Vite Build Target (SPA Mode)

Currently, our project uses Vite React SSG and prerendering:

- `"build": "npm run build:client && npm run build:server && node scripts/prerender.mjs"`

For a native desktop app, the build must be packaged into static files (`index.html`, assets, and scripts) that run entirely client-side without relying on a Node.js server.

- **Action:** Define a specific desktop build script in `package.json` that outputs a pure SPA build to a `dist` directory:
  ```json
  "build:desktop": "cross-env VITE_DESKTOP=true tsc -b && vite build --mode desktop"
  ```
- Ensure our routing uses **Hash History** (`HashRouter` or client-only memory routers) instead of HTML5 Web History (`BrowserRouter`) if Tauri/Electron have issues resolving deep static folder paths.

### 2. Supabase Authentication & Deep Linking 🔑

Because the desktop app runs locally, the authentication flow cannot simply redirect to `http://localhost:5173/auth/callback` in production.

- **Deep Linking**: We must configure the desktop app to register a custom protocol (e.g., `thebase://`).
- **Flow**:
  1. The user clicks "Login with Google/Email" in the desktop app.
  2. The app launches the user's system browser to handle the OAuth/login flow on the web.
  3. Upon successful login, the Supabase server redirects the browser to `thebase://auth-callback#access_token=...`.
  4. The operating system interceptors capture `thebase://` and pass the URL parameters back into our active desktop app window.
  5. The desktop app sets the Supabase session and logs the user in.

### 3. Environment & Configurations

Create a `.env.desktop` file to manage specific desktop URLs and feature flags:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_IS_DESKTOP=true
```

---

## 🚀 Step-by-Step Setup Guides

### Guide A: Setting up Tauri (Recommended)

#### Step 1: Install Tauri CLI

Install the Tauri CLI as a development dependency:

```bash
npm install --save-dev @tauri-apps/cli
```

#### Step 2: Initialize Tauri

Run the interactive initializer in the root folder:

```bash
npx tauri init
```

Choose the following configurations when prompted:

- **App name:** `The Base`
- **Window title:** `The Base`
- **Assets path:** `../dist` _(relative to the src-tauri folder)_
- **Dev server URL:** `http://localhost:5173`
- **Frontend dev command:** `npm run dev`
- **Frontend build command:** `npm run build:desktop`

This will generate a `src-tauri` folder containing configuration files (`tauri.conf.json`), icons, and the Rust main entrypoint.

#### Step 3: Run in Development

To test the desktop app live:

```bash
npm run tauri dev
```

#### Step 4: Building the Installers

To compile the production binaries (produces `.exe` on Windows, `.dmg` on macOS, and `.deb` on Linux):

```bash
npm run tauri build
```

---

### Guide B: Setting up Electron

#### Step 1: Install Electron Dependencies

```bash
npm install --save-dev electron electron-builder
```

#### Step 2: Create Main Entry File (`electron/main.cjs`)

Create a process manager at `electron/main.cjs`:

```javascript
const { app, BrowserWindow } = require('electron')
const path = require('path')
const isDev = process.env.NODE_ENV === 'development'

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
```

#### Step 3: Add Scripts to `package.json`

Add desktop tasks under `"scripts"`:

```json
"electron:dev": "cross-env NODE_ENV=development electron electron/main.cjs",
"electron:build": "npm run build:desktop && electron-builder"
```

---

## 📈 Roadmap for Transition

1. **Phase 1: Build Separation (1-2 days)**
   - Introduce client-only build configuration in [vite.config.ts](file:///c:/MAMP/htdocs/The-Base/vite.config.ts) that bypasses SSR and generates fully static folders.
   - Verify that routing functions flawlessly under static directory rendering.

2. **Phase 2: Wrapper Shell Integration (2-3 days)**
   - Install and configure **Tauri** (or Electron).
   - Verify desktop window rendering, hot-reloading, and asset mapping.

3. **Phase 3: Supabase Authentication Linkage (3-5 days)**
   - Setup custom protocol configurations (`thebase://`) in Tauri/Electron configuration files.
   - Modify the authentication utility files to support deep-linking callback handlers.

4. **Phase 4: OS Integrations & Polish (2-4 days)**
   - Set up desktop-specific behaviors (native file downloads, native window styling, dark/light theme syncing with the host OS).
   - Integrate auto-updates.

5. **Phase 5: Release Build (2 days)**
   - Configure code-signing certificates for Windows and macOS.
   - Generate release installers.
