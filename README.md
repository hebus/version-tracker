# Version Tracker

> Desktop app for monitoring npm package versions across registries — side-by-side comparison between **npmjs.org** and a **Verdaccio** private registry.

Built with Tauri 2 · React 19 · Rust

---

## Features

- **Side-by-side comparison** — latest version on npmjs.org vs your Verdaccio instance, with publication dates
- **All dist-tags** — not just `latest`; every tag (`next`, `beta`, `rc`…) is fetched and displayed
- **Package groups** — organize packages into collapsible, named groups for easier reading
- **Live search** — filter packages across all groups instantly as you type
- **Auto-refresh** — configurable polling interval (default: 1 hour), powered by TanStack Query
- **Manual refresh** — per-package button or bulk "Refresh all"
- **In-app notifications** — toast alerts + persistent notification panel that tracks every version change
- **Persistent config** — settings saved locally via `tauri-plugin-store` (no server, no account)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | [Tauri 2](https://tauri.app/) |
| UI | React 19 + TypeScript |
| Styling | Tailwind CSS 4 |
| Data fetching | TanStack Query 5 |
| HTTP client (Rust) | reqwest + tokio |
| Build tool | Vite 7 |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Rust](https://www.rust-lang.org/tools/install) stable toolchain
- Platform prerequisites from the [Tauri docs](https://tauri.app/start/prerequisites/)

### Development

```bash
npm install
npm run tauri dev
```

### Production build

```bash
npm run tauri build
```

The installer is output to `src-tauri/target/release/bundle/`.

---

## Configuration

Open the settings panel (gear icon, top-right) to configure:

| Setting | Description | Default |
|---|---|---|
| Verdaccio URL | Base URL of your private npm registry | `https://npm.your-comapny.com` |
| Refresh interval | Auto-refresh period in seconds | `3600` (1 h) |
| Package groups | Named groups of packages to track | — |

Config is persisted in the Tauri app-data directory as `config.json`.

---

## Project Structure

```
src/
├── components/
│   ├── PackageTable.tsx     # grouped table with collapsible sections
│   ├── PackageRow.tsx       # single package comparison row
│   ├── Settings.tsx         # settings modal (URL, interval, groups)
│   ├── NotificationPanel.tsx
│   ├── UpdateBanner.tsx     # "new version available" banner
│   └── ToastContainer.tsx
├── hooks/
│   ├── useConfig.ts         # load / save config via Tauri command
│   ├── usePackageVersions.ts# TanStack Query polling per package
│   ├── useNotifications.ts
│   ├── useToast.ts
│   └── useUpdater.ts        # checks GitHub Releases for a newer version
└── types.ts

src-tauri/src/
├── commands/
│   ├── fetch_versions.rs    # fetch_package_versions (npmjs + Verdaccio in parallel)
│   └── config.rs            # get_config / save_config
└── lib.rs
```

---

## Auto-update & releases

Installed apps check GitHub Releases at startup and every 6 hours, and show a banner with an **Install and restart** button when a newer version exists. Nothing is installed without a click.

To publish a release:

```bash
npm run bump -- 0.2.0
cargo check --manifest-path src-tauri/Cargo.toml
git commit -am "chore(release): v0.2.0"
git tag v0.2.0 && git push origin develop v0.2.0
```

The `Release` workflow builds Windows, macOS (Apple Silicon + Intel) and Linux, signs the updater artifacts and publishes the release. It needs the repository secrets `TAURI_SIGNING_PRIVATE_KEY` and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`; **back up the private key** — without it, installed apps can no longer update. The installers are not code-signed, so Windows SmartScreen / macOS Gatekeeper warn on first install.

## Architecture Notes

**Rust backend** exposes three Tauri commands:

- `fetch_package_versions(package, verdaccio_url)` — hits both registries concurrently with `tokio::join!` and returns a unified `PackageVersions` struct including all dist-tags and publish dates
- `get_config` / `save_config` — reads/writes the app config from the local store

**React frontend** uses TanStack Query for per-package polling and cache invalidation. Version-change events bubble up through `usePackageVersions` → `handleVersionEvent` → `useToast` + `useNotifications`, so every change is captured whether you're watching or not.
