# Eval 06: Verify clean optical properties

## User prompt

Tune this Liquid Glass panel without copying another demo. Prove the center is undistorted, the bezel refracts, and the rim responds to light direction.

## Skill that should trigger

`liquid-glass-optics`

## Expected behavior

- Uses the clean SDF-gradient/vector-Snell core and regenerates maps for actual panel geometry.
- Records renderer, browser, geometry, optical settings, owned background and DPR.
- Measures center neutrality, edge growth, vector symmetry, flat interior and directional specular presence/absence.
- Uses suite-owned visual baselines only and names every unrun browser or real-device check.
- Preserves the shared highlight-weighted wash and readable fallback instead of introducing external parameter bundles.
