# Sources and attribution

## Package authorship and license

This package was supplied by Moslem Adib (`admos98`) and maintained as **Ultimate Liquid Glass**. The repository's MIT license covers the author's package code, documentation, tests, and supplied artwork to the extent the author holds those rights. `NOTICE` travels with the repository and release ZIP.

The browser showcase is adapted from the author's Azmoonsaz reference playground. Its original source is attributed explicitly to **Chris Feijoo (`kube`)**, whose article explains the surface profile, Snell displacement, SVG maps, and reflective specular construction:

- [Liquid Glass in the Browser — kube.io](https://kube.io/blog/liquid-glass-css-svg/)
- [Chris Feijoo — GitHub](https://github.com/kube)
- [Azmoonsaz](https://github.com/admos98/Azmoonsaz), reference commit `0fa31b94a86efb6390fd52f53d61b76464acf6bc`.

The included original source header is retained in `assets/showcase/optics.js` and the unmodified test baseline. Source hashes are recorded in `assets/showcase/source-manifest.json` and `tests/reference/source-manifest.json`. The package does not bundle kube.io's application bundle, article text, fonts, music artwork, or pre-generated site maps.

**License boundary:** attribution is not proof of a third-party license. This maintenance pass did not establish a permissive license for kube.io's site code. Do not describe its site bundle as MIT or Apache-2.0, and obtain permission before incorporating substantial copied upstream code into a public distribution. The requested repository remains private. Any future public release should review the inherited implementation's provenance rather than infer permission from another project's README.

## Compared peers, not bundled dependencies

- [rdev/liquid-glass-react](https://github.com/rdev/liquid-glass-react), MIT, copyright MAX ROVENSKY. Compared for implementation and support claims; its source is not a declared bundled dependency.
- [Zettersten skills](https://github.com/Zettersten/skills) and [LiquidGlassSkill](https://github.com/stormaref/LiquidGlassSkill). Compared as agent-skill peers, not incorporated by reference as install dependencies.

Do not append licenses for unrelated comparison projects and thereby suggest code was copied when it was not. If a future patch actually copies code, include that project's exact notice and applicable license at that time.

## Primary native and platform documentation

- [Apple HIG: Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- [Applying Liquid Glass to custom views](https://developer.apple.com/documentation/swiftui/applying-liquid-glass-to-custom-views)
- [glassEffect(_:in:)](https://developer.apple.com/documentation/swiftui/view/glasseffect(_:in:))
- [GlassEffectContainer](https://developer.apple.com/documentation/swiftui/glasseffectcontainer)
- [UIGlassEffect](https://developer.apple.com/documentation/uikit/uiglasseffect)
- [UIVisualEffectView](https://developer.apple.com/documentation/uikit/uivisualeffectview)
- [WebKit issue 245510](https://bugs.webkit.org/show_bug.cgi?id=245510)
- [CSS Syntax: consuming escaped code points](https://www.w3.org/TR/css-syntax-3/#consume-escaped-code-point)
- [Tailwind v4 compatibility](https://tailwindcss.com/docs/compatibility)
- [Tailwind adding custom utilities](https://tailwindcss.com/docs/adding-custom-styles#adding-custom-utilities)

Native declaration and container-spacing corrections were verified against Apple's DocC JSON. Browser-support prose inherited from field reports is not a fresh device pass. Conservative gates and explicit fallbacks remain required.

## Packaging documentation

- [Agent Skills format](https://agentskills.io/specification)
- [Claude Code plugin manifest reference](https://code.claude.com/docs/en/plugins-reference)
- [Hermes skills documentation](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills)

The plugin manifest's `skills: ["."]` names a directory holding `SKILL.md`, not a Markdown file.

## Evidence scope

The fixtures validate the measurement tools. `tests/browser/showcase.spec.mjs` validates the standalone runtime, imported state, accessibility preferences, explicit fallback, and comparison scene. Actual execution is recorded in `tests/evidence/verification.txt`.

Historical production numbers remain contextual examples with `src:` tags. They are not new measurements of this package, browser standards, or Apple's numerical specifications.
