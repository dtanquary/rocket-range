using System.Collections.Generic;
using RocketRange.Core;
using UnityEngine;
using UnityEngine.Rendering;
using static RocketRange.Geometry;

namespace RocketRange
{
    public sealed class RangeWorld : MonoBehaviour
    {
        Transform rod,
            windsock,
            safetyKey,
            launchButton;
        ParticleSystem smoke;
        Material smokeMaterial;
        Texture2D groundTexture,
            smokeTexture,
            woodTexture;
        readonly List<Matrix4x4[]> grassBatches = new List<Matrix4x4[]>(),
            treeBatches = new List<Matrix4x4[]>(),
            trunkBatches = new List<Matrix4x4[]>();
        UnityEngine.Mesh grassMesh,
            treeMesh,
            trunkMesh;
        Material grassMaterial,
            treeMaterial,
            trunkMaterial,
            terrainMaterial,
            sky,
            woodMaterial,
            continuityMaterial;
        Vector2 cloudDrift;
        public static readonly Vector3 PadOrigin = new Vector3(0, .14f, 0);
        public static readonly Vector3 BenchOrigin = new Vector3(1.15f, .76f, .45f);

        public void Build()
        {
            RenderSettings.ambientMode = AmbientMode.Trilight;
            RenderSettings.ambientSkyColor = Color("#B7CDDB");
            RenderSettings.ambientEquatorColor = Color("#8D9D90");
            RenderSettings.ambientGroundColor = Color("#626943");
            RenderSettings.ambientIntensity = .8f;
            RenderSettings.fog = true;
            RenderSettings.fogMode = FogMode.ExponentialSquared;
            RenderSettings.fogColor = Color("#ADC5CD");
            RenderSettings.fogDensity = .00035f;
            sky = new Material(Shader.Find("RocketRange/FieldSky"));
            sky.SetColor("_Zenith", Color("#537DA9"));
            sky.SetColor("_Horizon", Color("#B3CFDA"));
            RenderSettings.skybox = sky;
            var lightObject = new GameObject("Late morning sunlight");
            lightObject.transform.SetParent(transform);
            var sun = lightObject.AddComponent<Light>();
            sun.type = LightType.Directional;
            sun.color = Color("#FFF1D4");
            sun.intensity = 1.7f;
            sun.shadows = LightShadows.Soft;
            sun.shadowBias = .008f;
            sun.shadowNormalBias = .08f;
            lightObject.transform.rotation = Quaternion.Euler(42, -35, 0);
            RenderSettings.sun = sun;
            sky.SetVector("_SunDirection", -lightObject.transform.forward);
            Ground();
            Vegetation();
            Equipment();
            Smoke();
        }

        void Ground()
        {
            const int side = 128;
            var vertices = new Vector3[(side + 1) * (side + 1)];
            var uv = new Vector2[vertices.Length];
            var indices = new List<int>();
            for (int z = 0; z <= side; z++)
                for (int x = 0; x <= side; x++)
                {
                    int i = z * (side + 1) + x;
                    float px = (x / (float)side - .5f) * 6000,
                        pz = (z / (float)side - .5f) * 6000,
                        d = Mathf.Sqrt(px * px + pz * pz);
                    float y =
                        d < 800
                            ? 0
                            : Mathf.Max(
                                0,
                                Mathf.Sin(px * .004f) * Mathf.Cos(pz * .005f) * 36
                                    + Mathf.Sin(pz * .01f) * 12
                            ) * Mathf.Clamp01((d - 800) / 300);
                    vertices[i] = new Vector3(px, y - .012f, pz);
                    uv[i] = new Vector2(px / 2, pz / 2);
                    if (x < side && z < side)
                        indices.AddRange(
                            new[] { i, i + side + 1, i + 1, i + 1, i + side + 1, i + side + 2 }
                        );
                }
            var mesh = new UnityEngine.Mesh
            {
                name = "Field terrain",
                indexFormat = IndexFormat.UInt32,
                vertices = vertices,
                uv = uv,
                triangles = indices.ToArray()
            };
            mesh.RecalculateNormals();
            mesh.RecalculateBounds();
            groundTexture = new Texture2D(256, 256, TextureFormat.RGB24, true)
            {
                name = "Procedural ground",
                wrapMode = TextureWrapMode.Repeat,
                anisoLevel = 8
            };
            var pixels = new UnityEngine.Color[256 * 256];
            var grain = new System.Random(83);
            for (int y = 0; y < 256; y++)
                for (int x = 0; x < 256; x++)
                {
                    float n =
                        Mathf.PerlinNoise(x * .04f, y * .04f) * .45f
                        + Mathf.PerlinNoise(x * .8f, y * .13f) * .3f
                        + (float)grain.NextDouble() * .25f;
                    pixels[y * 256 + x] = UnityEngine.Color.Lerp(
                        Color("#4F6140"),
                        Color("#78865B"),
                        n
                    );
                }
            groundTexture.SetPixels(pixels);
            groundTexture.Apply();
            terrainMaterial = new Material(Paint("#FFFFFF"));
            terrainMaterial.SetTexture("_BaseMap", groundTexture);
            Mesh("Six kilometer field", mesh, terrainMaterial, transform);
            Cylinder(
                "Worn earth around pad",
                transform,
                .65f,
                .65f,
                .003f,
                -.004f,
                Paint("#807654"),
                64
            );
        }

