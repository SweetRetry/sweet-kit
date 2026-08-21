# TypeScript 7.0 Upgrade Guide

Source: [Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/) (July 8, 2026)

## Installation

The package name is still `typescript` on npm. Install as usual:

```bash
npm install -D typescript
# or
pnpm add -D typescript
```

This installs the new native Go-based `tsc` binary (version ^7.0.2).

### Running side-by-side with TypeScript 6

TypeScript 7.0 does **not** ship with a programmatic API (the API is expected in 7.1). For tools that depend on `import "typescript"` (e.g. typescript-eslint), use the compatibility package via npm alias:

```json
{
  "devDependencies": {
    "@typescript/native": "npm:typescript@^7.0.2",
    "typescript": "npm:@typescript/typescript6@^6.0.2"
  }
}
```

This gives you `tsc` (7.0) and the TS API (6.0) side-by-side. `npx tsc` runs 7.0.

Nightly builds: `npm install -D typescript@next` (the `@typescript/native-preview` package is being retired).

Source: [Running Side-by-Side with TypeScript 6.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0)

## New tsconfig Default Changes

TypeScript 7.0 adopts TypeScript 6.0's new defaults. Notable changes:

| Option | Old Default | New Default (7.0) | Notes |
|--------|-------------|-------------------|-------|
| `strict` | `false` | `true` | |
| `module` | `commonjs` | `esnext` | |
| `target` | `es5` | Current stable ES version before `esnext` | |
| `noUncheckedSideEffectImports` | `false` | `true` | |
| `libReplacement` | `true` | `false` | |
| `stableTypeOrdering` | `false` | `true` (cannot be turned off) | |
| `rootDir` | inferred from includes | `./` | Must be set explicitly if tsconfig sits outside source |
| `types` | all `@types/*` auto-included | `[]` (empty) | Must explicitly list needed types |

