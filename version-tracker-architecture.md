# Version Tracker — Architecture du projet

Application desktop cross-platform (Windows / macOS / Linux) construite avec **Tauri v2**, qui compare les versions des librairies `@sinequa/xxx` publiées sur **npmjs** et sur le registre **Verdaccio** privé.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework desktop | Tauri v2 |
| Backend (système) | Rust 1.95+ |
| Frontend | React 19 + TypeScript + Vite |
| UI | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Data fetching | TanStack Query v5 (cache + refetch automatique) |
| Notifications OS | `tauri-plugin-notification` |
| Stockage config | `tauri-plugin-store` (fichier JSON local) |
| HTTP client (Rust) | `reqwest` + `tokio` |

---

## Fonctionnement général

```
[Frontend React]
    ↕ Tauri IPC commands
[Backend Rust]
    ├── GET registry.npmjs.org/@sinequa/xxx   → tous les dist-tags
    ├── GET npm.sinequa.com/@sinequa/xxx       → tous les dist-tags
    ├── Lecture / écriture config.json (tauri-plugin-store)
    └── Notification OS si nouvelle version détectée (au refetch)
```

---

## Structure des fichiers

```
version-tracker/
├── src-tauri/                          ← Backend Rust (Tauri)
│   ├── src/
│   │   ├── main.rs
│   │   ├── lib.rs                      ← Enregistrement plugins + commandes
│   │   └── commands/
│   │       ├── mod.rs
│   │       ├── fetch_versions.rs       ← Appels registres npm (tous dist-tags)
│   │       └── config.rs               ← Lecture / écriture config locale
│   ├── capabilities/
│   │   └── default.json                ← Permissions Tauri (store, notification)
│   ├── icons/                          ← Icônes générées (ne pas éditer à la main)
│   ├── icons-source/
│   │   └── icon.svg                    ← Source de l'icône (régénérer : npx tauri icon src-tauri/icons-source/icon.svg)
│   └── tauri.conf.json
│
├── src/                                ← Frontend React
│   ├── components/
│   │   ├── ErrorBoundary.tsx           ← Affiche les erreurs React (pas d'écran blanc)
│   │   ├── PackageTable.tsx            ← Tableau groupé avec en-têtes de section
│   │   ├── PackageRow.tsx              ← Ligne latest + sous-lignes par tag
│   │   ├── SearchBar.tsx
│   │   └── Settings.tsx                ← Gestion groupes, packages, URL, intervalle
│   ├── hooks/
│   │   ├── usePackageVersions.ts       ← TanStack Query → Map<pkg, query>
│   │   └── useConfig.ts                ← Chargement / sauvegarde config
│   ├── types/
│   │   └── index.ts                    ← Types, computeStatus, helpers
│   ├── index.css                       ← @import "tailwindcss"
│   ├── App.tsx
│   └── main.tsx                        ← QueryClientProvider + ErrorBoundary
│
├── package.json
└── vite.config.ts
```

---

## Configuration locale (`config.json`)

Fichier stocké dans le répertoire de données de l'application (géré par `tauri-plugin-store`).

```json
{
  "verdaccioUrl": "https://npm.sinequa.com",
  "refreshInterval": 3600,
  "groups": [
    {
      "id": "grp_abc123",
      "name": "Core",
      "packages": ["@sinequa/core", "@sinequa/analytics"]
    },
    {
      "id": "grp_def456",
      "name": "UI",
      "packages": ["@sinequa/components", "@sinequa/styles"]
    }
  ]
}
```

