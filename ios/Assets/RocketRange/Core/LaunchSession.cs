using System;

namespace RocketRange.Core
{
    public enum Preparation
    {
        Workshop,
        Loaded,
        Pad,
        Armed,
        Igniting,
        Flight,
        Landed
    }

    // Rendering and camera state deliberately do not exist in this class.
    public sealed class LaunchSession
    {
        Rocket rocket;
        Motor motor;
        Conditions conditions;
        double ignitionRemaining,
            accumulator;
        public Preparation Stage { get; private set; } = Preparation.Workshop;
        public FlightState State { get; private set; }
        public FlightConfiguration Flight { get; private set; }
        public double IgnitionDelay { get; private set; }
        public int FlightNumber { get; private set; } = 1;
        public bool Locked =>
            Stage == Preparation.Armed
            || Stage == Preparation.Igniting
            || Stage == Preparation.Flight;

        public LaunchSession(Rocket r, Motor m, Conditions c)
        {
            Configure(r, m, c);
        }

        void Require(Preparation expected)
        {
            if (Stage != expected)
                throw new InvalidOperationException("Preparation step is not available.");
        }

        public void Configure(Rocket r, Motor m, Conditions c)
        {
            Require(Preparation.Workshop);
            var validated = new FlightConfiguration(r, m, c);
            rocket = validated.Rocket;
            motor = validated.Motor;
            conditions = c;
            State = FlightState.New(c);
        }

        public void SetConditions(Conditions c)
        {
            if (Locked || Stage == Preparation.Landed)
                throw new InvalidOperationException("Physical setup is locked.");
            c.Validate();
            conditions = c;
            State = FlightState.New(c);
        }

        public void Load()
        {
            Require(Preparation.Workshop);
            Stage = Preparation.Loaded;
        }

        public void Unload()
        {
            if (Stage != Preparation.Loaded && Stage != Preparation.Pad)
                throw new InvalidOperationException("Cannot unload now.");
            Stage = Preparation.Workshop;
        }

        public void Place()
        {
            Require(Preparation.Loaded);
            Stage = Preparation.Pad;
        }

        public void Arm()
        {
            Require(Preparation.Pad);
            Stage = Preparation.Armed;
        }

        public void Disarm()
        {
            Require(Preparation.Armed);
            Stage = Preparation.Pad;
        }

        public void Launch(double randomUnit)
        {
            Require(Preparation.Armed);
            if (double.IsNaN(randomUnit) || randomUnit < 0 || randomUnit > 1)
                throw new ArgumentOutOfRangeException(nameof(randomUnit));
            Flight = new FlightConfiguration(rocket, motor, conditions);
            IgnitionDelay = .25 + .75 * randomUnit;
            ignitionRemaining = IgnitionDelay;
            accumulator = 0;
            State = FlightState.New(conditions);
            Stage = Preparation.Igniting;
        }

        public void Advance(double elapsed)
        {
            if (double.IsNaN(elapsed) || double.IsInfinity(elapsed) || elapsed < 0)
                throw new ArgumentException("Elapsed time must be finite and non-negative.");
            if (Stage == Preparation.Igniting)
            {
                double wait = Math.Min(elapsed, ignitionRemaining);
                ignitionRemaining -= wait;
                elapsed -= wait;
                if (ignitionRemaining <= 1e-10)
                    Stage = Preparation.Flight;
            }
            if (Stage != Preparation.Flight)
                return;
            accumulator += elapsed;
            while (accumulator + 1e-12 >= FlightPhysics.Step && Stage == Preparation.Flight)
            {
                State = FlightPhysics.Integrate(State, Flight);
                accumulator -= FlightPhysics.Step;
                if (State.phase == FlightPhase.Landed)
                    Stage = Preparation.Landed;
            }
        }

        public void PrepareAgain()
        {
            Require(Preparation.Landed);
            Stage = Preparation.Workshop;
            Flight = null;
            accumulator = 0;
            State = FlightState.New(conditions);
            FlightNumber++;
        }
    }
}
