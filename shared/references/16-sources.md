# Sources and attribution

## Package authorship and standalone scope

Liquid Glass Suite was supplied by Moslem Adib (`admos98`). The repository's MIT license covers the author's package code, documentation, tests, and supplied artwork to the extent the author holds those rights. `NOTICE` travels with the repository and release archives.

The browser showcase is adapted from the author's Azmoonsaz reference playground and is distributed as a self-contained offline HTML file. “Standalone” refers to packaging, not clean-room or independent implementation authorship.

Optical technique and inherited implementation lineage are attributed to **Chris Feijoo (`kube`)**, whose article explains the surface profile, Snell displacement, SVG maps, and reflective specular construction:

- [Liquid Glass in the Browser — kube.io](https://kube.io/blog/liquid-glass-css-svg/)
- [Chris Feijoo — GitHub](https://github.com/kube)
- [Azmoonsaz](https://github.com/admos98/Azmoonsaz), reference commit `0fa31b94a86efb6390fd52f53d61b76464acf6bc`.

The restored standalone source header is in `shared/assets/showcase/optics.js`. The origin hash is recorded in `shared/assets/showcase/source-manifest.json`. No external comparison implementation or baseline is bundled. The package does not bundle kube.io's site application bundle, article text, fonts, music artwork, or pre-generated site maps.

**License boundary:** attribution is not proof of a third-party license. No permissive license for substantial inherited upstream implementation was established. Do not describe the upstream site code as MIT or Apache-2.0, and review/obtain any required permission before public redistribution. The author's MIT license does not grant rights to third-party code.

## Compared peers, not bundled dependencies

- [rdev/liquid-glass-react](https://github.com/rdev/liquid-glass-react), MIT, copyright MAX ROVENSKY. Compared for implementation and support claims; not a declared bundled dependency.
- [Zettersten skills](https://github.com/Zettersten/skills) and [LiquidGlassSkill](https://github.com/stormaref/LiquidGlassSkill). Compared as agent-skill peers, not install dependencies.

Do not append licenses for unrelated comparison projects and thereby suggest code was copied when it was not. If a future patch copies code, include that project's exact notice and applicable license.

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

Native declaration and container-spacing corrections were checked against Apple's DocC JSON. Browser-support prose inherited from field reports is not a fresh device pass. Conservative gates and explicit fallbacks remain required.

## Packaging documentation

- [Agent Skills format](https://agentskills.io/specification)
- [Claude Code plugin manifest reference](https://code.claude.com/docs/en/plugins-reference)
- [Claude Code marketplace reference](https://code.claude.com/docs/en/plugins/marketplace-reference)
- [Hermes skills documentation](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills)

The current marketplace points to the repository root and Claude Code auto-discovers the four standard `skills/<name>/SKILL.md` folders.

## Evidence scope

The synthetic fixtures validate measurement tools. `tests/browser/showcase.spec.mjs` validates the restored standalone runtime, exact original presets and 2× maps, imported state, interaction, accessibility preferences, explicit fallback, and comparison mode. It does not compare against an external implementation. Actual execution is recorded in `tests/evidence/verification.txt`.

Historical production numbers remain contextual examples with `src:` tags. They are not new measurements of this package, browser standards, or Apple's numerical specifications.
