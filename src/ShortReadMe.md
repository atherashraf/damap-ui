# damap-lib

Reusable GIS map library (React + OpenLayers + MUI) extracted from `damap-ui`.

---

## 🔄 Sync with Main Repo (`damap-ui`)

### Push updates (from `damap-ui` → `damap-lib`)

```bash
git subtree split --prefix=src/lib -b damap-lib-branch
git push damap-lib damap-lib-branch:main --force
git branch -D damap-lib-branch
```

### Pull updates (from `damap-lib` → `damap-ui`)

```bash
git fetch damap-lib
git subtree pull --prefix=src/lib damap-lib main --squash
```

---

## 🔗 Add Remote (one-time)

```bash
git remote add damap-lib https://github.com/atherashraf/damap-lib.git
```

---

## 📦 Use in Another App

### Option 1: Install from GitHub

```bash
npm install github:atherashraf/damap-lib
```

### Option 2: Use as local dependency

```json
{
  "dependencies": {
    "damap": "file:libs/damap"
  }
}
```

---

## 🚀 Usage

```ts
import { DAMap, LayerInfoAdmin } from "damap";
```

Lazy load example:

```ts
const LayerInfoAdmin = lazy(() =>
  import("damap").then(m => ({ default: m.LayerInfoAdmin }))
);
```

---

## 🛠 Build

```bash
npm install
npm run build
```

---

## 📌 Notes

* Source of truth: `damap-ui` (`src/lib`)
* This repo is synced via **git subtree**
* Only library code is synced (no demo/app code)

---