        static void Batch(List<Matrix4x4[]> target, List<Matrix4x4> items)
        {
            for (int i = 0; i < items.Count; i += 1023)
                target.Add(items.GetRange(i, Mathf.Min(1023, items.Count - i)).ToArray());
        }

        void Vegetation()
        {
            var random = new System.Random(42);
            float R() => (float)random.NextDouble();
            grassMesh = new UnityEngine.Mesh
            {
                name = "Grass clump",
                vertices = new[]
                {
                    new Vector3(-.025f, 0, 0),
                    new Vector3(.025f, 0, 0),
                    new Vector3(.015f, .15f, .015f),
                    new Vector3(0, .21f, .025f),
                    new Vector3(0, 0, -.025f),
                    new Vector3(0, 0, .025f),
                    new Vector3(.02f, .14f, .01f)
                },
                triangles = new[] { 0, 2, 1, 0, 3, 2, 4, 6, 5 }
            };
            grassMesh.RecalculateNormals();
            grassMaterial = new Material(Shader.Find("RocketRange/Grass"))
            {
                enableInstancing = true
            };
            grassMaterial.SetColor("_BaseColor", Color("#657A40"));
            var grass = new List<Matrix4x4>();
            for (int i = 0; i < 27000; i++)
            {
                float a = R() * Mathf.PI * 2,
                    d = Mathf.Sqrt(R()) * (i < 18000 ? 23 : 120);
                if (d < .7f)
                    continue;
                float s = .5f + R() * .7f;
                grass.Add(
                    Matrix4x4.TRS(
                        new Vector3(Mathf.Cos(a) * d, 0, Mathf.Sin(a) * d),
                        Quaternion.Euler(0, R() * 360, 0),
                        new Vector3(s, s * .65f, s)
                    )
                );
            }
            Batch(grassBatches, grass);
            var sphere = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            treeMesh = sphere.GetComponent<MeshFilter>().sharedMesh;
            Destroy(sphere);
            trunkMesh = Lathe(new[] { new Vector2(.32f, 0), new Vector2(.17f, 1) }, 8);
            treeMaterial = Paint("#425B36");
            trunkMaterial = Paint("#665746");
            var trees = new List<Matrix4x4>();
            var trunks = new List<Matrix4x4>();
            for (int i = 0; i < 140; i++)
            {
                float a = R() * Mathf.PI * 2,
                    d = 140 + R() * 380,
                    h = 5 + R() * 9;
                var p = new Vector3(Mathf.Cos(a) * d, 0, Mathf.Sin(a) * d);
                trunks.Add(Matrix4x4.TRS(p, Quaternion.identity, new Vector3(1, h * .7f, 1)));
                for (int j = 0; j < 4; j++)
                    trees.Add(
                        Matrix4x4.TRS(
                            p
                                + new Vector3(
                                    (R() - .5f) * h * .4f,
                                    h * (.65f + R() * .2f),
                                    (R() - .5f) * h * .4f
                                ),
                            Quaternion.Euler(R() * 50, R() * 360, 0),
                            new Vector3(h * .55f, h * .55f, h * .5f)
                        )
                    );
            }
            Batch(treeBatches, trees);
            Batch(trunkBatches, trunks);
        }

