using System;
using System.IO;
using UnityEditor;
using UnityEditor.Build;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;
using UnityEngine.UIElements;

namespace RocketRange.Editor
{
    public static class ProjectSetup
    {
        const string Root = "Assets/RocketRange/";

        [MenuItem("Rocket Range/Configure native project")]
        public static void Configure()
        {
            var data = AssetDatabase.LoadAssetAtPath<UniversalRendererData>(
                Root + "Art/RangeRenderer.asset"
            );
            if (!data)
            {
                data = ScriptableObject.CreateInstance<UniversalRendererData>();
                AssetDatabase.CreateAsset(data, Root + "Art/RangeRenderer.asset");
            }
            var pipeline = AssetDatabase.LoadAssetAtPath<UniversalRenderPipelineAsset>(
                Root + "Art/RangePipeline.asset"
            );
            if (!pipeline)
            {
                pipeline = UniversalRenderPipelineAsset.Create(data);
                AssetDatabase.CreateAsset(pipeline, Root + "Art/RangePipeline.asset");
            }
            // SMAA avoids unsupported HDR multisample targets in the iOS Simulator.
            pipeline.msaaSampleCount = 1;
            pipeline.renderScale = 1;
            pipeline.shadowDistance = 100;
            pipeline.shadowCascadeCount = 4;
            pipeline.mainLightShadowmapResolution = 2048;
            pipeline.supportsCameraDepthTexture = true;
            pipeline.supportsHDR = true;
            GraphicsSettings.defaultRenderPipeline = pipeline;
            QualitySettings.renderPipeline = pipeline;
            var panel = AssetDatabase.LoadAssetAtPath<PanelSettings>(
                Root + "Resources/UI/RangePanel.asset"
            );
            if (!panel)
            {
                panel = ScriptableObject.CreateInstance<PanelSettings>();
                AssetDatabase.CreateAsset(panel, Root + "Resources/UI/RangePanel.asset");
            }
            panel.scaleMode = PanelScaleMode.ScaleWithScreenSize;
            panel.referenceResolution = new Vector2Int(1600, 1000);
            panel.screenMatchMode = PanelScreenMatchMode.MatchWidthOrHeight;
            panel.match = .5f;
            var theme = AssetDatabase.LoadAssetAtPath<ThemeStyleSheet>(
                Root + "Resources/UI/RangeTheme.tss"
            );
            panel.themeStyleSheet = theme;
            PlayerSettings.companyName = "Rocket Range Contributors";
            PlayerSettings.productName = "Rocket Range";
            PlayerSettings.bundleVersion = "0.1.0";
            PlayerSettings.SetApplicationIdentifier(NamedBuildTarget.iOS, "org.rocketrange.game");
            PlayerSettings.iOS.targetOSVersionString = "16.0";
            PlayerSettings.iOS.targetDevice = iOSTargetDevice.iPhoneAndiPad;
            PlayerSettings.iOS.appleDeveloperTeamID = "";
            PlayerSettings.iOS.appleEnableAutomaticSigning = false;
            PlayerSettings.SetScriptingBackend(
                NamedBuildTarget.iOS,
                ScriptingImplementation.IL2CPP
            );
            PlayerSettings.defaultInterfaceOrientation = UIOrientation.AutoRotation;
            PlayerSettings.allowedAutorotateToPortrait = false;
            PlayerSettings.allowedAutorotateToPortraitUpsideDown = false;
            PlayerSettings.allowedAutorotateToLandscapeLeft = true;
            PlayerSettings.allowedAutorotateToLandscapeRight = true;
            PlayerSettings.colorSpace = ColorSpace.Linear;
            PlayerSettings.defaultScreenWidth = 1440;
            PlayerSettings.defaultScreenHeight = 900;
            PlayerSettings.fullScreenMode = FullScreenMode.Windowed;
            PlayerSettings.runInBackground = true;
            PlayerSettings.SetUseDefaultGraphicsAPIs(BuildTarget.iOS, false);
            PlayerSettings.SetGraphicsAPIs(BuildTarget.iOS, new[] { GraphicsDeviceType.Metal });
            // Include runtime-created materials in the player, even before a rocket is selected.
            var graphics = new SerializedObject(
                AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/GraphicsSettings.asset")[0]
            );
            var shaders = graphics.FindProperty("m_AlwaysIncludedShaders");
            foreach (
                var name in new[]
                {
                    "Universal Render Pipeline/Lit",
                    "Universal Render Pipeline/Particles/Unlit",
                    "Skybox/Procedural",
                    "RocketRange/Grass"
                }
            )
            {
                var shader = Shader.Find(name);
                if (!shader)
                    throw new InvalidOperationException("Missing shader " + name);
                bool found = false;
                for (int i = 0; i < shaders.arraySize; i++)
                    found |= shaders.GetArrayElementAtIndex(i).objectReferenceValue == shader;
                if (!found)
                {
                    shaders.InsertArrayElementAtIndex(shaders.arraySize);
                    shaders.GetArrayElementAtIndex(shaders.arraySize - 1).objectReferenceValue =
                        shader;
                }
            }
            graphics.ApplyModifiedPropertiesWithoutUndo();
            EditorUtility.SetDirty(pipeline);
            EditorUtility.SetDirty(panel);
            AssetDatabase.SaveAssets();
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            panel = AssetDatabase.LoadAssetAtPath<PanelSettings>(
                Root + "Resources/UI/RangePanel.asset"
            );
            var game = new GameObject("Rocket Range", typeof(UIDocument), typeof(RangeGame));
            game.GetComponent<UIDocument>().panelSettings = panel;
            var volume = new GameObject("Field color and exposure").AddComponent<Volume>();
            volume.isGlobal = true;
            var profile = AssetDatabase.LoadAssetAtPath<VolumeProfile>(
                Root + "Art/RangeVolume.asset"
            );
            if (!profile)
            {
                profile = ScriptableObject.CreateInstance<VolumeProfile>();
                AssetDatabase.CreateAsset(profile, Root + "Art/RangeVolume.asset");
                var tone = profile.Add<Tonemapping>();
                tone.mode.Override(TonemappingMode.ACES);
                AssetDatabase.AddObjectToAsset(tone, profile);
            }
            volume.sharedProfile = profile;
            EditorSceneManager.SaveScene(scene, Root + "Scenes/LaunchField.unity");
            EditorBuildSettings.scenes = new[]
            {
                new EditorBuildSettingsScene(Root + "Scenes/LaunchField.unity", true)
            };
            EditorUtility.SetDirty(pipeline);
            EditorUtility.SetDirty(panel);
            AssetDatabase.SaveAssets();
            Debug.Log("Rocket Range native scene and local settings configured.");
        }