| Champ | Description |
|---|---|
| `verdaccioUrl` | URL du registre Verdaccio privé |
| `refreshInterval` | Intervalle de rafraîchissement en secondes (défaut : 3600 = 1h) |
| `groups` | Groupes de packages (nombre illimité) |
| `groups[].id` | Identifiant unique généré automatiquement |
| `groups[].name` | Nom du groupe (éditable dans l'UI) |
| `groups[].packages` | Liste des packages `@sinequa/xxx` du groupe |

---

## Modèle de données

### TypeScript

```typescript
interface PackageGroup {
  id: string;
  name: string;
  packages: string[];
}

interface Config {
  verdaccioUrl: string;
  refreshInterval: number;
  groups: PackageGroup[];
}

interface TagInfo {
  tag: string;        // ex: "latest", "next", "legacy"
  version: string;    // ex: "11.9.2"
  publishedAt: string | null;
}

interface VersionInfo {
  latest: string | null;      // version du tag "latest" (raccourci)
  publishedAt: string | null; // date de publication du tag "latest"
  tags: TagInfo[];            // tous les dist-tags, "latest" en premier
  error: string | null;       // "not_found" | message d'erreur HTTP
}

interface PackageVersions {
  name: string;
  npm: VersionInfo;
  verdaccio: VersionInfo;
}
```

### Rust

```rust
struct PackageGroup { id, name, packages }
struct Config { verdaccio_url, refresh_interval, groups }
struct TagInfo { tag, version, published_at }
struct VersionInfo { latest, published_at, tags, error }
struct PackageVersions { name, npm, verdaccio }
```

---

## Données affichées — Vue comparaison

### Ligne principale (tag `latest`)

| Package | npmjs | Publié | Verdaccio | Publié | Statut |
|---|---|---|---|---|---|
| ▶ @sinequa/core | `11.9.2` | 01/01/2024 | `11.9.1` | 01/12/2023 | npmjs en avance |
| ▶ @sinequa/analytics | `3.4.0` | 15/06/2023 | `3.4.0` | 15/06/2023 | Synchronisé |

### Sous-lignes (autres tags, expansibles)

| | `next` | `12.0.0-beta` | `12.0.0-beta` | Synchronisé |
|---|---|---|---|---|
| | `legacy` | `10.5.0` | — | Absent de Verdaccio |

### Statuts possibles

| Statut | Condition |
|---|---|
| Synchronisé | Même version sur les deux registres |
| npmjs en avance | Version npmjs > version Verdaccio (comparaison semver) |
| Verdaccio en avance | Version Verdaccio > version npmjs |
| Absent de Verdaccio | Package introuvable sur Verdaccio |
| Absent de npmjs | Package introuvable sur npmjs |
| Erreur | Les deux registres ont retourné une erreur |

---

## Fonctionnalités

- **Groupes de packages** : organisation par thème/catégorie (ajout, renommage, suppression)
- **Comparaison côte-à-côte** npmjs vs Verdaccio pour chaque package
- **Tous les dist-tags** : ligne `latest` toujours visible, autres tags expansibles par package
- **Statut par tag** : chaque tag affiché avec son propre badge de statut
- **Rafraîchissement automatique** configurable (défaut : 1h)
- **Notifications OS** lors de la détection d'une nouvelle version au refetch
- **Recherche / filtre** : filtre dans tous les groupes, groupes vides masqués automatiquement
- **Collapse par groupe** : chaque section peut être réduite dans le tableau
- **Paramètres éditables depuis l'UI** : groupes, packages, URL Verdaccio, intervalle
- **Cache au démarrage** : affichage immédiat des dernières données connues
- **Error Boundary** : les erreurs React s'affichent avec leur message au lieu d'un écran blanc

---

## Appels API

| Registre | Endpoint |
|---|---|
| npmjs | `GET https://registry.npmjs.org/@sinequa/<package>` |
| Verdaccio | `GET https://npm.sinequa.com/@sinequa/<package>` |

Les deux respectent le protocole standard du registre npm. La réponse JSON contient :
- `dist-tags` → `{ "latest": "x.y.z", "next": "x.y.z-beta", ... }`
- `time` → `{ "x.y.z": "ISO date", ... }` pour les dates de publication

Les deux registres sont appelés en parallèle via `tokio::join!`.

---

## Prérequis d'installation

| Outil | Version | Commande (Windows) |
|---|---|---|
| Node.js | 18+ | `winget install OpenJS.NodeJS` |
| Rust (rustup) | stable | `winget install Rustlang.Rustup` |
| Visual Studio 2022 | — | Via Visual Studio Installer |
| WebView2 Runtime | — | Pré-installé sur Windows 11 |

### macOS
```bash
xcode-select --install
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Linux (Debian/Ubuntu)
```bash
sudo apt install libwebkit2gtk-4.1-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

---

## Dépendances Rust (`Cargo.toml`)

```toml
tauri = "2"
tauri-plugin-opener = "2"
tauri-plugin-store = "2"
tauri-plugin-notification = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
reqwest = { version = "0.12", features = ["json"] }
tokio = { version = "1", features = ["rt", "macros"] }
```

## Dépendances npm (`package.json`)

```json
{
  "dependencies": {
    "@tauri-apps/api": "^2",
    "@tauri-apps/plugin-notification": "^2",
    "@tauri-apps/plugin-store": "^2",
    "@tanstack/react-query": "^5",
    "tailwindcss": "^4",
    "@tailwindcss/vite": "^4",
    "lucide-react": "^1",
    "react": "^19",
    "react-dom": "^19"
  }
}
```

---

## Démarrage

```bash
cd version-tracker

# Mode développement (compile Rust + Vite HMR)
npm run tauri dev

# Build production (génère l'installeur natif)
npm run tauri build
```
