# DAMap Repository Workflow

## Repository Roles

### 1. damap-lib

**Remote:** `damap-lib`

```
https://github.com/atherashraf/damap-lib.git
```

This is the **library source repository**.

Purpose:

* Main development of DAMap.
* Integrated into client applications (WASA, PULSE, MRDA, etc.) using **Git Subtree**.
* All reusable components and features are developed here first.

Typical client update:

```bash
git subtree pull --prefix=src/libs/damap damap-lib main --squash
```

---

### 2. damap-ui

**Remote:** `origin`

```
https://github.com/atherashraf/damap-ui.git
```

This is the **NPM publishing repository**.

Purpose:

* Contains the complete project required for building and publishing the DAMap package.
* Not intended to be integrated into client projects.
* Used only for packaging, testing, versioning and publishing to NPM.

---

## Branches

### main

Stable branch of the publishing repository.

---

### lib_formulation

Working branch used to:

* Pull the latest subtree from `damap-lib`
* Perform library formulation
* Prepare releases
* Verify build
* Update package metadata
* Test before publishing

Typical workflow:

```bash
git switch lib_formulation
.\src\libs\damap\subtree-pull.bat
npm run build
npm version patch
npm publish
```

---

### damap-lib-main

Snapshot branch.

This branch is recreated from `lib_formulation` after every successful subtree synchronization.

Purpose:

* Represents the latest complete library state.
* Easy comparison with future subtree updates.
* Safe checkpoint before release.
* Quick recovery if needed.

Recreate it after each subtree pull:

```bash
git switch lib_formulation
git branch -D damap-lib-main
git switch -c damap-lib-main
```

---

## Overall Architecture

```
                  damap-lib
           (Library Development)
                     │
                     │
              git subtree pull
                     │
                     ▼
            lib_formulation
      (Library Formulation & Testing)
                     │
                     ▼
             damap-lib-main
        (Release Snapshot Branch)
                     │
                     ▼
              npm version patch
                     │
                     ▼
                npm publish
```

---

## Client Projects

Projects such as:

* WASA
* PULSE
* MRDA
* Other enterprise GIS applications

do **not** reference `damap-ui`.

Instead, they consume the library directly as a subtree from:

```
damap-lib
```

using:

```bash
git subtree pull --prefix=src/libs/damap damap-lib main --squash
```

This keeps all client projects synchronized from a single source of truth while `damap-ui` remains dedicated to packaging and NPM publication.
