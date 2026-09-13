using System;
using System.Collections.Generic;
using RocketRange.Core;
using UnityEngine;
using UnityEngine.UIElements;

namespace RocketRange
{
    public sealed class RangeInterface : MonoBehaviour
    {
        RangeGame game;
        VisualElement root,
            safe,
            bench,
            modal,
            viewport,
            cameraBar;
        Label altitude,
            velocity,
            time,
            phase,
            estimate,
            status;
        Button primary,
            secondary,
            browse,
            mute,
            settings;
        readonly List<Button> engines = new List<Button>();
        readonly Dictionary<ViewMode, Button> cameraButtons = new Dictionary<ViewMode, Button>();
        readonly Dictionary<int, Vector2> pointers = new Dictionary<int, Vector2>();

        static Label Text(VisualElement parent, string text, string cls = "")
        {
            var l = new Label(text);
            if (cls != "")
                l.AddToClassList(cls);
            parent.Add(l);
            return l;
        }

        static VisualElement Box(VisualElement parent, string cls)
        {
            var e = new VisualElement();
            e.AddToClassList(cls);
            parent.Add(e);
            return e;
        }

        static Button Button(VisualElement parent, string text, Action action, string cls = "")
        {
            var b = new Button(action) { text = text };
            if (cls != "")
                b.AddToClassList(cls);
            parent.Add(b);
            return b;
        }

        public void Initialize(RangeGame game, UIDocument doc)
        {
            this.game = game;
            root = doc.rootVisualElement;
            root.styleSheets.Add(Resources.Load<StyleSheet>("UI/Range"));
            root.AddToClassList("range-root");
            viewport = Box(root, "viewport");
            viewport.RegisterCallback<PointerDownEvent>(e =>
            {
                pointers[e.pointerId] = e.position;
                viewport.CapturePointer(e.pointerId);
            });
            viewport.RegisterCallback<PointerMoveEvent>(e =>
            {
                if (!pointers.TryGetValue(e.pointerId, out var old))
                    return;
                Vector2 next = e.position;
                if (pointers.Count == 1)
                    game.Cameras.Orbit(next - old);
                else
                {
                    foreach (var p in pointers)
                        if (p.Key != e.pointerId)
                        {
                            game.Cameras.Zoom(
                                (Vector2.Distance(old, p.Value) - Vector2.Distance(next, p.Value))
                                    * 2
                            );
                            break;
                        }
                }
                pointers[e.pointerId] = next;
            });
            viewport.RegisterCallback<PointerUpEvent>(e =>
            {
                pointers.Remove(e.pointerId);
                viewport.ReleasePointer(e.pointerId);
            });
            viewport.RegisterCallback<PointerCancelEvent>(e => pointers.Remove(e.pointerId));
            viewport.RegisterCallback<WheelEvent>(e => game.Cameras.Zoom(e.delta.y * 12));
            safe = Box(root, "safe");
            safe.pickingMode = PickingMode.Ignore;
            var header = Box(safe, "header");
            var brand = Box(header, "brand");
            Text(brand, "ROCKET RANGE", "wordmark");
            Text(brand, "MODEL ROCKET FLIGHT SIMULATOR", "eyebrow");
            var location = Box(header, "location");
            Text(location, "CEDAR RIDGE", "eyebrow");
            Text(location, "OPEN FLIGHT FIELD", "muted");
            var actions = Box(header, "row");
            Button(actions, "Flight bench", () => bench.ToggleInClassList("hidden"));
            settings = Button(actions, "Field", ShowConditions);
            Button(actions, "Credits", ShowCredits);
            bench = Box(safe, "bench panel");
            bench.ClearClassList();
            bench.AddToClassList("bench");
            bench.AddToClassList("panel");
            var scroll = new ScrollView(ScrollViewMode.Vertical);
            bench.Add(scroll);
            Text(scroll, "PRE-FLIGHT", "eyebrow");
            Text(scroll, "Your next launch.", "title");
            browse = Button(scroll, "Browse fleet  ↗", ShowFleet, "outline");
            Text(scroll, "THE ROCKET", "eyebrow");
            Text(scroll, "", "rocket-name").name = "rocket-name";
            Text(scroll, "", "muted").name = "rocket-subtitle";
            Text(scroll, "", "specs").name = "rocket-specs";
            Text(scroll, "THE ENGINE", "eyebrow");
            var engineBox = Box(scroll, "engines");
            engineBox.name = "engines";
            estimate = Text(scroll, "", "estimate");
            Button(scroll, "Adjust launch setup", ShowConditions, "outline");
            Text(
                scroll,
                "Estimates use sourced thrust curves and a simplified aerodynamic model.",
                "fine"
            );
            var tele = Box(safe, "telemetry");
            tele.AddToClassList("panel");
            Text(tele, "FLIGHT TELEMETRY", "eyebrow");
            Text(tele, "ALTITUDE AGL", "muted");
            altitude = Text(tele, "0 m", "altitude");
            velocity = Text(tele, "0.0 m/s", "reading");
            time = Text(tele, "0.0 s", "reading");
            phase = Text(tele, "IN THE WORKSHOP", "phase");
            var weather = Box(safe, "weather");
            weather.pickingMode = PickingMode.Ignore;
            Text(weather, "A GOOD DAY TO FLY", "eyebrow");
            Text(weather, "22°  ·  Light winds", "reading").name = "weather";
            cameraBar = Box(safe, "camera-bar");
            foreach (ViewMode view in Enum.GetValues(typeof(ViewMode)))
            {
                var captured = view;
                cameraButtons[view] = Button(
                    cameraBar,
                    view.ToString(),
                    () => game.ChangeView(captured)
                );
            }
            var control = Box(safe, "controller");
            control.AddToClassList("panel");
            var top = Box(control, "row");
            Text(top, "LAUNCH CONTROL", "eyebrow");
            mute = Button(
                top,
                "Sound on",
                () =>
                {
                    game.Sound.ToggleMute();
                    mute.text = game.Sound.Muted ? "Muted" : "Sound on";
                },
                "small"
            );
            status = Text(control, "", "muted");
            primary = Button(control, "Load engine", game.Primary, "primary");
            secondary = Button(control, "", game.Secondary, "outline");
            root.RegisterCallback<GeometryChangedEvent>(_ => ApplySafeArea());
            ApplySafeArea();
        }