        void Equipment()
        {
            var pad = Group("Porta-Pad II recreation", transform);
            var red = Paint("#CA4735", .08f, .42f);
            var steel = Paint("#ADBCBF", .82f, .42f);
            var black = Paint("#28312D", .12f, .25f);
            Cylinder("Tripod hub", pad, .08f, .055f, .075f, .015f, red);
            for (int i = 0; i < 3; i++)
            {
                var leg = Box(
                    "Molded tripod leg",
                    pad,
                    new Vector3(0, .025f, .2f),
                    new Vector3(.07f, .045f, .42f),
                    red
                );
                var hinge = Group("Leg pivot", pad);
                leg.transform.SetParent(hinge, false);
                hinge.localRotation = Quaternion.Euler(0, i * 120, 0);
            }
            Cylinder("Metal blast deflector", pad, .105f, .105f, .004f, .105f, steel, 64);
            rod = Group("Launch guide", pad);
            rod.localPosition = new Vector3(.02f, .1f, 0);
            Cylinder("Steel launch rod", rod, .0018f, .0018f, 1, 0, steel, 16);
            var bench = Group("Preparation bench", transform);
            bench.localPosition = new Vector3(1.15f, 0, .45f);
            woodTexture = new Texture2D(256, 128, TextureFormat.RGB24, true)
            {
                name = "Weathered bench grain",
                wrapMode = TextureWrapMode.Repeat,
                anisoLevel = 4
            };
            var wood = new UnityEngine.Color[256 * 128];
            for (int y = 0; y < 128; y++)
                for (int x = 0; x < 256; x++)
                {
                    float grain = Mathf.PerlinNoise(x * .025f, y * .4f);
                    float streak = Mathf.Sin(y * 2.2f + grain * 7) * .07f;
                    wood[y * 256 + x] = UnityEngine.Color.Lerp(
                        Color("#777B69"),
                        Color("#B8B29A"),
                        grain + streak
                    );
                }
            woodTexture.SetPixels(wood);
            woodTexture.Apply();
            woodMaterial = new Material(Paint("#FFFFFF", 0, .16f));
            woodMaterial.SetTexture("_BaseMap", woodTexture);
            for (int plank = 0; plank < 3; plank++)
            {
                Box(
                    "Weathered tabletop plank",
                    bench,
                    new Vector3(0, .73f, (plank - 1) * .167f),
                    new Vector3(.9f, .045f, .162f),
                    woodMaterial
                );
                foreach (float x in new[] { -.37f, .37f })
                {
                    var screw = Cylinder(
                        "Recessed tabletop screw",
                        bench,
                        .003f,
                        .003f,
                        .0008f,
                        .753f,
                        steel,
                        12
                    );
                    screw.transform.localPosition += new Vector3(x, 0, (plank - 1) * .167f);
                }
            }
            foreach (float x in new[] { -.37f, .37f })
                foreach (float z in new[] { -.18f, .18f })
                    Box(
                        "Folding leg",
                        bench,
                        new Vector3(x, .36f, z),
                        new Vector3(.025f, .72f, .025f),
                        steel
                    );
            var controller = Group("Electron Beam controller recreation", bench);
            controller.localPosition = new Vector3(.28f, .77f, .05f);
            Box(
                "Yellow controller case",
                controller,
                Vector3.zero,
                new Vector3(.17f, .04f, .1f),
                Paint("#D8AC43", .05f, .3f)
            );
            Box(
                "Controller face",
                controller,
                new Vector3(0, .022f, 0),
                new Vector3(.15f, .003f, .085f),
                black
            );
            launchButton = Cylinder(
                "Launch button",
                controller,
                .013f,
                .013f,
                .008f,
                .024f,
                red,
                24
            ).transform;
            safetyKey = Group("Removable safety key", controller);
            Cylinder("Safety key shaft", safetyKey, .002f, .002f, .025f, 0, steel, 12);
            Box(
                "Safety key handle",
                safetyKey,
                Vector3.up * .028f,
                new Vector3(.023f, .008f, .009f),
                steel
            );
            continuityMaterial = new Material(Paint("#354438", .1f, .45f));
            continuityMaterial.EnableKeyword("_EMISSION");
            var lamp = Cylinder(
                "Continuity lamp",
                controller,
                .004f,
                .004f,
                .002f,
                .025f,
                continuityMaterial,
                20
            );
            lamp.transform.localPosition += new Vector3(-.043f, 0, 0);
            Beam(
                "Controller lead",
                transform,
                new Vector3(1.43f, .77f, .5f),
                new Vector3(.6f, .015f, .2f),
                .002f,
                black
            );
            Beam(
                "Igniter lead",
                transform,
                new Vector3(.6f, .015f, .2f),
                new Vector3(0, .1f, 0),
                .002f,
                black
            );
            var pole = Group("Windsock pole", transform);
            pole.localPosition = new Vector3(-5, 0, -6);
            Cylinder("Pole", pole, .024f, .02f, 3, 0, steel, 16);
            windsock = Group("Windsock", pole);
            windsock.localPosition = Vector3.up * 2.95f;
            windsock.localRotation = Quaternion.Euler(0, 0, -80);
            for (int i = 0; i < 5; i++)
                Cylinder(
                    "Windsock stripe",
                    windsock,
                    .12f - i * .015f,
                    .105f - i * .015f,
                    .17f,
                    i * .17f,
                    Paint(i % 2 == 0 ? "#D26832" : "#E7DDC2"),
                    20
                );
            for (int i = -8; i <= 8; i++)
            {
                var p = new Vector3(i * 7, 0, -50);
                Box(
                    "Fence post",
                    transform,
                    p + Vector3.up * .55f,
                    new Vector3(.09f, 1.1f, .09f),
                    Paint("#958C70")
                );
                if (i < 8)
                    Beam(
                        "Fence rail",
                        transform,
                        p + Vector3.up * .85f,
                        p + new Vector3(7, .85f, 0),
                        .035f,
                        Paint("#958C70")
                    );
            }
        }

