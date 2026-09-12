# Rocket assets collected 2026-09-12

## Ready GLBs

All ready GLBs are Y-up, centered horizontally, exactly 1 scene unit tall, with lowest geometry at y=0. Apply a uniform size multiplier in the game. Model proportions are preserved. NASA materials, texture image bytes, and material extensions are preserved; normalization is a parent node matrix. Capsule files were decompressed using DracoPy without remeshing.

| File | What it contains | Author / source | License / reuse | Changes |
|---|---|---|---|---|
| `saturn-v-ready.glb` | Complete Saturn V, 34,814 triangles, 927,684 bytes | NASA/Michael D. Carbajal; https://science.nasa.gov/3d-resources/saturn-v/ | NASA 3D Resources README says assets are free and without copyright; https://github.com/nasa/NASA-3D-Resources ; NASA usage guidance https://www.nasa.gov/nasa-brand-center/images-and-media/ | Centered, normalized to 1m, original appearance preserved |
| `falcon-9-assembled.glb` | Complete assembled Falcon 9 with fairing and stowed legs, 79,330 triangles, ~1.52 MB | Fac-tory-o; https://commons.wikimedia.org/wiki/File:Falcon_9.stl | CC BY-SA 4.0, https://creativecommons.org/licenses/by-sa/4.0/ . Credit author, source, license, and modifications. Distribute this adapted mesh under CC BY-SA 4.0. | Extracted assembled half of two-rocket STL, seated upper stage into interstage to close the source display gap, simplified from 556,278 triangles, centered, rotated, normalized to 1m; neutral white material added. Original had no textures. |
| `mercury-redstone-ready.glb` | **Freedom 7 Mercury capsule only; no Redstone booster or escape tower.** 163,880 triangles, 5,081,032 bytes | NASA/Michael D. Carbajal; https://science.nasa.gov/3d-resources/redstone-3-freedom-7/ | Same NASA terms above | Draco decompressed; centered; normalized to 1m; appearance preserved |
| `mercury-atlas-ready.glb` | **Friendship 7 Mercury capsule only; no Atlas booster or escape tower.** 164,622 triangles, 5,088,696 bytes | NASA/Michael D. Carbajal; https://science.nasa.gov/3d-resources/atlas-6-friendship-7/ | Same NASA terms above | Draco decompressed; centered; normalized to 1m; appearance preserved |

NASA source files are `saturn-v.glb`, `mercury-redstone.glb`, and `mercury-atlas.glb`. NASA capsules require a Draco decoder if loading the original compressed files; ready files require none. Saturn's original uses EXT_texture_webp and KHR_materials_specular, retained in the ready copy. Their names on NASA's site describe missions, not full launch-vehicle contents; previews and geometry confirm these are capsules.

Original Falcon STL: `falcon-9.stl`, 55,680,484 bytes, 1,113,608 triangles. Direct download https://upload.wikimedia.org/wikipedia/commons/5/57/Falcon_9.stl?download=1 . It includes assembled rocket at negative x plus exploded rocket at positive x. Original STL units were unspecified; prepared copy uses a 1m display height.

The files `falcon9-elodin.glb` and `falcon9-pyrotechnique.glb` are duplicate **excluded alternatives** downloaded from public GitHub repos before tracing origin. They derive from Forest Katsch's SpaceX Falcon 9 Block 4.5 at https://sketchfab.com/3d-models/spacex-falcon-9-block-45-12285ccc02de4d5c91b00632f0722c92 . The primary page says CC BY-NC and NoAI. Prefer the Wikimedia model above; do not treat a code-repository license as licensing these third-party meshes.

## Estes reference geometry

13 existing RockSim RKT designs downloaded from Apogee Components are in `estes-designs/`. Files use numeric dimensions in millimeters and can be imported into OpenRocket. Source pages and exact direct download URLs are in `apogee-manifest.json`. Extracted dimension summaries are in `estes-dimensions.json`.

No explicit license allowing redistribution of the Apogee designs was found. Treat these as reference measurements, not CC-licensed mesh assets. The file author is not generally specified in the RKT metadata. Source/publisher is Apogee Components; physical kit manufacturer is Estes. Compare measurements to kit product pages, since some source files represent specific older releases or slightly modified kits.

Downloaded designs: Alpha III, Big Bertha, Super Big Bertha, Der Big Red Max, Antar, Mean Machine, New Shepard, Vesta Intruder, Mercury Redstone, So Long, Black Brant XII, Nike Smoke Pro Series II, NASA SLS. Vapor and Vogel source pages did not expose RKT downloads.

For reputable OpenRocket libraries, use K'Tesh's meticulously measured .ork designs on The Rocketry Forum: https://www.rocketryforum.com/threads/kteshs-openrocket-files.123564/ . His Alpha livery files are on page 6 and Der Red Max files on page 7. He reports fin scans and personal kit measurements. A library index is https://www.rocketryforum.com/designs/ ; RocketReviews also indexes public user designs at https://www.rocketreviews.com/openrocket-index-designer.html . These pages did not establish a blanket redistribution license.

## Equipment and additional mesh leads

- **Estes Porta-Pad II (2215) OpenRocket model**, TRFfan with modifications by Jim Parsons (K'Tesh): https://www.rocketryforum.com/designs/estes-porta-pad-ii-2215.2777/ . 3.8KB ORK; author says legs derived from a scan of real legs, launch hub still needed. Original discussion: https://www.rocketryforum.com/threads/estes-porta-pad-ii-in-or.132163/ . Direct file access/page access returned 403 here, so no pad file was downloaded. No explicit reuse license was confirmed.
- **USB-C powered Estes Electron Beam controller**, author R3verb: https://www.printables.com/model/756050-usb-c-powered-estes-electron-beam-controller . This is a modified replacement enclosure, not a precise stock Electron Beam model. Source announcement https://www.rocketryforum.com/threads/usb-c-powered-estes-electron-beam-controller.177566/ . Printables returned 403; no download/license could be confirmed.
- **Estes Cherokee-E #2408 and Cherokee-D complete STL variants**, JackHydrazine: https://cults3d.com/en/3d-model/various/estes-cherokee-e-model-rocket-kit-2408 . Includes complete `Estes_Cherokee-E_Model.stl` (114.46 x 132.16 x 747.18mm), 1970 Cherokee-D (552.87mm tall), 1971-1983 Cherokee-D and two-stage variants, plus component STLs. Page lists free download but direct access returned 403 and its extracted license field was blank. Not downloaded; not cleared for reuse.
- **Alpha 3D tribute**, Mr Disintegrator: https://pinshape.com/items/44151-3d-printed-alpha-3d-model-rocket . Five STLs; BT-50 / ~15cm tube; looks similar to Alpha III but is explicitly not an exact copy. CC BY-NC-ND plus login required. Excluded because adaptations not permitted under that license.
- **Estes Scorpio 3D**, official: https://estesrockets.com/products/scorpio-3d . Purchase required; personal/noncommercial and digital redistribution prohibited. Excluded.

No full, downloadable, clearly reusable stock Porta-Pad or Electron Beam mesh was obtained in this bounded search. Source product pages for visual reference: https://estesrockets.com/products/electron-beam-launch-controller and https://www.apogeerockets.com/Launch-Accessories/Launch-Pads/Estes-Porta-Pad-II-Launch-Pad-Electron-Beam-Launch-Controller .
