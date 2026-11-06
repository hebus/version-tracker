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
│   │   └── default.json                ← Permissions Tauri (store, notification, updater, process)
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
│   │   ├── Settings.tsx                ← Gestion groupes, packages, URL, intervalle
│   │   └── UpdateBanner.tsx            ← Bannière « nouvelle version disponible » (installer / plus tard)
│   ├── hooks/
│   │   ├── usePackageVersions.ts       ← TanStack Query → Map<pkg, query>
│   │   ├── useConfig.ts                ← Chargement / sauvegarde config
│   │   └── useUpdater.ts               ← Vérification des mises à jour (GitHub Releases) + installation
│   ├── types/
│   │   └── index.ts                    ← Types, computeStatus, helpers
│   ├── index.css                       ← @import "tailwindcss"
│   ├── App.tsx
│   └── main.tsx                        ← QueryClientProvider + ErrorBoundary
│
├── .github/workflows/release.yml       ← release-please + build/signature/publication des releases
├── release-please-config.json          ← Config release-please (fichiers de version à mettre à jour)
├── .release-please-manifest.json       ← Version courante suivie par release-please
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

## Mise à jour automatique

L'app vérifie GitHub Releases au démarrage (après 5 s) puis toutes les 6 h. Rien n'est téléchargé tant que l'utilisateur n'a pas cliqué sur **Installer et redémarrer**.

| Élément | Rôle |
|---------|------|
| `tauri-plugin-updater` + `tauri-plugin-process` | Vérification/installation puis `relaunch()`. Permissions `updater:default` et `process:allow-restart` dans `capabilities/default.json` |
| `hooks/useUpdater.ts` | `check()` planifié, état `idle → available → installing → error`, progression du téléchargement. Plugins importés dynamiquement : inerte dans `npm run dev` hors webview |
| `components/UpdateBanner.tsx` | Bannière en haut de l'écran : version disponible, bouton d'installation, croix « Plus tard » (rouverte si une version plus récente sort) |
| `plugins.updater` (`tauri.conf.json`) | `pubkey` + endpoint `https://github.com/hebus/version-tracker/releases/latest/download/latest.json` ; `installMode: passive` sous Windows |
| `bundle.createUpdaterArtifacts` | Produit les `.sig` à côté des installeurs |

Une erreur de vérification (hors-ligne, pas encore de release…) est ignorée (`console.warn`) ; seule une erreur d'installation s'affiche.

### Signature

Tauri refuse tout binaire non signé avec la clé correspondant à `pubkey` (paire générée par `npm run tauri signer generate`).
- **Clé publique** : dans `tauri.conf.json`.
- **Clé privée** : secrets GitHub `TAURI_SIGNING_PRIVATE_KEY` (+ `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`, vide si la clé n'a pas de mot de passe). **À sauvegarder** : sans elle, les installations existantes ne pourront plus jamais se mettre à jour.
- Ce n'est pas une signature de code : sans certificat, Windows SmartScreen et macOS Gatekeeper avertissent à la première installation.

### Publier une release (release-please)

Le versionnement et la publication sont automatisés par [release-please](https://github.com/googleapis/release-please) (`release-please-config.json`, `.release-please-manifest.json`), à partir des **Conventional Commits** :

1. Chaque push sur `develop` exécute le job `release-please` de `.github/workflows/release.yml`, qui ouvre ou met à jour une **PR de release** (`chore(release): X.Y.Z`) : version dans `package.json`, `package-lock.json`, `tauri.conf.json`, `Cargo.toml`, plus `CHANGELOG.md`. `Cargo.lock` est synchronisé par un job `sync-lockfile` séparé (`cargo update --workspace` sur la branche de la PR de release), car l'updater TOML de `release-please` ne sait pas cibler un paquet par son nom dans ce fichier. Fusionner les PR de fonctionnalité en **squash** pour éviter les doublons dans le changelog. Tant que la version est en 0.x : `fix` et `feat` → patch, `feat!` / `BREAKING CHANGE` → minor.
2. **Fusionner cette PR** crée le tag `vX.Y.Z` et la release GitHub (corps = changelog), puis les jobs `build` s'exécutent **dans le même workflow** (un tag créé avec `GITHUB_TOKEN` ne déclenche pas d'autre workflow) : Windows, macOS arm64 + x64, Linux, avec `tauri-action`, qui signe et attache installeurs, `.sig` et `latest.json` à la release existante.

Prérequis : secrets `TAURI_SIGNING_PRIVATE_KEY` (+ `..._PASSWORD`) et réglage du dépôt *Allow GitHub Actions to create and approve pull requests*. La release n'est plus un brouillon : elle existe quelques minutes avant que les installeurs soient attachés, et `latest.json` répond 404 entre-temps (l'updater ignore l'erreur). Si un build échoue, relancer les jobs en échec.

---

## Démarrage

```bash
cd version-tracker

# Mode développement (compile Rust + Vite HMR)
npm run tauri dev

# Build production (génère l'installeur natif)
npm run tauri build
```
