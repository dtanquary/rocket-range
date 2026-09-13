using System;
using NUnit.Framework;
using RocketRange.Core;
using UnityEngine;

namespace RocketRange.Tests
{
    public class FlightTests
    {
        Catalog catalog;
        [Serializable] class ReferenceSet {public Reference[] fixtures;}
        [Serializable] class Reference
        {
            public string rocket,motor,outcome;
            public Conditions conditions;
            public double t,apogee,x,z,maxSpeed,impactSpeed,deployedAt,rodExitTime;
        }
        [SetUp] public void Setup() => catalog=JsonUtility.FromJson<Catalog>(Resources.Load<TextAsset>("Data/catalog").text);
        [Test] public void AllEightyTwoFlightsMatchBrowserReference()
        {
            var data=JsonUtility.FromJson<ReferenceSet>(Resources.Load<TextAsset>("Data/flight-reference").text);
            Assert.That(data.fixtures.Length,Is.EqualTo(82));
            foreach(var f in data.fixtures)
            {
                var s=FlightPhysics.Predict(new FlightConfiguration(catalog.Rocket(f.rocket),catalog.Motor(f.motor),f.conditions));
                string name=f.rocket+"/"+f.motor+" wind="+f.conditions.wind;
                Assert.That(s.phase,Is.EqualTo(FlightPhase.Landed),name);
                foreach(var p in new[]{(s.t,f.t),(s.apogee,f.apogee),(s.position.x,f.x),(s.position.z,f.z),(s.maxSpeed,f.maxSpeed),(s.impactSpeed,f.impactSpeed),(s.deployedAt??-1,f.deployedAt),(s.rodExitTime??-1,f.rodExitTime)})
                    Assert.That(p.Item1,Is.EqualTo(p.Item2).Within(.00002),name);
                Assert.That(s.outcome.ToString().ToLowerInvariant(),Is.EqualTo(f.outcome.Replace("-","")),name);
            }
        }
        [Test] public void CompatibilityChecksMountAndVariant()
        {
            var r=catalog.rockets[0]; var m=catalog.Motor("B6-4");
            Assert.IsTrue(FlightConfiguration.Fits(r,m));
            Assert.Throws<ArgumentException>(()=>new FlightConfiguration(r,catalog.Motor("D12-3"),Conditions.Default));
            m.length=95; Assert.IsFalse(FlightConfiguration.Fits(r,m));
            m.length=70; m.diameter=24; Assert.IsFalse(FlightConfiguration.Fits(r,m));
        }
        [Test] public void SnapshotDoesNotShareMutableInputs()
        {
            var r=catalog.rockets[0]; var m=catalog.Motor("B6-4"); var c=Conditions.Default;
            var f=new FlightConfiguration(r,m,c); var expected=FlightPhysics.Predict(f);
            r.mass=999; r.motors[0]="invalid"; m.curve[1].force=999; c.wind=6;
            var exposed=f.Rocket; exposed.mass=888; f.Motor.curve[1].force=888;
            Assert.That(FlightPhysics.Predict(f).apogee,Is.EqualTo(expected.apogee));
        }
        LaunchSession Ready()
        {
            var s=new LaunchSession(catalog.rockets[0],catalog.Motor("B6-4"),Conditions.Default);
            s.Load(); s.Place(); s.Arm(); return s;
        }
        [TestCase(0,.25)] [TestCase(1,1)] [TestCase(.5,.625)]
        public void IgniterDelayLocksSetupAndStartsClockAtIgnition(double random,double delay)
        {
            var s=Ready(); s.Launch(random);
            Assert.That(s.IgnitionDelay,Is.EqualTo(delay));
            Assert.Throws<InvalidOperationException>(()=>s.Launch(0));
            Assert.Throws<InvalidOperationException>(()=>s.SetConditions(Conditions.Default));
            Assert.Throws<InvalidOperationException>(()=>s.Unload());
            Assert.Throws<InvalidOperationException>(()=>s.PrepareAgain());
            s.Advance(delay-.01); Assert.That(s.State.t,Is.Zero);
            s.Advance(.01+FlightPhysics.Step); Assert.That(s.State.t,Is.EqualTo(FlightPhysics.Step).Within(1e-9));
        }
        [Test] public void FramePacingAndBackgroundCatchUpDoNotChangeFlight()
        {
            var a=Ready(); var b=Ready(); a.Launch(.5); b.Launch(.5);
            for(int i=0;i<30000 && a.Stage!=Preparation.Landed;i++) a.Advance(1.0/60);
            b.Advance(300);
            Assert.That(a.Stage,Is.EqualTo(Preparation.Landed));
            Assert.That(b.State.t,Is.EqualTo(a.State.t));
            Assert.That(b.State.position.x,Is.EqualTo(a.State.position.x));
            a.PrepareAgain(); Assert.That(a.State.t,Is.Zero); Assert.That(a.FlightNumber,Is.EqualTo(2));
        }
        [Test] public void EjectionOccursAfterBurnoutAndCanopySlowsDescent()
        {
            var r=catalog.rockets[0]; var m=catalog.Motor("B6-4");
            var s=FlightPhysics.Predict(new FlightConfiguration(r,m,Conditions.Default));
            Assert.That(s.deployedAt.Value,Is.EqualTo(m.burn+m.delay).Within(FlightPhysics.Step));
            Assert.That(s.impactSpeed,Is.InRange(1,8));
            Assert.That(FlightPhysics.ImpulseAt(m,m.burn),Is.EqualTo(m.impulse).Within(1e-9));
        }
        [Test] public void RecoveryFailureIsPhysicalRatherThanForcedSuccess()
        {
            var r=catalog.rockets[0]; var m=catalog.Motor("C6-5"); m.delay=0;
            var early=FlightPhysics.Predict(new FlightConfiguration(r,m,Conditions.Default));
            Assert.IsTrue(early.chuteFailed); Assert.That(early.outcome,Is.EqualTo(FlightOutcome.HardLanding));
            m.delay=25;
            var late=FlightPhysics.Predict(new FlightConfiguration(r,m,Conditions.Default));
            Assert.That(late.outcome,Is.EqualTo(FlightOutcome.NoRecovery));
        }
    }
}
