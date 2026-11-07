# Native Apple

Use this self-contained route for SwiftUI, UIKit, or AppKit. Browser optics and the standalone showcase are recreations, not implementations of Apple's private material.

## Prefer the system

Standard navigation, controls, and presentation surfaces adopt Liquid Glass on the corresponding SDKs. Remove competing custom backgrounds before adding effects. Keep glass subordinate to content. Use availability checks and a real older-OS fallback.

```swift
import SwiftUI

@ViewBuilder
func materialContent<Content: View>(_ content: Content) -> some View {
    if #available(iOS 26.0, macOS 26.0, tvOS 26.0, watchOS 26.0, *) {
        content.glassEffect(.regular, in: RoundedRectangle(cornerRadius: 16))
    } else {
        content.background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
    }
}
```

Apple's current DocC declaration:

```swift
nonisolated func glassEffect(
    _ glass: Glass = .regular,
    in shape: some Shape = DefaultGlassEffectShape()
) -> some View
```

There is no `isEnabled:` parameter in this declaration. `DefaultGlassEffectShape` is a capsule. Apply geometry, padding, and appearance before `glassEffect` so the captured shape is correct.

Variants: `.regular` for adaptive legibility, `.clear` for rich media backdrops, `.identity` to opt out. Builders include `.tint(...)` and `.interactive(...)`. Use native `.buttonStyle(.glass)` or `.glassProminent` where appropriate rather than hand-rolling a button material.

## Containers and spacing

`GlassEffectContainer` combines effect shapes for performance and morphing. Its `spacing` is a **merge threshold**, not layout spacing. Increasing it makes nearby shapes begin blending sooner.

```swift
GlassEffectContainer(spacing: 12) {
    HStack(spacing: 24) {
        Image(systemName: "pencil").padding().glassEffect()
        Image(systemName: "eraser").padding().glassEffect()
    }
}
```

If shapes should stay separate at rest, keep the merge threshold below their actual separation. If merging is intended, use a larger threshold or `glassEffectUnion(id:namespace:)`. Never require the threshold to exceed the stack spacing for every design; that is what causes unintended merging.

For morphing, use a shared namespace, stable `glassEffectID` values, and an animated hierarchy change. Release-specific menu/container workarounds need a reproducible target-SDK bug, not a blanket ban.

## UIKit

```swift
if #available(iOS 26.0, *) {
    let effect = UIGlassEffect(style: .regular)
    effect.isInteractive = true
    effect.tintColor = .systemOrange
    let view = UIVisualEffectView(effect: effect)
    // Put labels and controls in view.contentView.
}
```

`UIGlassEffect` is an effect; **`UIVisualEffectView(effect:)`** is its host. Do not invent `UIGlassEffectView`. Use `UIGlassContainerEffect` for grouped shapes. Verify the exact availability and button-configuration APIs against the deployed SDK.

## AppKit and platform-specific APIs

AppKit offers `NSGlassEffectView` and `NSGlassEffectContainerView`; validate styles and properties in current Apple documentation before using them. Scroll/background APIs are platform-specific: do not mix visionOS `glassBackgroundEffect` guidance into a universal iOS modifier chain.

Compatibility keys such as `UIDesignRequiresCompatibility` are temporary SDK-era escape hatches, not a durable migration plan. Verify their support in the SDK being shipped.

## Accessibility and verification

- Test Reduce Transparency, Increase Contrast, Reduce Motion, and system appearance changes.
- Prefer system colors and controls; custom fills and animation do not automatically inherit every adaptation.
- Test the oldest supported OS and the target SDK. The browser package does not compile native samples or claim a native-runtime pass.
- No numeric blur, displacement, or layer-budget value in this package is an Apple standard.

## Primary sources

- [Applying Liquid Glass to custom views](https://developer.apple.com/documentation/swiftui/applying-liquid-glass-to-custom-views)
- [glassEffect(_:in:)](https://developer.apple.com/documentation/swiftui/view/glasseffect(_:in:))
- [GlassEffectContainer](https://developer.apple.com/documentation/swiftui/glasseffectcontainer)
- [UIGlassEffect](https://developer.apple.com/documentation/uikit/uiglasseffect)
- [UIVisualEffectView](https://developer.apple.com/documentation/uikit/uivisualeffectview)

The declaration and spacing semantics above were checked against Apple's DocC JSON for this package's maintenance pass. Other signatures must be checked against the target SDK; the extended contextual appendix is `references/honesty-and-checklists.md`.