        void Smoke()
        {
            var g = new GameObject("Motor smoke");
            g.transform.SetParent(transform);
            smoke = g.AddComponent<ParticleSystem>();
            smoke.Stop(true, ParticleSystemStopBehavior.StopEmittingAndClear);
            var main = smoke.main;
            main.loop = true;
            main.playOnAwake = false;
            main.startLifetime = new ParticleSystem.MinMaxCurve(2, 4);
            main.startSpeed = .55f;
            main.startSize = new ParticleSystem.MinMaxCurve(.035f, .08f);
            main.startColor = new UnityEngine.Color(.78f, .77f, .68f, .4f);
            main.simulationSpace = ParticleSystemSimulationSpace.World;
            main.maxParticles = 1600;
            var em = smoke.emission;
            em.rateOverTime = 0;
            var shape = smoke.shape;
            shape.shapeType = ParticleSystemShapeType.Cone;
            shape.angle = 12;
            shape.radius = .007f;
            var size = smoke.sizeOverLifetime;
            size.enabled = true;
            size.size = new ParticleSystem.MinMaxCurve(
                1,
                new AnimationCurve(
                    new Keyframe(0, .35f),
                    new Keyframe(.2f, 1.5f),
                    new Keyframe(1, 4)
                )
            );
            var color = smoke.colorOverLifetime;
            color.enabled = true;
            var grad = new Gradient();
            grad.SetKeys(
                new[]
                {
                    new GradientColorKey(UnityEngine.Color.white, 0),
                    new GradientColorKey(UnityEngine.Color.white, 1)
                },
                new[]
                {
                    new GradientAlphaKey(.5f, 0),
                    new GradientAlphaKey(.3f, .3f),
                    new GradientAlphaKey(0, 1)
                }
            );
            color.color = grad;
            smokeTexture = new Texture2D(32, 32, TextureFormat.RGBA32, false);
            var p = new UnityEngine.Color[1024];
            for (int y = 0; y < 32; y++)
                for (int x = 0; x < 32; x++)
                {
                    float d =
                        Vector2.Distance(new Vector2(x, y), new Vector2(15.5f, 15.5f)) / 15.5f;
                    p[y * 32 + x] = new UnityEngine.Color(
                        1,
                        1,
                        1,
                        Mathf.Pow(Mathf.Clamp01(1 - d), 1.5f)
                    );
                }
            smokeTexture.SetPixels(p);
            smokeTexture.Apply();
            smokeMaterial = new Material(Shader.Find("Universal Render Pipeline/Particles/Unlit"));
            smokeMaterial.SetTexture("_BaseMap", smokeTexture);
            smokeMaterial.SetColor("_BaseColor", UnityEngine.Color.white);
            smokeMaterial.SetFloat("_Surface", 1);
            smokeMaterial.SetFloat("_Blend", 0);
            smokeMaterial.SetInt("_SrcBlend", (int)BlendMode.SrcAlpha);
            smokeMaterial.SetInt("_DstBlend", (int)BlendMode.OneMinusSrcAlpha);
            smokeMaterial.SetInt("_ZWrite", 0);
            smokeMaterial.EnableKeyword("_SURFACE_TYPE_TRANSPARENT");
            smokeMaterial.renderQueue = 3000;
            smoke.GetComponent<ParticleSystemRenderer>().sharedMaterial = smokeMaterial;
        }

