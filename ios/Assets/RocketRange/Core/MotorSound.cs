using System;

namespace RocketRange.Core
{
    public static class MotorSound
    {
        sealed class Filter
        {
            readonly double b0,b1,b2,a1,a2; double z1,z2;
            public Filter(int type,double frequency,int rate,double q=.7071067811865476)
            {
                double w=2*Math.PI*Math.Min(frequency,rate*.42)/rate, c=Math.Cos(w), alpha=Math.Sin(w)/(2*q), a0=1+alpha;
                b0=(type==0?(1+c)/2:type==1?(1-c)/2:alpha)/a0;
                b1=(type==0?-(1+c):type==1?1-c:0)/a0;
                b2=type==2?-b0:b0; a1=-2*c/a0; a2=(1-alpha)/a0;
            }
            public double Apply(double x) {double y=b0*x+z1; z1=b1*x-a1*y+z2; z2=b2*x-a2*y; return y;}
        }
        public static float[] Samples(Motor motor,int sampleRate,uint seed=731)
        {
            if(sampleRate<8000) throw new ArgumentOutOfRangeException(nameof(sampleRate));
            var samples=new float[(int)Math.Ceiling(motor.burn*sampleRate)];
            double Random() {seed=unchecked(seed*1664525+1013904223); return seed/4294967296.0;}
            double size=Math.Max(0,Math.Min(1,Math.Log(motor.impulse/2,2)/5)), peak=0;
            foreach(var p in motor.curve) peak=Math.Max(peak,p.force);
            var high=new Filter(0,420-size*170,sampleRate); var low=new Filter(1,8800-size*2600,sampleRate);
            var rasp=new Filter(2,2100-size*650,sampleRate,.8); var flutter=new Filter(1,65,sampleRate);
            double crackle=0,decay=Math.Exp(-1/(sampleRate*(.0009+size*.0007)));
            for(int i=0;i<samples.Length;i++)
            {
                double t=i/(double)sampleRate,thrust=FlightPhysics.ThrustAt(motor,t);
                double envelope=Math.Pow(thrust/peak,.6)*Math.Min(1,t/.004)*Math.Min(1,(motor.burn-t)/.018), noise=Random()*2-1;
                if(Random()<(110+size*90)/sampleRate) crackle=(Random()*2-1)*(.3+Random()*.7);
                crackle*=decay;
                double texture=noise*(.78+flutter.Apply(noise)*1.4)+rasp.Apply(noise)*.28+crackle*1.3;
                double ignition=noise*Math.Exp(-t/.012)*.22;
                samples[i]=(float)low.Apply(high.Apply((texture*envelope+ignition*Math.Min(1,t/.002))*(.25+size*.13)));
            }
            int fade=Math.Min(samples.Length,(int)Math.Round(sampleRate*.004));
            for(int i=0;i<fade;i++) samples[samples.Length-fade+i]*=1-i/(float)(fade-1);
            return samples;
        }
    }
}
