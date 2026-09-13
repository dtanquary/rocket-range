# Rocket Range — iPhone and iPad

A native Unity game with a procedural launch field, 16 model rockets, compatible motors, automatic flight, and parachute recovery. The existing browser game is preserved in [../web/](../web/).

This is the first playable native foundation. [GOALS.md](GOALS.md) records completed verification separately from the planned fidelity, interaction, and device-performance work.

Verified locally: 15 native tests pass, and the ARM64 iOS Simulator app builds in Xcode and launches on an iPad simulator. A Mac preview has been reviewed in screenshots, and the user confirmed manual iPad responsiveness. A controlled full-flight playthrough and physical-device testing remain pending. [TESTING.md](TESTING.md) records the checklist and current automation blocker.

## Open and play

1. Install **Unity 6000.3.11f1** in Unity Hub, including **iOS Build Support**. Package versions are pinned in `Packages/`.
2. Add the `ios/` directory as an existing Unity project. Let packages and assets import.
3. Open `Assets/RocketRange/Scenes/LaunchField.unity` and press Play.
4. Select a rocket and engine, load it, place it on the pad, insert the safety key, and launch. The flight is automatic after a random 0.25–1 second ignition delay.

Drag the field to orbit, use a mouse wheel or pinch to zoom, and choose Orbit, Follow, Ground, or Onboard. Use Field to change wind, gusts, rod settings, or nose ballast before arming. Flight bench toggles the preparation panel. Cameras and sound remain available during flight; they cannot alter its physics.

Orbit travels with the rocket while preserving your viewing angle and zoom. Follow adjusts its framing for recovery. Ground observes from a fixed position, and Onboard is attached to the airframe.

The initial interface supports landscape iPhone and iPad layouts with safe-area handling. Real-device touch ergonomics, accessibility, thermal performance, and battery use still require measurement and refinement.

## Local commands

From the repository root, with the Unity Editor closed for this project:

```sh
./ios/Tools/unity.sh configure
./ios/Tools/unity.sh test
./ios/Tools/unity.sh simulator
```

The script uses the standard Unity Hub installation path. Set `UNITY_EDITOR` if your Unity executable lives elsewhere. Logs and test results are written to ignored `ios/Builds/`.

`configure` regenerates the launch scene and local render/player settings from `Assets/RocketRange/Editor/ProjectSetup.cs`. Unity menu equivalents are available under **Rocket Range**. The project uses URP, Metal, and an iOS 16 deployment target; this does not constitute device-performance certification.

## iOS Simulator

`simulator` exports an ARM64 Simulator Xcode project to `ios/Builds/iOS-Simulator/`. Open `Unity-iPhone.xcodeproj`, select the Unity-iPhone scheme and an installed iPhone or iPad simulator, then Run. A simulator build does not require an Apple signing team.

To compile locally from the terminal after export:

```sh
xcodebuild -project ios/Builds/iOS-Simulator/Unity-iPhone.xcodeproj \
  -scheme Unity-iPhone -configuration Debug -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath ios/Builds/DerivedData \
  CODE_SIGNING_ALLOWED=NO build
```

## Physical devices

`./ios/Tools/unity.sh device` exports a Device SDK project to `ios/Builds/iOS-Device/`. Open that generated project in Xcode, select your local signing team and a connected device, and Run. Personal signing settings belong only in generated, ignored output. Device builds and Simulator builds are separate exports; do not interchange their SDKs in Xcode.

`./ios/Tools/unity.sh mac` optionally builds a local desktop preview of the native scene. No build command publishes or uploads the game.

## Source and validation

- `Assets/RocketRange/Core/`: C# flight integration, immutable launch configuration, preparation state machine, and motor PCM generation. No Unity engine references.
- `Assets/RocketRange/Presentation/`: procedural world and equipment, imported rocket assembly/recovery split, cameras, audio, and touch interface.
- `Assets/RocketRange/Resources/Data/`: generated catalog, source provenance, and browser reference flights.
- `Assets/RocketRange/Tests/Editor/`: numerical parity, workflow, camera, and audio checks.
- `Assets/RocketRange/Editor/`: reproducible scene configuration and local exports.

The flight core preserves the browser's fixed 120 Hz model and its documented approximations. It compares 82 rocket/motor/conditions flights against the browser to within 0.00002 in the checked SI metrics. New physics should change both reference assumptions and tests deliberately. Camera and audio tests are distinct from visual review and listening on actual devices.

To regenerate or check the native data after deliberate catalog/physics changes:

```sh
cd web
npx tsx ../ios/Tools/export-web-data.ts
npx tsx ../ios/Tools/export-web-data.ts --check
```

The native app runs independently of Node and the browser source; Node is only used by the explicit data exporter.

## Credits

Original code and procedural geometry are [MIT](../LICENSE). The four reused GLBs retain their original terms in [model attribution](Assets/RocketRange/Resources/Models/ATTRIBUTION.md). The in-game Credits panel exposes the motor provenance, model credits, and license links. Full recreation references remain in [web/ASSETS.md](../web/ASSETS.md).

The project has no accounts, ads, analytics integration, network-dependent gameplay, hosting, or GitHub automation. Unity packages are downloaded by the editor during development; gameplay assets are bundled locally.
