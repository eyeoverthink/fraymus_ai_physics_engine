# FRAYMUS Engine Progress

**Updated:** 2026-09-05  
**Method:** Build one dependency at a time; compile, test, document, then advance.

## Multidimensional data direction

FRAYMUS Core will support aligned data layers over stable three-dimensional coordinates:

```text
Spatial layer       [16][16][16]
Rigid-body layer    [16][16][16]
Energy/state layer  [16][16][16]
Framebuffer layer   [16][16][16]
```

Layers share coordinates but remain separate. This allows a renderer or inspector to select a z-level, compare aligned data, hide layers, or look behind one layer without forcing collision behavior between unrelated data.

## Completed step: fixed spatial lattice

- Added one renderer-independent generic `16 × 16 × 16` lattice.
- Uses stable flat storage for 4,096 cells.
- Supports bounds-checked get, set, single-cell clear, and whole-layer clear.
- Defines deterministic coordinate addressing with x changing fastest, then y, then z.
- Contains no rigid-body logic, collision logic, renderer dependency, or wall-clock dependency.

## Current verification

- Focused lattice tests cover dimensions, coordinate isolation, stable corner indices, clearing, and invalid coordinates: passed.
- Full Maven clean verification: passed.

## Next single step

Define the immutable data record stored in a rigid-body layer. It should describe state such as velocity, gravity response, mass, capacity, energy, and an individual deterministic time/tick value. It must not yet integrate forces, resolve collisions, or render framebuffer data.

## Later steps, not started

1. Rigid-body data layer aligned to the spatial lattice.
2. Per-cell deterministic data clocks driven by simulation `dt`.
3. Force/gravity integration.
4. Collider data and explicit collision participation.
5. Layer selection and z-slice inspection.
6. Managed framebuffer data layer and Java2D visualization.