        void ApplySafeArea()
        {
            float w = root.resolvedStyle.width,
                h = root.resolvedStyle.height;
            if (float.IsNaN(w) || w <= 0)
                return;
            var r = Screen.safeArea;
            safe.style.left = r.x / Screen.width * w;
            safe.style.right = (Screen.width - r.xMax) / Screen.width * w;
            safe.style.top = (Screen.height - r.yMax) / Screen.height * h;
            safe.style.bottom = r.y / Screen.height * h;
            root.EnableInClassList("compact", w < 1250 || h < 700);
        }

        public void Refresh()
        {
            if (root == null)
                return;
            var r = game.Selected;
            var stage = game.Session.Stage;
            root.Q<Label>("rocket-name").text = r.name;
            root.Q<Label>("rocket-subtitle").text = r.subtitle;
            root.Q<Label>("rocket-specs").text =
                $"{r.length * 100:0.#} cm     {r.diameter * 1000:0} mm     {r.mass * 1000:0.#} g\n{r.family}";
            browse.SetEnabled(!game.Session.Locked && stage != Preparation.Landed);
            settings.SetEnabled(!game.Session.Locked && stage != Preparation.Landed);
            var engineBox = root.Q("engines");
            engineBox.Clear();
            engines.Clear();
            foreach (var id in r.motors)
            {
                var m = game.Catalog.Motor(id);
                var b = Button(
                    engineBox,
                    $"{id}\n{m.impulse:0.0} N·s · {m.delay:0}s delay",
                    () => game.SelectMotor(id),
                    "engine"
                );
                b.EnableInClassList("selected", id == game.Motor.id);
                b.SetEnabled(stage == Preparation.Workshop);
                engines.Add(b);
            }
            string[] titles =
            {
                "Load " + game.Motor.id + " engine",
                "Place on launch pad",
                "Insert safety key",
                "Launch rocket",
                "Igniter energized",
                "Flight in progress",
                "Prepare another flight"
            };
            string[] messages =
            {
                "Select a rocket and compatible engine.",
                "Engine seated · recovery packed",
                "Rocket mounted · continuity confirmed",
                "Safety key inserted · ready to launch",
                "Current applied · awaiting ignition",
                "Observation only · autonomous flight",
                "Flight complete · inspect your result"
            };
            primary.text = titles[(int)stage];
            primary.EnableInClassList("armed", stage == Preparation.Armed);
            status.text = messages[(int)stage];
            primary.SetEnabled(stage != Preparation.Igniting && stage != Preparation.Flight);
            secondary.text = stage == Preparation.Armed ? "Remove key & disarm" : "Unload rocket";
            secondary.style.display =
                stage == Preparation.Loaded
                || stage == Preparation.Pad
                || stage == Preparation.Armed
                    ? DisplayStyle.Flex
                    : DisplayStyle.None;
            UpdateEstimate();
            UpdateTelemetry();
            UpdateCameraButtons();
        }

