---
name: liquid-glass-native
description: Use for native Apple Liquid Glass in SwiftUI, UIKit or AppKit, including a SwiftUI custom button, glassEffect signatures, GlassEffectContainer spacing, UIGlassEffect, system glass button styles, availability fallbacks and Reduce Transparency. Prefer system materials over custom web-style optics.
---

# Liquid Glass native

**Prefer no custom material code.** Standard navigation, controls, buttons and presentation surfaces adopt the system material on the corresponding SDKs. Remove competing custom backgrounds, keep glass in the navigation/overlay layer, and test the oldest supported OS plus Reduce Transparency, Increase Contrast and Reduce Motion.

For a SwiftUI button, first try the system styles rather than drawing a lens:

```swift
Button("OK") { }
    .buttonStyle(.glass)
// Use .glassProminent when the design calls for the prominent variant.
```

## Custom views: verified core

Use availability checks and an older-OS material fallback. Apply geometry, padding and appearance before `glassEffect` so the captured content and shape are correct.

```swift
@ViewBuilder
func materialContent<Content: View>(_ content: Content) -> some View {
    if #available(iOS 26.0, macOS 26.0, tvOS 26.0, watchOS 26.0, *) {
        content.glassEffect(.regular, in: RoundedRectangle(cornerRadius: 16))
    } else {
        content.background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
    }
}
```

The DocC-checked declaration is:

```swift
nonisolated func glassEffect(
    _ glass: Glass = .regular,
    in shape: some Shape = DefaultGlassEffectShape()
) -> some View
```

**There is no `glassEffect(_:in:isEnabled:)` parameter in this declaration.** Do not invent it. `DefaultGlassEffectShape` is a capsule. Use `.regular` for adaptive legibility, `.clear` only over rich media with the required dimming consideration, and `.identity` to opt out; `.tint(...)` and `.interactive(...)` are builders.

## Containers and UIKit

`GlassEffectContainer(spacing:)` uses a **merge threshold**, not layout spacing. A threshold larger than the actual gap can merge shapes at rest; keep it below the gap when shapes must remain separate. Use stable IDs/a namespace for intentional morphing or union.

UIKit hosts `UIGlassEffect` in **`UIVisualEffectView(effect:)`** and places content in `contentView`; there is no documented `UIGlassEffectView` host here. Use `UIGlassContainerEffect` for grouped shapes. AppKit has `NSGlassEffectView` and `NSGlassEffectContainerView`. Verify all release-specific styles, availability and compatibility keys against the deployed SDK.

Full sourced guidance and Apple primary links: [`../../shared/references/13-native-apple.md`](../../shared/references/13-native-apple.md). The extended platform appendix is in `../../shared/references/15-honesty-and-checklists.md`.

## Scope and deeper native workflow

Browser CSS/WebGL recreations do not implement Apple's private material. These declarations were checked against Apple DocC for the package maintenance pass; native samples were not compiled on Apple hardware in this restructure. For full iOS migration workflows, [haider-nawaz/liquid-glass-skill](https://github.com/haider-nawaz/liquid-glass-skill) is the deeper native-first tool.

Part of liquid-glass-suite — install the suite, not this folder alone.
