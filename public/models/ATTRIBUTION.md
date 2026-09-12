# Rocket model attribution

These four GLB files are included in the repository. Each is centered, Y-up, normalized to one scene unit tall, and scaled to a miniature hobby rocket by the renderer. The Mercury files contain capsules only; their boosters and escape towers are original procedural geometry.

| File | Content | Creator and source | Terms |
| --- | --- | --- | --- |
| `saturn-v.glb` | Complete Saturn V | NASA / Michael D. Carbajal; [NASA model page](https://science.nasa.gov/3d-resources/saturn-v/) | [NASA 3D Resources](https://github.com/nasa/NASA-3D-Resources) and [NASA usage guidance](https://www.nasa.gov/nasa-brand-center/images-and-media/) |
| `mercury-redstone.glb` | Freedom 7 Mercury capsule | NASA / Michael D. Carbajal; [NASA model page](https://science.nasa.gov/3d-resources/redstone-3-freedom-7/) | Same NASA terms |
| `mercury-atlas.glb` | Friendship 7 Mercury capsule | NASA / Michael D. Carbajal; [NASA model page](https://science.nasa.gov/3d-resources/atlas-6-friendship-7/) | Same NASA terms |
| `falcon-9.glb` | Assembled Falcon 9 with fairing and stowed legs | [Fac-tory-o, Falcon 9 STL](https://commons.wikimedia.org/wiki/File:Falcon_9.stl) | [Creative Commons Attribution-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/) |

## NASA conversions

NASA's repository describes its resources as free and without copyright, with usage guidelines linked above. NASA names and insignia do not imply endorsement.

The NASA assets retain their materials and embedded textures. A parent-node transform centers and normalizes each model. The Mercury capsules were Draco-decompressed without remeshing. Saturn V retains its material and WebP texture extensions. Runtime geometry adds the scale mounts, stabilizing fins where needed, and recovery presentation.

## Falcon 9 adaptation — CC BY-SA 4.0

The original STL contained an assembled and an exploded copy. This project extracted the assembled half, seated the upper stage in its interstage, simplified it from 556,278 to 79,330 triangles, centered and rotated it, normalized its height, and added a neutral material. The renderer adds a game livery and virtual clear stabilizing fins. The original mesh had no textures.

The adapted mesh remains **CC BY-SA 4.0**. Keep the creator credit, source, license link, and modification notice when sharing it; adaptations of the mesh must follow that license's ShareAlike terms. The project's code license does not replace these asset terms.

## Original models and excluded research assets

The Estes-style fleet, launch equipment, Mercury boosters, parachutes, and landscape are original procedural recreations. They are not official downloadable Estes meshes. See [ASSETS.md](../../ASSETS.md) for manufacturer references, motor data provenance, and the complete recreation fleet.

Research downloads with unclear or restrictive redistribution terms are excluded. The repository does not include the Apogee RockSim designs, third-party noncommercial Falcon alternatives, or restricted Estes pad/controller downloads. Only the four credited GLBs above are shipped.