        public void UpdateEstimate()
        {
            var p = game.Prediction;
            var s = FlightPhysics.StabilityOf(game.Selected, game.Motor, game.Conditions);
            estimate.text =
                $"Estimated apogee       {p.apogee:0} m\nStability margin        {s.margin:0.00} cal\nLaunch mass             {s.mass * 1000:0.0} g\nRod exit                {p.rodExitSpeed ?? 0:0.0} m/s\nEjection airspeed       {p.deploymentSpeed ?? 0:0.0} m/s\nLanding speed           {p.impactSpeed:0.0} m/s";
            root.Q<Label>("weather").text =
                $"22°  ·  {game.Conditions.wind:0.0} m/s from {game.Conditions.windDirection:0}°";
        }

        public void UpdateTelemetry()
        {
            var s = game.Session.State;
            altitude.text = $"{s.position.y:0} m";
            velocity.text = $"{s.velocity.y:0.0} m/s";
            time.text = $"{s.t:0.0} s";
            phase.text =
                game.Session.Stage == Preparation.Flight
                    ? (
                        s.phase == FlightPhase.Recovery
                            ? (s.chuteFailed ? "CANOPY OVERLOAD" : "PARACHUTE DESCENT")
                            : s.phase == FlightPhase.Powered
                                ? "MOTOR BURN"
                                : "COAST TO APOGEE"
                    )
                    : game.Session.Stage.ToString().ToUpperInvariant();
            if (game.Session.Stage == Preparation.Landed)
                status.text =
                    $"{s.outcome} · {s.apogee:0} m apogee\n{s.impactSpeed:0.0} m/s impact · {Math.Sqrt(s.position.x * s.position.x + s.position.z * s.position.z):0} m drift";
        }

        public void UpdateCameraButtons()
        {
            foreach (var pair in cameraButtons)
                pair.Value.EnableInClassList("selected", pair.Key == game.Cameras.Mode);
        }

        VisualElement OpenModal(string eyebrow, string title)
        {
            CloseModal();
            modal = Box(root, "scrim");
            var panel = Box(modal, "dialog");
            var top = Box(panel, "row");
            Text(top, eyebrow, "eyebrow");
            Button(top, "Close", CloseModal, "outline");
            Text(panel, title, "title");
            return panel;
        }

        void CloseModal()
        {
            modal?.RemoveFromHierarchy();
            modal = null;
            pointers.Clear();
        }

        void ShowFleet()
        {
            if (game.Session.Locked)
                return;
            var panel = OpenModal("THE HANGAR / 16 ROCKETS", "Choose your next flight.");
            Text(panel, "Estes recreations and miniature icons of spaceflight.", "muted");
            var scroll = new ScrollView();
            panel.Add(scroll);
            var grid = Box(scroll, "fleet-grid");
            foreach (var r in game.Catalog.rockets)
            {
                var b = Button(
                    grid,
                    $"{r.name}\n\n{r.length * 100:0.#} cm · {r.recommended}\n{r.family}",
                    () =>
                    {
                        game.SelectRocket(r.id);
                        CloseModal();
                    },
                    "fleet-card"
                );
                b.style.borderTopColor = Geometry.Color(r.accent);
                b.EnableInClassList("selected", r.id == game.Selected.id);
            }
        }

