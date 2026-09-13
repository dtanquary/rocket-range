using RocketRange.Core;
using UnityEngine;

namespace RocketRange
{
    public sealed class RangeAudio : MonoBehaviour
    {
        AudioSource motor; AudioLowPassFilter air; AudioClip clip;
        public bool Muted {get;private set;}
        void Awake()
        {
            motor=gameObject.AddComponent<AudioSource>(); motor.playOnAwake=false; motor.spatialBlend=1;
            motor.rolloffMode=AudioRolloffMode.Logarithmic; motor.minDistance=8; motor.maxDistance=8000; motor.dopplerLevel=.4f; motor.volume=.8f;
            air=gameObject.AddComponent<AudioLowPassFilter>(); air.lowpassResonanceQ=.5f;
        }
        public void ToggleMute() {Muted=!Muted; motor.mute=Muted;}
        public void Ignite(Motor model,double elapsed,uint seed)
        {
            Stop(); if(elapsed>=model.burn) return;
            const int rate=44100; var data=MotorSound.Samples(model,rate,seed);
            clip=AudioClip.Create("Hobby motor "+model.id,data.Length,1,rate,false); clip.SetData(data,0);
            motor.clip=clip; motor.time=(float)elapsed; motor.Play();
        }
        public void Spatial(Vector3 position,Vector3 listener)
        {transform.position=position; air.cutoffFrequency=1600+8500*Mathf.Exp(-Vector3.Distance(position,listener)/220);}
        public void Stop() {motor.Stop(); motor.clip=null; if(clip) Destroy(clip); clip=null;}
        void OnDestroy() {if(clip) Destroy(clip);}
    }
}
