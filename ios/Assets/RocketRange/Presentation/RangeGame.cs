using System;
using RocketRange.Core;
using UnityEngine;
using UnityEngine.UIElements;

namespace RocketRange
{
    public sealed class RangeGame : MonoBehaviour
    {
        public Catalog Catalog { get; private set; }
        public Rocket Selected { get; private set; }
        public Motor Motor { get; private set; }
        public Conditions Conditions { get; private set; } = Conditions.Default;
        public LaunchSession Session { get; private set; }
        public FlightState Prediction { get; private set; }
        public RangeCamera Cameras { get; private set; }
        public RangeAudio Sound { get; private set; }
        public Camera Camera { get; private set; }
        RangeWorld world;
        RocketVisual visual;
        RangeInterface ui;
        Preparation previous;
        double lastTime;
        float telemetryDue;
        bool soundStarted;
        public bool IsFlight =>
            Session.Stage == Preparation.Flight || Session.Stage == Preparation.Landed;

        void Start()
        {
            Application.targetFrameRate = 60;
            QualitySettings.vSyncCount = 0;
            Screen.sleepTimeout = SleepTimeout.NeverSleep;
            Catalog = JsonUtility.FromJson<Catalog>(Resources.Load<TextAsset>("Data/catalog").text);
            Selected = Catalog.rockets[0];
            Motor = Catalog.Motor(Selected.recommended);
            Session = new LaunchSession(Selected, Motor, Conditions);
            var c = new GameObject("Observer", typeof(Camera), typeof(AudioListener));
            Camera = c.GetComponent<Camera>();
            Camera.tag = "MainCamera";
            Camera.nearClipPlane = .008f;
            Camera.farClipPlane = 18000;
            Camera.fieldOfView = 44;
            Camera.allowHDR = true;
            Camera.allowMSAA = false;
            Cameras = new RangeCamera(Camera);
            var cameraData =
                c.AddComponent<UnityEngine.Rendering.Universal.UniversalAdditionalCameraData>();
            cameraData.renderPostProcessing = true;
            cameraData.antialiasing = UnityEngine
                .Rendering
                .Universal
                .AntialiasingMode
                .SubpixelMorphologicalAntiAliasing;
            world = new GameObject("Cedar Ridge").AddComponent<RangeWorld>();
            world.Build();
            Sound = new GameObject("Procedural motor audio").AddComponent<RangeAudio>();
            ui = gameObject.AddComponent<RangeInterface>();
            ui.Initialize(this, GetComponent<UIDocument>());
            RebuildRocket();
            Predict();
            ui.Refresh();
            previous = Session.Stage;
            lastTime = Time.realtimeSinceStartupAsDouble;
        }

        void Predict() =>
            Prediction = FlightPhysics.Predict(
                new FlightConfiguration(Selected, Motor, Conditions)
            );

        void RebuildRocket()
        {
            if (visual)
                Destroy(visual.gameObject);
            visual = new GameObject("Selected rocket").AddComponent<RocketVisual>();
            visual.Build(Selected);
            Cameras.Frame((float)Selected.length);
        }

        public void SelectRocket(string id)
        {
            if (Session.Locked || Session.Stage == Preparation.Landed)
                return;
            if (Session.Stage != Preparation.Workshop)
                Session.Unload();
            Selected = Catalog.Rocket(id);
            Motor = Catalog.Motor(Selected.recommended);
            Session.Configure(Selected, Motor, Conditions);
            RebuildRocket();
            Predict();
            ui.Refresh();
        }

        public void SelectMotor(string id)
        {
            if (Session.Stage != Preparation.Workshop)
                return;
            Motor = Catalog.Motor(id);
            Session.Configure(Selected, Motor, Conditions);
            Predict();
            ui.Refresh();
        }

        public void SetConditions(Conditions c)
        {
            if (Session.Locked || Session.Stage == Preparation.Landed)
                return;
            Session.SetConditions(c);
            Conditions = c;
            Predict();
            ui.UpdateEstimate();
        }

        public void Primary()
        {
            switch (Session.Stage)
            {
                case Preparation.Workshop:
                    Session.Load();
                    break;
                case Preparation.Loaded:
                    Session.Place();
                    break;
                case Preparation.Pad:
                    Session.Arm();
                    break;
                case Preparation.Armed:
                    Session.Launch(UnityEngine.Random.value);
                    soundStarted = false;
                    break;
                case Preparation.Landed:
                    Session.PrepareAgain();
                    soundStarted = false;
                    Sound.Stop();
                    break;
            }
            ui.Refresh();
        }

        public void Secondary()
        {
            if (Session.Stage == Preparation.Armed)
                Session.Disarm();
            else if (Session.Stage == Preparation.Loaded || Session.Stage == Preparation.Pad)
                Session.Unload();
            ui.Refresh();
        }

        public void ChangeView(ViewMode mode)
        {
            Cameras.Select(
                mode,
                visual.Airframe.position + Vector3.up * (float)Selected.length * .5f
            );
            ui.UpdateCameraButtons();
        }

        void Update()
        {
            if (Session == null)
                return;
            double now = Time.realtimeSinceStartupAsDouble,
                elapsed = Math.Max(0, now - lastTime);
            lastTime = now;
            Session.Advance(elapsed);
            var s = Session.State;
            if (Session.Stage == Preparation.Flight && !soundStarted)
            {
                soundStarted = true;
                Sound.Ignite(Session.Flight.Motor, s.t, (uint)(731 + Session.FlightNumber));
            }
            if (Session.Stage != previous)
            {
                previous = Session.Stage;
                ui.Refresh();
            }
            bool mounted =
                Session.Stage != Preparation.Workshop && Session.Stage != Preparation.Loaded;
            Vector3 origin = mounted ? RangeWorld.PadOrigin : RangeWorld.BenchOrigin;
            visual.UpdateFlight(s, IsFlight, origin);
            Cameras.Update(
                visual.Airframe,
                (float)Selected.length,
                (float)Selected.diameter,
                (float)Selected.chute,
                (float)s.inflation,
                IsFlight,
                (float)Math.Min(.1, elapsed)
            );
            Sound.Spatial(visual.Airframe.position, Camera.transform.position);
            bool burning = Session.Stage == Preparation.Flight && s.t < Motor.burn;
            world.Present(Conditions, s, visual.Airframe.position, burning);
            if (!burning && soundStarted && s.t >= Motor.burn)
                Sound.Stop();
            if (Time.unscaledTime >= telemetryDue)
            {
                ui.UpdateTelemetry();
                telemetryDue = Time.unscaledTime + .1f;
            }
        }

        void OnDestroy()
        {
            Screen.sleepTimeout = SleepTimeout.SystemSetting;
        }
    }
}
