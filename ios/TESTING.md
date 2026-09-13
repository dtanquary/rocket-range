# Local native testing

## What has been checked

| Check | Evidence |
| --- | --- |
| Flight rules and port parity | 14 passing Unity Edit Mode tests, including 82 saved browser-reference flights |
| Native rendering | Mac player builds and opens; screenshots reviewed before and after the first field/interface polish |
| iPad Simulator startup | ARM64 Unity export and unsigned Xcode Debug build succeed; app installs and launches |
| Device Hub manually | User confirmed that the game is visible and responsive on the booted iPad |
| Complete interactive flight | Still pending a controlled playthrough; do not infer this from startup or numerical tests |
| Physical-device quality | Not yet measured: touch ergonomics, sound, accessibility, frame pacing, thermals, battery |

## Playthrough checklist

Use an iPad landscape Simulator first, then an iPhone landscape Simulator and physical devices. Run the same sequence on both landscape orientations.

1. Select Alpha III and B6-4. Confirm the selected engine has a visible outline, cards fit without clipped text, and the preparation panel scrolls.
2. Open Field. Change wind, wind direction, gusts, rod tilt, and ballast. Confirm estimates update. Set the desired conditions before arming.
3. Load the motor and place the rocket on the pad. Insert the safety key. Confirm the rendered controller key is inserted, its continuity lamp lights, and Launch turns red. Remove the key and confirm both the state and equipment feedback reverse.
4. Select Ground, rearm, and press Launch. Confirm a short ignition delay, retained Ground selection, automatic flight, and locked physical controls. No reset, steering, throttle, pause, or speed control should appear.
5. During ascent, switch to Follow, then Onboard. Confirm Onboard translates and rotates with the rocket. During recovery, return to Follow and observe the nose, cord, and canopy without camera jerks.
6. Let the rocket land without intervention. Check the outcome, apogee, impact speed, and drift. Some configurations fail recovery; the game must report the simulated outcome honestly.
7. Prepare another flight. Confirm setup becomes editable and no old smoke, recovery geometry, or sound persists into the next launch.
8. Select Falcon 9, Saturn V, Mercury-Redstone, and Mercury-Atlas in turn. Check model visibility and framing. Complete at least one imported-model recovery flight.
9. Test pinch/drag outside controls, scrolling inside panels, sound mute, Credits, and panel visibility during flight. These actions must not change the physics.
10. Review the sky from Ground and Follow: separated cloud patches, open blue sky, and a readable rocket silhouette. Inspect the bench, pad, and rocket close up. Listen to the small-motor sound and check that it ends at burnout.

Record device, OS, build commit, steps, actual results, and any reproduction conditions. Keep simulator and physical-device findings separate.

## Current automation blocker

The native UI tool repeatedly returns `timeoutReached` when attaching to Xcode beta's Device Hub. Finder responds through the same tool, and the user can operate Device Hub manually. Fresh UI sessions and reopening the app through Finder did not resolve attachment.

The local Mac preview supports screenshot inspection. Its automated coordinate clicks were not a reliable substitute: temporary event logs showed clicks received at a different location from the requested controls. No input workaround or diagnostic logging is shipped for that tool issue.

To retry interactively, quit and reopen Device Hub manually, open the booted iPad screen, then retry the UI connection. If attachment still fails, use the checklist manually while the connection is repaired, or explicitly authorize a dedicated Xcode UI-test driver as an alternate automation method. A supported stable Xcode/Simulator installation is another environment to try; it has not been tested here and is not a confirmed fix.

## Commands

See [README.md](README.md) for local Unity, Simulator, device, and Mac build commands. No checks run through GitHub Actions or a hosted service. Generated builds and logs remain ignored.
