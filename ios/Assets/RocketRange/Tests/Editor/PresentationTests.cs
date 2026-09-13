using System;
using NUnit.Framework;
using RocketRange.Core;
using UnityEngine;

namespace RocketRange.Tests
{
    public class PresentationTests
    {
        [Test]
        public void BodyMeshNormalsPointOutward()
        {
            var mesh = Geometry.Lathe(new[] { new Vector2(1, 0), new Vector2(1, 1) }, 32);
            try
            {
                var vertices = mesh.vertices;
                var normals = mesh.normals;
                for (int i = 0; i < vertices.Length; i++)
                    Assert.Greater(
                        Vector3.Dot(
                            new Vector3(vertices[i].x, 0, vertices[i].z).normalized,
                            normals[i]
                        ),
                        .95f
                    );
            }
            finally
            {
                UnityEngine.Object.DestroyImmediate(mesh);
            }
        }

        [Test]
        public void OrbitStartsAboveThePadAndAllImportedModelsAreBundled()
        {
            var go = new GameObject("Observer");
            var rocket = new GameObject("Rocket");
            try
            {
                var camera = go.AddComponent<Camera>();
                var rig = new RangeCamera(camera);
                rig.Update(rocket.transform, .307f, .025f, .305f, 0, false, .016f);
                Assert.Greater(camera.transform.position.y, .307f * .48f);
                foreach (
                    var name in new[]
                    {
                        "falcon-9",
                        "saturn-v",
                        "mercury-redstone",
                        "mercury-atlas"
                    }
                )
                {
                    var model = Resources.Load<GameObject>("Models/" + name);
                    Assert.IsNotNull(model, name);
                    Assert.Greater(model.GetComponentsInChildren<MeshFilter>().Length, 0, name);
                }
            }
            finally
            {
                UnityEngine.Object.DestroyImmediate(go);
                UnityEngine.Object.DestroyImmediate(rocket);
            }
        }

        [Test]
        public void EveryMotorProducesFiniteUnclippedAudioWithQuietEndpoints()
        {
            var c = JsonUtility.FromJson<Catalog>(Resources.Load<TextAsset>("Data/catalog").text);
            foreach (var m in c.motors)
            {
                var samples = MotorSound.Samples(m, 22050);
                double energy = 0;
                foreach (var x in samples)
                {
                    Assert.IsFalse(float.IsNaN(x) || float.IsInfinity(x));
                    Assert.Less(Math.Abs(x), 1);
                    energy += x * x;
                }
                Assert.That(samples.Length, Is.EqualTo((int)Math.Ceiling(m.burn * 22050)));
                Assert.That(samples[samples.Length - 1], Is.Zero);
                Assert.That(energy, Is.GreaterThan(.01));
            }
        }

        [Test]
        public void FollowTranslationDoesNotPitchTheCameraDuringDescent()
        {
            var go = new GameObject("Test observer");
            var airframe = new GameObject("Test airframe");
            try
            {
                var camera = go.AddComponent<Camera>();
                var rig = new RangeCamera(camera);
                rig.Select(ViewMode.Follow, Vector3.zero);
                airframe.transform.position = new Vector3(0, 100, 0);
                for (int i = 0; i < 300; i++)
                    rig.Update(airframe.transform, .307f, .025f, .305f, 1, true, 1f / 60);
                var orientation = camera.transform.rotation;
                var offset = camera.transform.position - airframe.transform.position;
                foreach (
                    var delta in new[]
                    {
                        new Vector3(.03f, -.06f, .01f),
                        new Vector3(.1f, -.1f, -.04f),
                        new Vector3(-.08f, -.02f, .02f)
                    }
                )
                {
                    airframe.transform.position += delta;
                    rig.Update(airframe.transform, .307f, .025f, .305f, 1, true, 1f / 60);
                    Assert.Less(Quaternion.Angle(orientation, camera.transform.rotation), .03f);
                    Assert.Less(
                        Vector3.Distance(
                            offset,
                            camera.transform.position - airframe.transform.position
                        ),
                        .0001f
                    );
                }
            }
            finally
            {
                UnityEngine.Object.DestroyImmediate(go);
                UnityEngine.Object.DestroyImmediate(airframe);
            }
        }

        [Test]
        public void OnboardMovesWithAirframeAndGroundSelectionSurvivesLaunch()
        {
            var go = new GameObject("Observer");
            var airframe = new GameObject("Rocket");
            try
            {
                var camera = go.AddComponent<Camera>();
                var rig = new RangeCamera(camera);
                rig.Select(ViewMode.Onboard, Vector3.zero);
                rig.Update(airframe.transform, 1, .05f, .6f, 0, false, .016f);
                var local = camera.transform.position;
                airframe.transform.position = new Vector3(4, 50, -3);
                airframe.transform.rotation = Quaternion.Euler(20, 40, 65);
                rig.Update(airframe.transform, 1, .05f, .6f, 0, true, .016f);
                Assert.Less(
                    Vector3.Distance(
                        camera.transform.position,
                        airframe.transform.TransformPoint(local)
                    ),
                    .0001f
                );
                Assert.Greater(
                    Quaternion.Angle(camera.transform.rotation, Quaternion.identity),
                    10
                );
                rig.Select(ViewMode.Ground, Vector3.zero);
                var c = JsonUtility.FromJson<Catalog>(
                    Resources.Load<TextAsset>("Data/catalog").text
                );
                var s = new LaunchSession(c.rockets[0], c.Motor("B6-4"), Conditions.Default);
                s.Load();
                s.Place();
                s.Arm();
                s.Launch(.5);
                s.Advance(2);
                rig.Update(airframe.transform, 1, .05f, .6f, 0, true, .016f);
                Assert.That(rig.Mode, Is.EqualTo(ViewMode.Ground));
            }
            finally
            {
                UnityEngine.Object.DestroyImmediate(go);
                UnityEngine.Object.DestroyImmediate(airframe);
            }
        }
    }
}
