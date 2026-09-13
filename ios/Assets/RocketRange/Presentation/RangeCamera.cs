using UnityEngine;

namespace RocketRange
{
    public enum ViewMode { Orbit, Follow, Ground, Onboard }
    public sealed class RangeCamera
    {
        public ViewMode Mode {get;private set;}=ViewMode.Orbit;
        readonly Camera camera; Vector3 followOffset;float followLift,yaw=38,pitch=16,distance=2.2f;
        public RangeCamera(Camera camera){this.camera=camera;}
        public void Select(ViewMode mode,Vector3 focus){Mode=mode;followOffset=camera.transform.position-focus;followLift=0;}
        public void Orbit(Vector2 delta){if(Mode!=ViewMode.Orbit)return;yaw-=delta.x*.2f;pitch=Mathf.Clamp(pitch+delta.y*.15f,-8,78);}
        public void Zoom(float delta){if(Mode==ViewMode.Orbit)distance=Mathf.Clamp(distance*Mathf.Exp(delta*.004f),.35f,1800);}
        public void Frame(float length){distance=Mathf.Max(1.2f,length*2.7f);}
        public void Update(Transform rocket,float length,float diameter,float chute,float inflation,bool inFlight,float dt)
        {
            var focus=rocket.position+Vector3.up*length*.48f;var t=camera.transform;
            if(Mode==ViewMode.Onboard)
            {t.position=rocket.TransformPoint(new Vector3(diameter*.85f,length*.72f,0));t.rotation=Quaternion.LookRotation(rocket.TransformDirection(new Vector3(.22f,-1,-.08f).normalized),rocket.right);return;}
            if(Mode==ViewMode.Ground)
            {t.position=new Vector3(5,1.65f,8);t.rotation=Quaternion.LookRotation(focus-t.position,Vector3.up);return;}
            if(Mode==ViewMode.Follow)
            {
                float smooth=1-Mathf.Exp(-5*dt),d=Mathf.Max(.65f,length*2,inflation*(length+chute*2.2f));
                followOffset=Vector3.Lerp(followOffset,new Vector3(d*.8f,Mathf.Max(.4f,d*.33f),d*1.35f),smooth);
                followLift=Mathf.Lerp(followLift,inflation*(length*.2f+chute*.4f),smooth);
                var anchor=focus+Vector3.up*followLift;t.position=anchor+followOffset;t.rotation=Quaternion.LookRotation(anchor-t.position,Vector3.up);return;
            }
            // Orbit stays at the range after launch; its controls change only the observer.
            if(inFlight)focus=RangeWorld.PadOrigin+Vector3.up*length*.5f;
            var offset=Quaternion.Euler(pitch,yaw,0)*new Vector3(0,0,distance);t.position=focus+offset;t.rotation=Quaternion.LookRotation(focus-t.position,Vector3.up);
        }
    }
}
