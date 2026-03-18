
# damap-lib

`damap-lib` is the reusable library part of DAMap, extracted from the main `damap-ui` development repository.

This repository is intended to contain the reusable GIS/map library code only.

---

## Purpose

This repo is used for:

- sharing the DAMap library with other applications
- keeping the reusable map code separate from demo/app code
- syncing library changes from the main development repo

---

## Source of Truth

At the moment, the main development happens in:

- `damap-ui`

Inside that repo, the DAMap library lives under:

- `src/lib`

This `damap-lib` repo is synced from that folder.

---

## Sync Workflow

### Push changes from `damap-ui` to `damap-lib`

Run these commands inside the `damap-ui` repository:

```bash
git subtree split --prefix=src/lib -b damap-lib-branch
git push damap-lib damap-lib-branch:main --force
git branch -D damap-lib-branch
````

### Pull changes from `damap-lib` back into `damap-ui`

Run these commands inside the `damap-ui` repository:

```bash
git fetch damap-lib
git subtree pull --prefix=src/lib damap-lib main --squash
```

---

## Remote Setup

Inside `damap-ui`, add the library repo as a remote:

```bash
git remote add damap-lib https://github.com/atherashraf/damap-lib.git
```

Check remotes:

```bash
git remote -v
```

---

## Recommended Workflow

Best practice is:

1. develop library code inside `damap-ui`
2. keep reusable code under `src/lib`
3. push library updates to `damap-lib`
4. use `damap-lib` in other applications

This keeps one main working repo while still providing a reusable standalone library repo.

---

## Integrating `damap-lib` into Another App

There are multiple ways to use this library in another app.

### Option 1: Install from local folder

If `damap-lib` exists locally:

```bash
npm install /path/to/damap-lib
```

Or in `package.json`:

```json
{
  "dependencies": {
    "damap": "file:libs/damap-lib"
  }
}
```

### Option 2: Install from GitHub

```bash
npm install github:atherashraf/damap-lib
```

### Option 3: Add as git subtree inside another app

Inside the target app repo:

```bash
git remote add damap-lib https://github.com/atherashraf/damap-lib.git
git subtree add --prefix=libs/damap damap-lib main --squash
```

Then in the target app `package.json`:

```json
{
  "dependencies": {
    "damap": "file:libs/damap"
  }
}
```

Then run:

```bash
npm install
```

---

## Importing in Another App

Once installed, use it like this:

```ts
import { DAMap, LayerInfoAdmin, MapInfoAdmin } from "damap";
```

For lazy loading:

```ts
const LayerInfoAdmin = lazy(() =>
  import("damap").then((module) => ({ default: module.LayerInfoAdmin }))
);
```

---

## Notes

* The package name is `damap`
* Consumer apps should import from `"damap"`
* React, MUI, and OpenLayers should remain aligned with the host app
* If consuming as a local package, run a fresh install after updates

---

## Build

To build the library:

```bash
npm run build
```

---

## Current Sync Scope

Current subtree sync is based on:

* `src/lib` from `damap-ui`

So sync currently covers library source code.
Root-level config files may need to be maintained separately unless the repo structure is expanded later.

---

## Future Improvement

A future improvement would be to move the library into a dedicated folder such as:

```text
packages/damap/
```

so that subtree sync includes:

* `src`
* `package.json`
* `vite.config.ts`
* `tsconfig*`

in one clean unit.

---