Source: [Updates Since 5.x, and New Behaviors from 6.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#updates-since-5.x,-and-new-behaviors-from-6.0)

### Impact on this monorepo

Current config uses `module: NodeNext` / `moduleResolution: NodeNext` which remain fully supported. No change needed.

The `types: []` default means `@types/node` and any other ambient types must be explicitly listed:

```json
{
  "compilerOptions": {
    "types": ["node"]
  }
}
```

The `rootDir: "./"` default may require explicit `rootDir` if the tsconfig sits outside the source directory.

## Removed / Hard-Errored Options

These options are no longer supported and produce hard errors:

| Removed Option | Replacement |
|---|---|
| `target: "es5"` | Use `es2022` or later |
| `downlevelIteration` | No longer needed (ES5 gone) |
| `moduleResolution: "node"` / `"node10"` | Use `nodenext` or `bundler` |
| `module: "amd"` / `"umd"` / `"systemjs"` / `"none"` | Use `esnext` or `preserve` |
| `baseUrl` | Use relative `paths` from project root |
| `moduleResolution: "classic"` | Use `bundler` or `nodenext` |
| `esModuleInterop: false` | Always enabled; cannot be set to `false` |
| `allowSyntheticDefaultImports: false` | Always enabled; cannot be set to `false` |
| `alwaysStrict: false` | Always `true`; cannot be set to `false` |
| `import ... assert` syntax | Must use `import ... with` |

Source: [Updates Since 5.x](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#updates-since-5.x,-and-new-behaviors-from-6.0)

### Impact on this monorepo

- `module: "NodeNext"` and `moduleResolution: "NodeNext"` — **safe**, still supported.
- `module: "ESNext"` and `moduleResolution: "Bundler"` (Next.js config) — **safe**, still supported.
- `target: "ES2022"` — **safe**.
- `esModuleInterop` / `allowSyntheticDefaultImports` — if set to `true`, harmless (matches new forced behavior). If not set, fine.
- `baseUrl` — check if used; if so, must remove and update `paths` to be relative to project root.
- `isolatedModules: true` — still supported.

## New CLI Flags (Parallelization)

TypeScript 7.0 parallelizes parsing, type-checking, and emit. New flags:

| Flag | Default | Purpose |
|------|---------|---------|
| `--checkers N` | 4 | Number of parallel type-checker workers |
| `--builders N` | 1 | Number of parallel project reference builders (for `--build`) |
| `--singleThreaded` | off | Disable all parallelization |

- `--checkers 8` provides up to 16x speedup on large codebases.
- `--builders` is multiplicative with `--checkers`: `--checkers 4 --builders 4` = up to 16 type-checkers running.
- CI runners with limited resources may benefit from `--checkers 1` or `--singleThreaded`.
- Varying `--checkers` may surface order-dependent results in rare cases.
- Varying `--builders` should not affect results.

Source: [Custom Scaling: Parallelization and Controls](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#custom-scaling:-parallelization-and-controls)

### Recommendation for this monorepo

For `--build` mode with project references, `--builders 2 --checkers 4` is a reasonable starting point. Tune based on observed CI memory usage.

## Watch Mode

`--watch` is completely rebuilt, powered by a Go port of [@parcel/watcher](https://www.npmjs.com/package/@parcel/watcher). Cross-platform, no polling, efficient with large `node_modules`.

Source: [Improved --watch Mode](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#improved---watch-mode)

## Editor Support

- VS Code: install the [TypeScript 7 extension](https://marketplace.visualstudio.com/items?itemName=TypeScriptTeam.native-preview). Built on LSP with multi-threaded language service.
- Visual Studio: automatic based on workspace TS version.
- Vue, Svelte, Astro, MDX: **not yet compatible** with TypeScript 7. These frameworks rely on language server plugins that need the TS API (shipping in 7.1). Continue using TypeScript 6 for editor support in these projects.
- Angular: can use TS 7 for `tsc` builds, but needs TS 6 for editor template checking.

Source: [Editor Experience](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#editor-experience), [TypeScript and Embedded Languages](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#typescript-and-embedded-languages)

## Project References / Monorepo Changes

- Project references continue to work as before.
- `--build` mode gains parallelization via `--builders N`.
- `--isolatedDeclarations` enables further parallelization by allowing declaration emit without full type-checking (separate syntactic emit).
- The dependency graph of projects remains the bottleneck for `--build` parallelization.

Source: [Project Reference Builder Parallelization](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#project-reference-builder-parallelization)

## Other Breaking Changes

- Template literal type inference now preserves full Unicode code points (emoji no longer split into surrogate pairs).
- `/// <reference no-default-lib />` directives no longer respected under `skipDefaultLibCheck`.
- Command-line builds cannot take file paths when a `tsconfig.json` exists unless `--ignoreConfig` is passed.
- Various JavaScript/JSDoc support changes (Closure syntax removed, `@enum`/`@class` behavior changed). See [CHANGES.md](https://github.com/microsoft/typescript-go/blob/main/CHANGES.md).
- Under `--skipLibCheck`, conflicting declarations now error in all contributing non-.d.ts files (previously only errored in one site).

Source: [CHANGES.md](https://github.com/microsoft/typescript-go/blob/main/CHANGES.md)

## Upgrade Checklist for sweet-kit

1. [ ] Remove `baseUrl` if present; update `paths` to be relative to project root.
2. [ ] Add `"types": ["node"]` (and any other needed `@types`) to base tsconfig.
3. [ ] Verify `rootDir` is explicitly set in each project tsconfig (or that the default `./` is correct).
4. [ ] Install `typescript@^7.0.2` (or use side-by-side setup if tools need the API).
5. [ ] Wait for typescript-eslint and other tooling to support TS 7 API (expected in 7.1) or use the `@typescript/typescript6` alias.
6. [ ] Test with `pnpm typecheck` and `pnpm verify`.
7. [ ] Consider adding `--builders 2` to `tsc --build` in CI for monorepo parallelism.
8. [ ] Install the VS Code TypeScript 7 extension for editor performance.
