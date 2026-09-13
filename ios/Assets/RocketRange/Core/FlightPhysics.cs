using System;

namespace RocketRange.Core
{
    // Port of web/lib/rocket/physics.ts. SI units, nose-relative CG/CP, no renderer inputs.
    public static class FlightPhysics
    {
        public const double Step = 1.0 / 120, Gravity = 9.80665;
        static double Clamp(double v, double a, double b) => Math.Min(b, Math.Max(a,v));
        static double Square(double x) => x*x;
        public static DVec LaunchAxis(Conditions c)
        {
            double tilt = c.angle*Math.PI/180, az = c.heading*Math.PI/180;
            return new DVec(Math.Sin(tilt)*Math.Sin(az), Math.Cos(tilt), -Math.Sin(tilt)*Math.Cos(az));
        }
        public static double ThrustAt(Motor m, double t)
        {
            if (t < 0 || t >= m.burn) return 0;
            for(int i=1;i<m.curve.Length;i++) if(t<m.curve[i].time)
            {
                var a=m.curve[i-1]; var b=m.curve[i];
                return a.force+(b.force-a.force)*(t-a.time)/(b.time-a.time);
            }
            return 0;
        }
        public static double ImpulseAt(Motor m, double t)
        {
            double impulse=0;
            for(int i=1;i<m.curve.Length;i++)
            {
                var a=m.curve[i-1]; var b=m.curve[i];
                if(t<=a.time) break;
                double duration=Math.Min(t,b.time)-a.time;
                double force=a.force+(b.force-a.force)*duration/(b.time-a.time);
                impulse+=(a.force+force)*duration/2;
                if(t<=b.time) break;
            }
            return impulse;
        }
        public static Stability StabilityOf(Rocket r, Motor m, Conditions c, double burnFraction=0)
        {
            double root=r.finHeight, tip=root*.43, sweep=root*.57, span=r.finSpan;
            double midSpan=Math.Sqrt(span*span+Square(sweep+(tip-root)/2));
            double finSlope=((1+r.diameter/2/(span+r.diameter/2))*(4*r.fins*Square(span/r.diameter)))/(1+Math.Sqrt(1+Square(2*midSpan/(root+tip))));
            double finCp=r.length-root+sweep*(root+2*tip)/(3*(root+tip))+(root+tip-root*tip/(root+tip))/6;
            double noseCp=r.length*r.noseRatio*2/3;
            double cp=(2*noseCp+finSlope*finCp)/(2+finSlope);
            double motorMass=m.mass-m.propellant*Clamp(burnFraction,0,1), ballast=c.ballast/1000;
            double mass=r.mass+motorMass+ballast, dryCg=r.length*r.dryCg, motorCg=r.length-m.length/2000, noseBallastCg=r.length*.12;
            double cg=(r.mass*dryCg+motorMass*motorCg+ballast*noseBallastCg)/mass;
            double inertia=r.mass*r.length*r.length/12+r.mass*Square(dryCg-cg)+motorMass*Square(motorCg-cg)+ballast*Square(noseBallastCg-cg);
            return new Stability {mass=mass,cg=cg,cp=cp,margin=(cp-cg)/r.diameter,normalSlope=2+finSlope,inertia=inertia};
        }
        public static DVec WindAt(Conditions c, double height, double t)
        {
            double profile=Math.Pow(Math.Max(1,height)/10,.14);
            double gust=c.gusts*(.55*Math.Sin(t*1.31)+.3*Math.Sin(t*2.73+.7)+.15*Math.Sin(t*.43+2));
            double speed=Math.Max(0,c.wind+gust)*profile, bearing=c.windDirection*Math.PI/180;
            return new DVec(-Math.Sin(bearing)*speed,0,Math.Cos(bearing)*speed);
        }
        public static FlightState Integrate(FlightState s, FlightConfiguration config, double dt=Step)
        {
            if(s.phase==FlightPhase.Landed) return s;
            if(double.IsNaN(dt)||double.IsInfinity(dt)||dt<0) throw new ArgumentException("Timestep must be finite and non-negative.");
            if(dt==0) return s;
            Rocket r=config.rocket; Motor m=config.motor; Conditions c=config.conditions;
            double t=s.t+dt, impulse=ImpulseAt(m,t), thrust=(impulse-s.impulse)/dt;
            var p=StabilityOf(r,m,c,impulse/m.impulse);
            double mass=p.mass,cg=p.cg,cp=p.cp,inertia=p.inertia,slope=p.normalSlope;
            var phase=t<m.burn?FlightPhase.Powered:FlightPhase.Coast;
            DVec axis=s.t==0?LaunchAxis(c):s.axis, omega=s.omega;
            DVec relative=s.velocity-WindAt(c,s.position.y,t);
            double airspeed=relative.Length, axialSpeed=DVec.Dot(relative,axis);
            DVec flow=relative.Unit, perpendicular=relative-axis*axialSpeed;
            double rho=1.195*Math.Exp(-Math.Max(0,s.position.y)/8500), area=Math.PI*Square(r.diameter/2), q=.5*rho*airspeed*airspeed;
            DVec axialDrag=axis*(-.5*rho*r.drag*area*axialSpeed*Math.Abs(axialSpeed));
            DVec normalForce=perpendicular*(-q*area*slope/Math.Max(.2,airspeed))+perpendicular*(-.5*rho*.8*r.length*r.diameter*perpendicular.Length);
            if(t>=m.burn+m.delay && s.liftoff)
            {
                phase=FlightPhase.Recovery;
                if(!s.deployedAt.HasValue) {s.deployedAt=t; s.deploymentSpeed=airspeed;}
                s.inflation=Clamp((t-s.deployedAt.Value)/.7,0,1);
            }
            double chuteArea=s.inflation*.78*Math.PI*Square(r.chute/2)*(s.chuteFailed?.12:1);
            double openingForce=q*chuteArea;
            if(!s.chuteFailed && s.inflation>0 && openingForce>r.mass*Gravity*28) {s.chuteFailed=true; chuteArea*=.12;}
            DVec chuteForce=relative*(-.5*rho*chuteArea*airspeed);
            DVec force=axis*thrust+axialDrag+normalForce+chuteForce+new DVec(0,-mass*Gravity,0);
            if(!s.rodExitTime.HasValue)
            {
                axis=LaunchAxis(c); omega=new DVec();
                double speed=Math.Max(0,DVec.Dot(s.velocity,axis)+DVec.Dot(force,axis)/mass*dt);
                s.velocity=axis*speed; s.position+=s.velocity*dt;
                if(DVec.Dot(s.position,axis)>=Math.Max(.25,c.rodLength-r.length*.3)) {s.rodExitTime=t; s.rodExitSpeed=speed;}
            }
            else
            {
                s.velocity+=force*(dt/mass); s.position+=s.velocity*dt;
                DVec torque=DVec.Cross(axis*(cg-cp),normalForce)+DVec.Cross(axis*(cg*.8),chuteForce);
                double damping=.5*rho*Math.Max(1,airspeed)*area*slope*Square(cp-cg)*1.4+(s.inflation>0?mass*r.length*r.length*.9:0);
                omega=(omega+torque*(dt/Math.Max(1e-7,inertia)))/(1+damping*dt/Math.Max(1e-7,inertia));
                omega-=axis*DVec.Dot(omega,axis);
                axis=(axis+DVec.Cross(omega,axis)*dt).Unit;
            }
            s.liftoff=s.liftoff||s.position.y>.015;
            if(s.liftoff && s.position.y<=0)
            {
                s.impactSpeed=s.velocity.Length; s.position.y=0; s.velocity=new DVec(); phase=FlightPhase.Landed;
                s.outcome=!s.deployedAt.HasValue?FlightOutcome.NoRecovery:s.chuteFailed||s.impactSpeed>8?FlightOutcome.HardLanding:FlightOutcome.Recovered;
            }
            else if(!s.liftoff && t>=m.burn)
            {phase=FlightPhase.Landed; s.outcome=FlightOutcome.NoLiftoff; s.position=new DVec(); s.velocity=new DVec();}
            double aoa=airspeed>.1?Math.Acos(Clamp(DVec.Dot(axis,flow),-1,1))*180/Math.PI:0;
            s.t=t; s.phase=phase; s.axis=axis; s.omega=omega; s.impulse=impulse; s.mass=mass; s.cg=cg; s.cp=cp; s.stability=p.margin;
            s.apogee=Math.Max(s.apogee,s.position.y); s.maxSpeed=Math.Max(s.maxSpeed,s.velocity.Length);
            s.maxG=Math.Max(s.maxG,thrust/mass/Gravity); s.maxOpeningForce=Math.Max(s.maxOpeningForce,openingForce);
            s.maxAngleOfAttack=Math.Max(s.maxAngleOfAttack,s.rodExitTime.HasValue&&phase!=FlightPhase.Recovery&&phase!=FlightPhase.Landed?aoa:0);
            return s;
        }
        public static FlightState Predict(FlightConfiguration config)
        {
            var s=FlightState.New(config.conditions);
            for(int i=0;i<120*300 && s.phase!=FlightPhase.Landed;i++) s=Integrate(s,config);
            return s;
        }
    }
}
