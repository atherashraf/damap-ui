
# damap-lib

`damap-lib` is the reusable GIS/map library extracted from the main **DAMap UI** project.

It is designed to be shared across multiple applications using:
- git subtree
- local package (`file:`)
- GitHub install

---

## 📦 Purpose

This repository exists to:

- isolate reusable DAMap functionality
- share map/GIS components across projects
- keep application/demo code separate
- provide a clean integration path for other apps

---

## 🧩 Source of Truth

Main development happens in:

👉 `damap-ui`

Inside that repo, the library lives at:

```text
src/libs/damap
````

This repository (`damap-lib`) is synced from that folder using **git subtree**.

---

## 🔄 Sync Workflow

### 🔼 Push changes to `damap-lib`

Run inside `damap-ui`:

```bash
git subtree split --prefix=src/libs/damap -b damap-lib-sync
git push damap-lib damap-lib-sync:main --force
git branch -D damap-lib-sync
```

Or simply:

```bash
subtree-push.bat
```

---

### 🔽 Pull updates into `damap-ui`

```bash
git fetch damap-lib
git subtree pull --prefix=src/libs/damap damap-lib main --squash
```

Or:

```bash
subtree-pull.bat
```

---

## 🔗 Remote Setup

Inside `damap-ui`:

```bash
git remote add damap-lib https://github.com/atherashraf/damap-lib.git
git remote -v
```

---

## 📥 Using in Another Application

### ✅ Option 1 — Git Subtree (Recommended)

```bash
git remote add damap-lib https://github.com/atherashraf/damap-lib.git
git subtree add --prefix=src/libs/damap damap-lib main --squash
```

Then in your app:

```json
{
  "dependencies": {
    "damap": "file:src/libs/damap"
  }
}
```

Install:

```bash
npm install
```

---

### ✅ Option 2 — Local Package

```bash
npm install /path/to/damap-lib
```

---

### ✅ Option 3 — GitHub Install

```bash
npm install github:atherashraf/damap-lib
```

---

## 🚀 Usage

```ts
import { getDamapConfig } from "damap";
import "damap/damap.css";
```

Example:

```ts
const config = getDamapConfig();
```

---

## 🧱 Package Structure

```text
damap/
  api/
  assets/
  components/
  hooks/
  pages/
  types/
  utils/
  damap.ts
  damap.css
  config.ts
  package.json
```

---

## 📦 Package Configuration

`package.json` inside the library:

```json
{
  "name": "damap",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./damap.ts",
    "./damap.css": "./damap.css"
  }
}
```

---

## ⚠️ Important Notes

* Import the library using:

  ```ts
  import ... from "damap";
  ```

* CSS must be explicitly imported:

  ```ts
  import "damap/damap.css";
  ```

* If the library uses internal aliases like `@damap/...`,
  consumer apps must define:

  ```ts
  // vite.config.ts
  "@damap": resolve(__dirname, "src/libs/damap")
  ```

* Alternatively, use relative imports inside the library for full portability

---

## 🧪 Build

```bash
npm run build
```

---

## 🧭 Recommended Workflow

1. Develop inside `damap-ui`
2. Keep reusable code in `src/libs/damap`
3. Sync to `damap-lib` using subtree
4. Consume in other apps via subtree or package

---

## 🔮 Future Improvements

* Move to full package structure:

```text
packages/damap/
```

* Publish to npm registry
* Add build outputs (`dist/`)
* Remove dependency on app-specific aliases

---

## 👨‍💻 Author

Ather Ashraf
AI / GIS / React / OpenLayers

```