        void ShowConditions()
        {
            if (game.Session.Locked || game.Session.Stage == Preparation.Landed)
                return;
            var panel = OpenModal("RANGE CONDITIONS", "Set up your flight.");
            var scroll = new ScrollView();
            panel.Add(scroll);
            void Slider(string title, float min, float max, float initial, Action<float> apply)
            {
                var row = Box(scroll, "setting");
                var label = Text(row, $"{title}    {initial:0.0}");
                var slider = new Slider(min, max) { value = initial };
                row.Add(slider);
                slider.RegisterValueChangedCallback(e =>
                {
                    label.text = $"{title}    {e.newValue:0.0}";
                    apply(e.newValue);
                });
            }
            Slider(
                "Wind · m/s",
                0,
                6,
                (float)game.Conditions.wind,
                v =>
                {
                    var c = game.Conditions;
                    c.wind = v;
                    game.SetConditions(c);
                }
            );
            Slider(
                "Wind FROM · degrees",
                0,
                360,
                (float)game.Conditions.windDirection,
                v =>
                {
                    var c = game.Conditions;
                    c.windDirection = v;
                    game.SetConditions(c);
                }
            );
            Slider(
                "Gust amplitude · m/s",
                0,
                3,
                (float)game.Conditions.gusts,
                v =>
                {
                    var c = game.Conditions;
                    c.gusts = v;
                    game.SetConditions(c);
                }
            );
            Slider(
                "Rod length · meters",
                .6f,
                1.8f,
                (float)game.Conditions.rodLength,
                v =>
                {
                    var c = game.Conditions;
                    c.rodLength = Math.Min(1.8, Math.Max(.6, v));
                    game.SetConditions(c);
                }
            );
            Slider(
                "Rod tilt · degrees",
                0,
                10,
                (float)game.Conditions.angle,
                v =>
                {
                    var c = game.Conditions;
                    c.angle = v;
                    game.SetConditions(c);
                }
            );
            Slider(
                "Rod bearing · degrees",
                0,
                360,
                (float)game.Conditions.heading,
                v =>
                {
                    var c = game.Conditions;
                    c.heading = v;
                    game.SetConditions(c);
                }
            );
            Slider(
                "Nose ballast · grams",
                0,
                40,
                (float)game.Conditions.ballast,
                v =>
                {
                    var c = game.Conditions;
                    c.ballast = v;
                    game.SetConditions(c);
                }
            );
            Text(
                scroll,
                "All physical settings lock when the controller is armed. The launch button captures the flight before the ignition delay.",
                "fine"
            );
        }

        void ShowCredits()
        {
            var panel = OpenModal("ABOUT ROCKET RANGE", "A day at the launch field.");
            var scroll = new ScrollView();
            panel.Add(scroll);
            Text(
                scroll,
                "Choose a rocket and engine, load it, mount it, insert the safety key, and launch. Flight is automatic. Drag to orbit, pinch to zoom, or select a camera. There are no flight controls.",
                "body"
            );
            Text(
                scroll,
                "This is an approximate hobby-flight simulation. Dry CG, drag, inertia, damping, canopy strength, and scale mounts are estimated. Motor samples retain their source classifications.",
                "body"
            );
            Text(scroll, $"Selected motor: {game.Motor.provenance}", "eyebrow");
            Button(scroll, "View thrust source", () => Application.OpenURL(game.Motor.source));
            var credits = Resources.Load<TextAsset>("Data/Attribution");
            Text(
                scroll,
                credits ? credits.text : "Original code: MIT. See repository asset credits.",
                "body"
            );
            Button(
                scroll,
                "Falcon source and CC BY-SA 4.0 terms",
                () => Application.OpenURL("https://commons.wikimedia.org/wiki/File:Falcon_9.stl")
            );
            Button(
                scroll,
                "Creative Commons Attribution-ShareAlike 4.0",
                () => Application.OpenURL("https://creativecommons.org/licenses/by-sa/4.0/")
            );
            Button(
                scroll,
                "NASA 3D resources and usage terms",
                () => Application.OpenURL("https://science.nasa.gov/3d-resources/")
            );
        }
    }
}
