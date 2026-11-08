# Eval 07: SwiftUI custom button

## User prompt

Add Liquid Glass to my SwiftUI custom button. Should I call glassEffect(_:in:isEnabled:)?

## Skill that should trigger

`liquid-glass-native`

## Expected behavior

- Prefers `.buttonStyle(.glass)` or `.glassProminent` over hand-rolling a material.
- Explicitly rejects the nonexistent `glassEffect(_:in:isEnabled:)` signature.
- If a custom view is needed, uses the DocC-checked `glassEffect(_:in:)` declaration and an availability/older-OS fallback.
- Does not import CSS/WebGL optics or claim a native compilation/device pass.
- Points to the deeper native reference or native-first workflow only when needed.
