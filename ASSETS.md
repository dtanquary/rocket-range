# 3D asset register

## NASA scale fleet

The following files come from [NASA 3D Resources](https://github.com/nasa/NASA-3D-Resources), whose repository states these resources are free and without copyright. NASA names and insignia do not imply endorsement. Assets are rescaled and aligned in the renderer for hobby-scale flights.

| Local file | Model | Creator/source |
| --- | --- | --- |
| `public/models/saturn-v.glb` | Saturn V | NASA / Michael D. Carbajal; NASA 3D Resources |
| `public/models/mercury-redstone.glb` | Redstone 3 (Freedom 7) | NASA 3D Resources |
| `public/models/mercury-atlas.glb` | Atlas 6 (Friendship 7) | NASA 3D Resources |

## Original parametric assets

The Mercury boosters and escape towers, Estes rocket recreations, the launch pad, launch controller, parachutes, and field geometry are original procedural meshes. Rocket dimensions and compatible engine selections are based on the manufacturer pages linked in `lib/rocket/catalog.ts`. They are not official downloadable Estes meshes. Source research and further imported asset attribution will be added here as assets are integrated.

Motor curves are approximations normalized to representative total impulse; scale-fleet sizes, masses, motor mounts, and recovery equipment are game parameters. This is not an engineering flight predictor.

## Falcon 9

`public/models/falcon-9.glb` derives from [Fac-tory-o’s Falcon 9 STL](https://commons.wikimedia.org/wiki/File:Falcon_9.stl). The adapted mesh is distributed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). It was extracted from the assembled half, simplified to 79,330 triangles, assembled at the interstage, normalized, and given a game livery. The asset and license are linked in the in-game credits.

The NASA Mercury files contain capsules only. Original procedural Redstone and Atlas boosters and escape towers complete these vehicles. Saturn V is a complete imported NASA vehicle. Imported assets have been normalized and rescaled.

See `public/models/ATTRIBUTION.md` for full download URLs, source terms, conversion details, and research gaps. Downloadable RockSim designs from Apogee informed reference research, but are not redistributed because an explicit redistribution license was not found. Existing Porta-Pad II OpenRocket and modified Electron Beam enclosure models were found; access or licensing prevented reuse. The game uses original equipment recreations.

## Current Estes recreation fleet

Alpha III, Big Bertha, Baby Bertha, Big Daddy, Der Red Max, Mean Machine, Patriot M-104, Executioner, Cherokee-E, Bull Pup 12D, Red Nova, Super Big Bertha. Manufacturer references are linked per rocket in the catalog. Shape dimensions and flight parameters are approximate; paints and markings are original interpretations.