        [MenuItem("Rocket Range/Build iOS for Simulator")]
        public static void BuildSimulator()
        {
            PlayerSettings.iOS.sdkVersion = iOSSdkVersion.SimulatorSDK;
            PlayerSettings.iOS.simulatorSdkArchitecture = AppleMobileArchitectureSimulator.ARM64;
            Build(BuildTarget.iOS, "Builds/iOS-Simulator");
        }

        [MenuItem("Rocket Range/Build iOS for Device")]
        public static void BuildDevice()
        {
            PlayerSettings.iOS.sdkVersion = iOSSdkVersion.DeviceSDK;
            Build(BuildTarget.iOS, "Builds/iOS-Device");
        }

        [MenuItem("Rocket Range/Build local Mac preview")]
        public static void BuildMac() =>
            Build(BuildTarget.StandaloneOSX, "Builds/Rocket Range.app");

        static void Build(BuildTarget target, string path)
        {
            Configure();
            if (!BuildPipeline.IsBuildTargetSupported(BuildTargetGroup.Unknown, target))
                throw new InvalidOperationException(
                    "Install the requested Unity Build Support module."
                );
            var report = BuildPipeline.BuildPlayer(
                new BuildPlayerOptions
                {
                    scenes = new[] { Root + "Scenes/LaunchField.unity" },
                    locationPathName = path,
                    target = target,
                    options = BuildOptions.Development
                }
            );
            if (report.summary.result != BuildResult.Succeeded)
                throw new InvalidOperationException(
                    "Native build failed: " + report.summary.result
                );
            Debug.Log("Rocket Range build succeeded: " + path);
        }
    }
}
