# Repository Guidelines

## Project Structure & Module Organization
- `src/app` contains the Next.js app router entry points, global styles, and layout bootstrap.
- `src/components` houses UI pieces; `layout/` for chrome, `workspace/` for canvas interactions, `shared/` for cross-cut widgets.
- `src/lib`, `src/store`, and `src/types` provide utilities, Zustand stores, and shared TypeScript contracts.
- `public/` stores static assets such as SVG template icons and logos.
- Build outputs remain in `.next/` (git-ignored); no dedicated server or scripts folder.

## Build, Test, and Development Commands
- `npm run dev` – launch the local Next.js dev server with hot reload.
- `npm run build` – create the production bundle; run before shipping to catch compile issues.
- `npm run start` – serve the production build locally for smoke tests.
- `npm run lint` – execute ESLint across TypeScript/React sources; resolves most style issues.

## Coding Style & Naming Conventions
- TypeScript with ES2022 modules; prefer functional React components and hooks.
- Use two-space indentation, trailing commas where valid, and descriptive camelCase identifiers.
- Centralize colors and reusable tokens under `src/app/globals.css`; leverage utility classes before ad-hoc styles.
- Run `npm run lint -- --fix` when available rather than manual formatting tweaks.

## Testing Guidelines
- No automated test suite yet; validate changes via `npm run lint` and manual UI verification in `npm run dev`.
- When adding tests, follow `*.test.ts` naming inside a colocated `__tests__/` folder or alongside the module.

## Commit & Pull Request Guidelines
- Commit messages in history use short, imperative headlines (e.g., “Update canvas uploader border states”).
- Scope each commit to a logical change set and include relevant assets or schema updates.
- Pull requests should describe intent, list validation steps (lint/build/dev run), and include screenshots or recordings for UI changes.
- Reference related issues or tasks, and note any configuration changes or new environment expectations.

## Security & Configuration Tips
- Avoid committing credentials; `.env` files stay local. Document required variables inside PRs or deployment notes.
- Review console logs for stray debug output before merging to keep the production console clean.