        public void Present(
            Conditions c,
            FlightState flight,
            Vector3 emitter,
            bool burning,
            Preparation preparation
        )
        {
            bool armed = preparation == Preparation.Armed || preparation == Preparation.Igniting;
            bool inserted =
                armed || preparation == Preparation.Flight || preparation == Preparation.Landed;
            safetyKey.localPosition = inserted
                ? new Vector3(.045f, .025f, 0)
                : new Vector3(-.055f, .025f, .08f);
            safetyKey.localRotation = inserted ? Quaternion.identity : Quaternion.Euler(0, 25, 90);
            launchButton.localPosition = new Vector3(
                0,
                preparation == Preparation.Igniting ? .021f : .024f,
                0
            );
            continuityMaterial.SetColor("_BaseColor", Color(armed ? "#E8BD62" : "#354438"));
            continuityMaterial.SetColor(
                "_EmissionColor",
                armed ? Color("#C18C28") * 1.3f : UnityEngine.Color.black
            );
            rod.localRotation = Quaternion.FromToRotation(
                Vector3.up,
                new Vector3(
                    (float)FlightPhysics.LaunchAxis(c).x,
                    (float)FlightPhysics.LaunchAxis(c).y,
                    (float)FlightPhysics.LaunchAxis(c).z
                )
            );
            rod.localScale = new Vector3(1, (float)c.rodLength, 1);
            windsock.localRotation = Quaternion.Euler(
                0,
                (float)c.windDirection,
                -65 - Mathf.Clamp((float)c.wind * 3, 0, 20) + Mathf.Sin(Time.time * 2) * 3
            );
            var emission = smoke.emission;
            emission.rateOverTime = burning ? 260 : 0;
            smoke.transform.position = emitter;
            smoke.transform.rotation = Quaternion.Euler(90, 0, 0);
            if (burning && !smoke.isPlaying)
                smoke.Play();
            var velocity = smoke.velocityOverLifetime;
            velocity.enabled = true;
            velocity.space = ParticleSystemSimulationSpace.World;
            var wind = FlightPhysics.WindAt(c, Mathf.Max(1, emitter.y), Time.time);
            cloudDrift += new Vector2((float)wind.x, (float)wind.z) * Time.deltaTime;
            sky.SetVector("_WindOffset", new Vector4(cloudDrift.x, cloudDrift.y, 0, 0));
            velocity.x = (float)wind.x;
            velocity.z = (float)wind.z;
            velocity.y = .25f;
            grassMaterial.SetFloat("_Wind", (float)c.wind);
        }

        void Update()
        {
            foreach (var batch in grassBatches)
                Graphics.DrawMeshInstanced(
                    grassMesh,
                    0,
                    grassMaterial,
                    batch,
                    batch.Length,
                    null,
                    ShadowCastingMode.Off,
                    true
                );
            foreach (var batch in treeBatches)
                Graphics.DrawMeshInstanced(
                    treeMesh,
                    0,
                    treeMaterial,
                    batch,
                    batch.Length,
                    null,
                    ShadowCastingMode.On,
                    true
                );
            foreach (var batch in trunkBatches)
                Graphics.DrawMeshInstanced(
                    trunkMesh,
                    0,
                    trunkMaterial,
                    batch,
                    batch.Length,
                    null,
                    ShadowCastingMode.On,
                    true
                );
        }

        void OnDestroy()
        {
            foreach (
                var o in new Object[]
                {
                    groundTexture,
                    woodTexture,
                    woodMaterial,
                    continuityMaterial,
                    smokeTexture,
                    smokeMaterial,
                    grassMaterial,
                    terrainMaterial,
                    sky,
                    grassMesh,
                    trunkMesh
                }
            )
                if (o)
                    Destroy(o);
        }
    }
}
