using System;
using System.Linq;

namespace RocketRange.Core
{
    [Serializable] public sealed class Catalog
    {
        public Rocket[] rockets;
        public Motor[] motors;
        public Rocket Rocket(string id) => rockets.First(r => r.id == id);
        public Motor Motor(string id) => motors.First(m => m.id == id);
    }
    [Serializable] public sealed class Rocket
    {
        public string id, name, family, subtitle, color, accent, nose, recommended, shape, source;
        public double length, diameter, mass, chute, finSpan, finHeight, noseRatio, drag, dryCg, mountDiameter, mountLength;
        public int fins;
        public string[] motors;
        public Rocket Copy() { var r = (Rocket)MemberwiseClone(); r.motors = (string[])motors.Clone(); return r; }
    }
    [Serializable] public struct ThrustSample { public double time, force; }
    [Serializable] public sealed class Motor
    {
        public string id, source, provenance;
        public double diameter, length, impulse, burn, delay, mass, propellant;
        public ThrustSample[] curve;
        public Motor Copy() { var m = (Motor)MemberwiseClone(); m.curve = (ThrustSample[])curve.Clone(); return m; }
    }
    [Serializable] public struct Conditions
    {
        public double wind, angle, heading, windDirection, gusts, rodLength, ballast;
        public static Conditions Default => new Conditions { wind = 1.5, windDirection = 270, rodLength = 1 };
        public void Validate()
        {
            foreach (var value in new[] { wind, angle, heading, windDirection, gusts, rodLength, ballast })
                if (double.IsNaN(value) || double.IsInfinity(value)) throw new ArgumentException("Conditions must be finite.");
            if (wind < 0 || wind > 6 || angle < 0 || angle > 10 || heading < 0 || heading > 360 ||
                windDirection < 0 || windDirection > 360 || gusts < 0 || gusts > 3 || rodLength < .6 || rodLength > 1.8 || ballast < 0 || ballast > 40)
                throw new ArgumentException("Conditions are outside the supported setup limits.");
        }
    }
    public sealed class FlightConfiguration
    {
        internal readonly Rocket rocket;
        internal readonly Motor motor;
        internal readonly Conditions conditions;
        public Rocket Rocket => rocket.Copy();
        public Motor Motor => motor.Copy();
        public Conditions Conditions => conditions;
        public FlightConfiguration(Rocket r, Motor m, Conditions c)
        {
            if (!Fits(r, m)) throw new ArgumentException("Engine is incompatible with this airframe.");
            c.Validate();
            rocket = r.Copy(); motor = m.Copy(); conditions = c;
        }
        public static bool Fits(Rocket r, Motor m) => r.motors.Contains(m.id) && m.diameter == r.mountDiameter && m.length <= r.mountLength;
    }
    public struct DVec
    {
        public double x, y, z;
        public DVec(double x, double y, double z) { this.x = x; this.y = y; this.z = z; }
        public static DVec Up => new DVec(0, 1, 0);
        public double Length => Math.Sqrt(x*x + y*y + z*z);
        public DVec Unit => this / Math.Max(1e-12, Length);
        public static DVec operator +(DVec a, DVec b) => new DVec(a.x+b.x,a.y+b.y,a.z+b.z);
        public static DVec operator -(DVec a, DVec b) => a + b * -1;
        public static DVec operator *(DVec a, double k) => new DVec(a.x*k,a.y*k,a.z*k);
        public static DVec operator /(DVec a, double k) => a * (1/k);
        public static double Dot(DVec a, DVec b) => a.x*b.x+a.y*b.y+a.z*b.z;
        public static DVec Cross(DVec a, DVec b) => new DVec(a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x);
    }
    public enum FlightPhase { Powered, Coast, Recovery, Landed }
    public enum FlightOutcome { Flying, Recovered, HardLanding, NoRecovery, NoLiftoff }
    public struct FlightState
    {
        public double t, apogee, maxSpeed, maxG, impulse, mass, cg, cp, stability, inflation, maxOpeningForce, impactSpeed, maxAngleOfAttack;
        public double? deployedAt, rodExitTime, rodExitSpeed, deploymentSpeed;
        public DVec position, velocity, axis, omega;
        public FlightPhase phase;
        public FlightOutcome outcome;
        public bool liftoff, chuteFailed;
        public static FlightState New(Conditions c) => new FlightState { axis = FlightPhysics.LaunchAxis(c) };
    }
    public struct Stability
    {
        public double mass, cg, cp, margin, normalSlope, inertia;
    }
}
