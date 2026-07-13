# Academic Lanyard Badge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an interactive React Bits-style Lanyard badge to the academic page, showing Wang Maolin's existing portrait and verified contact details.

**Architecture:** Keep the physics, rope joints, meshline band, drag interaction, and Three.js canvas of React Bits Lanyard. Generate the required local `card.glb` and `lanyard.png` assets reproducibly, load them from `public/` so the Next.js static export does not depend on Vite asset imports, and create exact front/back badge textures at runtime from the existing portrait and contact data. The academic page loads the WebGL component client-side.

**Tech Stack:** Next.js 16, React 19, JavaScript + CSS, Three.js, `@react-three/fiber`, `@react-three/drei`, `@react-three/rapier`, `meshline`, Node test runner

## Global Constraints

- Preserve the existing Next.js static-export and `NEXT_PUBLIC_BASE_PATH` behavior.
- Reuse `public/profile.jpg`; do not synthesize or alter the user's portrait.
- Use the exact verified contacts already present in the site: `2335060723@st.usst.edu.cn`, `forestbiankiii@gmail.com`, and `github.com/forestbiankiii`.
- Keep the academic page bilingual and ensure the badge has an accessible text fallback.
- Do not disturb existing untracked user files.

---

### Task 1: Lanyard contract test

**Files:**
- Create: `tests/academicLanyard.test.mjs`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: existing `app/academic/page.tsx`, `public/profile.jpg`, and `withBasePath(path)`.
- Produces: an executable contract describing the component files, physics dependencies, verified identity data, and page integration.

- [ ] **Step 1: Write the failing test**

```js
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("provides the React Bits lanyard interaction contract", () => {
  const source = read("../components/Lanyard.jsx");
  assert.equal(existsSync(new URL("../public/lanyard/card.glb", import.meta.url)), true);
  assert.equal(existsSync(new URL("../public/lanyard/lanyard.png", import.meta.url)), true);
  assert.match(source, /@react-three\/fiber/);
  assert.match(source, /@react-three\/rapier/);
  assert.match(source, /MeshLineGeometry/);
  assert.match(source, /useRopeJoint/);
  assert.match(source, /setPointerCapture/);
  assert.match(source, /frontImage/);
  assert.match(source, /backImage/);
});

test("builds a badge from the existing portrait and verified contacts", () => {
  const source = read("../components/AcademicLanyard.jsx");
  assert.equal(existsSync(new URL("../public/profile.jpg", import.meta.url)), true);
  assert.match(source, /profile\.jpg/);
  assert.match(source, /Wang Maolin/);
  assert.match(source, /2335060723@st\.usst\.edu\.cn/);
  assert.match(source, /forestbiankiii@gmail\.com/);
  assert.match(source, /github\.com\/forestbiankiii/);
});

test("loads the WebGL badge client-side on the academic page", () => {
  const source = read("../app/academic/page.tsx");
  assert.match(source, /AcademicLanyard/);
  assert.match(source, /ssr:\s*false/);
  assert.match(source, /interactiveBadge/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/academicLanyard.test.mjs`

Expected: FAIL because `components/Lanyard.jsx` and `components/AcademicLanyard.jsx` do not exist.

- [ ] **Step 3: Add only the two missing runtime dependencies**

Run: `npm install meshline @react-three/rapier`

Expected: `package.json` and `package-lock.json` record both dependencies without replacing the package manager.

### Task 2: Interactive badge component

**Files:**
- Create: `components/Lanyard.jsx`
- Create: `components/Lanyard.css`
- Create: `components/AcademicLanyard.jsx`
- Create: `scripts/generate-lanyard-assets.mjs`
- Create: `public/lanyard/card.glb`
- Create: `public/lanyard/lanyard.png`

**Interfaces:**
- Consumes: `frontImage`, `backImage`, `position`, `gravity`, `fov`, `transparent`, and `lanyardWidth` props.
- Produces: `Lanyard(props)` and `AcademicLanyard({ lang })` client components.

- [ ] **Step 1: Generate the required local assets**

Create `scripts/generate-lanyard-assets.mjs` with Three.js `GLTFExporter`, a Node-compatible `FileReader` shim, and a small PNG encoder. Generate a card model with named `card`, `clip`, and `clamp` meshes plus a dark navy/lime repeating band texture in `public/lanyard/`.

- [ ] **Step 2: Implement the minimal React Bits interaction**

Create `Lanyard.jsx` with a `Canvas`, Rapier `Physics`, three rope segments, a spherical card joint, a `meshline` band, pointer capture drag behavior, `useGLTF(withBasePath("/lanyard/card.glb"))`, `useTexture(withBasePath("/lanyard/lanyard.png"))`, and independent front/back Three.js materials.

- [ ] **Step 3: Generate exact badge faces in the browser**

Create `AcademicLanyard.jsx` with a canvas-texture builder that loads `withBasePath("/profile.jpg")`, draws the portrait without altering it, and writes the exact name, institution, two email addresses, and GitHub URL. Pass both generated data URLs to `Lanyard` and render a screen-reader-only contact summary.

- [ ] **Step 4: Add responsive component CSS**

Create `Lanyard.css` with a bounded desktop canvas, a shorter mobile canvas, touch-safe interaction, a loading state, and reduced-motion guidance.

- [ ] **Step 5: Run the focused test**

Run: `npm test -- tests/academicLanyard.test.mjs`

Expected: the first two tests pass while the page integration test still fails.

### Task 3: Academic page integration

**Files:**
- Modify: `app/academic/page.tsx`

**Interfaces:**
- Consumes: `AcademicLanyard({ lang })`.
- Produces: a bilingual `interactiveBadge` dictionary entry and a full-width badge section between the profile overview and research-group section.

- [ ] **Step 1: Add the client-only import and dictionary content**

Use `dynamic(() => import("@/components/AcademicLanyard"), { ssr: false })`. Add `interactiveBadge` text with eyebrow, title, body, and drag hint in English and Chinese.

- [ ] **Step 2: Render the responsive section**

Add a neutral section with explanatory copy and a `min-h` canvas container. Keep the interactive card below the fixed navigation, use semantic heading order, and expose the drag hint as visible text.

- [ ] **Step 3: Run the focused test**

Run: `npm test -- tests/academicLanyard.test.mjs`

Expected: PASS.

### Task 4: Full validation and graph refresh

**Files:**
- Modify: `graphify-out/*` through the deterministic update command.

**Interfaces:**
- Consumes: all completed source changes.
- Produces: passing repository tests, a successful static build, and a current knowledge graph.

- [ ] **Step 1: Run all tests**

Run: `npm test`

Expected: all tests pass with zero failures.

- [ ] **Step 2: Run the production build**

Run: `npm run build`

Expected: Next.js completes the static export including `/academic/`.

- [ ] **Step 3: Refresh Graphify**

Run: `graphify update .`

Expected: the graph records the new components and the updated academic page. If the executable is still unavailable, report that specific limitation without modifying the graph by hand.

- [ ] **Step 4: Review the final diff**

Run: `git diff --check` and `git status --short`.

Expected: no whitespace errors and only the intended files are changed.
