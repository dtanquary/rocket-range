using System;
using System.Collections.Generic;
using RocketRange.Core;
using UnityEngine;
using static RocketRange.Geometry;

namespace RocketRange
{
    public sealed class RocketVisual : MonoBehaviour
    {
        public Transform Airframe {get;private set;}
        Transform cap,canopy; LineRenderer[] cords; LineRenderer shock; Rocket rocket;
        Vector3 capRest; readonly List<UnityEngine.Mesh> ownedMeshes=new List<UnityEngine.Mesh>();
        public bool Imported {get;private set;}
        public void Build(Rocket r)
        {
            rocket=r; Airframe=Group(r.name,transform); cap=Group("Recovery nose",Airframe);
            float length=(float)r.length,radius=(float)r.diameter/2,noseHeight=length*(float)r.noseRatio;
            capRest=new Vector3(0,length-noseHeight,0); cap.localPosition=capRest;
            string resource=r.id=="falcon"?"falcon-9":r.id=="saturn"?"saturn-v":r.id=="redstone"?"mercury-redstone":r.id=="atlas"?"mercury-atlas":null;
            var prefab=resource==null?null:Resources.Load<GameObject>("Models/"+resource);
            bool full=r.id=="falcon"||r.id=="saturn";
            if(prefab && full)
            {
                var model=Instantiate(prefab,Airframe); Normalize(model.transform,length);
                SplitRecovery(model.transform,cap,capRest.y); Imported=true;
            }
            else
            {
                Cylinder("Painted body tube",Airframe,radius,radius,length-noseHeight,0,Paint(r.color,.06f,.4f));
                Cylinder("Engine retainer",Airframe,radius*1.03f,radius*1.03f,.009f,0,Paint("#262D30",.65f,.38f));
                Cylinder("Decal band",Airframe,radius*1.005f,radius*1.005f,length*.07f,length*.21f,Paint(r.accent,.08f,.38f));
                Cylinder("Nose shoulder seam",Airframe,radius*1.005f,radius*1.005f,.001f,length-noseHeight-.001f,Paint("#68716B"));
                if(prefab)
                {
                    var capsule=Instantiate(prefab,cap); Normalize(capsule.transform,noseHeight*.33f); Imported=true;
                    Cylinder("Escape tower",cap,radius*.055f,radius*.04f,noseHeight*.6f,noseHeight*.32f,Paint("#CDBFA5",.4f));
                    Cylinder("Escape motor",cap,radius*.15f,0,noseHeight*.16f,noseHeight*.84f,Paint("#CF5C3A"));
                }
                else
                {
                    var profile=new Vector2[18]; profile[0]=Vector2.zero;
                    for(int i=0;i<17;i++){float u=i/16f;profile[i+1]=new Vector2(radius*Mathf.Cos(u*Mathf.PI/2),u*noseHeight);}
                    Mesh("Molded nose",Lathe(profile),Paint(r.nose,.07f,.5f),cap);
                }
                var lug=Cylinder("Launch lug",Airframe,.002f,.002f,length*.065f,length*.24f,Paint(r.color));
                lug.transform.localPosition+=new Vector3(radius+.002f,0,0);
                if(r.shape=="atlas")
                    for(int j=0;j<2;j++){var pod=Cylinder("Atlas booster",Airframe,radius*.38f,radius*.22f,length*.22f,0,Paint("#BAC3C4",.7f,.45f));pod.transform.localPosition+=new Vector3((j==0?-1:1)*radius,0,0);}
            }
            var finMesh=Fin(radius,(float)r.finSpan,(float)r.finHeight);
            for(int i=0;i<r.fins;i++)
            {var fin=Mesh("Stabilizing fin",finMesh,Paint(full?"#BAC8C4":r.accent,.08f,.35f),Airframe); fin.transform.localRotation=Quaternion.Euler(0,360f*i/r.fins,0);}
            BuildCanopy();
        }
        static void Normalize(Transform model,float height)
        {
            Bounds BoundsOf() {var renderers=model.GetComponentsInChildren<Renderer>();var b=renderers[0].bounds;foreach(var r in renderers)b.Encapsulate(r.bounds);return b;}
            var b=BoundsOf(); var size=b.size;
            if(size.z>size.y&&size.z>size.x)model.localRotation=Quaternion.Euler(-90,0,0);else if(size.x>size.y)model.localRotation=Quaternion.Euler(0,0,90);
            b=BoundsOf();model.localScale*=height/b.size.y;b=BoundsOf();model.position-=new Vector3(b.center.x,b.min.y,b.center.z);
        }
        void SplitRecovery(Transform imported,Transform nose,float cut)
        {
            // Clip each triangle at the ejection plane, preserving UVs, normals, and submeshes.
            foreach(var filter in imported.GetComponentsInChildren<MeshFilter>())
            {
                var source=filter.sharedMesh; var renderer=filter.GetComponent<MeshRenderer>(); if(!renderer)continue;
                var transformToAirframe=Airframe.worldToLocalMatrix*filter.transform.localToWorldMatrix;
                var positions=source.vertices;var normals=source.normals;var uv=source.uv;
                for(int half=0;half<2;half++)
                {
                    var verts=new List<Vector3>();var ns=new List<Vector3>();var tex=new List<Vector2>();var subsets=new List<int[]>();
                    for(int sub=0;sub<source.subMeshCount;sub++)
                    {
                        var indices=new List<int>();var triangles=source.GetTriangles(sub);
                        for(int i=0;i<triangles.Length;i+=3)
                        {
                            var poly=new List<Vertex>();
                            for(int j=0;j<3;j++){int k=triangles[i+j];poly.Add(new Vertex{p=transformToAirframe.MultiplyPoint3x4(positions[k]),n=normals.Length>k?transformToAirframe.MultiplyVector(normals[k]).normalized:Vector3.up,uv=uv.Length>k?uv[k]:Vector2.zero});}
                            var output=new List<Vertex>();
                            for(int j=0;j<poly.Count;j++)
                            {
                                var a=poly[j];var b=poly[(j+1)%poly.Count];bool insideA=half==0?a.p.y<=cut:a.p.y>=cut,insideB=half==0?b.p.y<=cut:b.p.y>=cut;
                                if(insideA)output.Add(a);
                                if(insideA!=insideB){float t=(cut-a.p.y)/(b.p.y-a.p.y);output.Add(new Vertex{p=Vector3.Lerp(a.p,b.p,t),n=Vector3.Lerp(a.n,b.n,t).normalized,uv=Vector2.Lerp(a.uv,b.uv,t)});}
                            }
                            int first=verts.Count;foreach(var v in output){verts.Add(v.p-(half==1?capRest:Vector3.zero));ns.Add(v.n);tex.Add(v.uv);}
                            for(int j=1;j<output.Count-1;j++)indices.AddRange(new[]{first,first+j,first+j+1});
                        }
                        subsets.Add(indices.ToArray());
                    }
                    var mesh=new UnityEngine.Mesh {name="Recovery split",indexFormat=UnityEngine.Rendering.IndexFormat.UInt32};mesh.SetVertices(verts);mesh.SetNormals(ns);mesh.SetUVs(0,tex);mesh.subMeshCount=subsets.Count;
                    for(int i=0;i<subsets.Count;i++)mesh.SetTriangles(subsets[i],i);mesh.RecalculateBounds();ownedMeshes.Add(mesh);
                    var g=Mesh("Imported "+(half==0?"airframe":"nose"),mesh,renderer.sharedMaterial,half==0?Airframe:nose);g.GetComponent<Renderer>().sharedMaterials=renderer.sharedMaterials;
                }
                renderer.enabled=false;
            }
        }
        struct Vertex {public Vector3 p,n;public Vector2 uv;}
        LineRenderer Line(string name,int count,float width)
        {
            var g=new GameObject(name);g.transform.SetParent(transform,false);var l=g.AddComponent<LineRenderer>();
            l.positionCount=count;l.startWidth=width;l.endWidth=width;l.sharedMaterial=Paint("#E8DEC5");l.numCapVertices=2;l.useWorldSpace=true;return l;
        }
        void BuildCanopy()
        {
            canopy=Group("Recovery canopy",transform);
            const int around=48,rings=10;var verts=new List<Vector3>();var triangles=new[]{new List<int>(),new List<int>()};
            float radius=(float)rocket.chute/2;
            for(int j=0;j<=rings;j++) for(int i=0;i<=around;i++)
            {
                float v=j/(float)rings,a=i*Mathf.PI*2/around;float r=radius*Mathf.Sin(v*Mathf.PI/2);
                verts.Add(new Vector3(Mathf.Cos(a)*r,radius*.4f*Mathf.Cos(v*Mathf.PI/2),Mathf.Sin(a)*r));
                if(j>0&&i>0){int k=j*(around+1)+i;triangles[(i-1)/6%2].AddRange(new[]{k,k-around-2,k-1,k,k-around-1,k-around-2,k-1,k-around-2,k,k-around-2,k-around-1,k});}
            }
            var m=new UnityEngine.Mesh {name="Canopy panels"};m.SetVertices(verts);m.subMeshCount=2;m.SetTriangles(triangles[0],0);m.SetTriangles(triangles[1],1);m.RecalculateNormals();m.RecalculateBounds();ownedMeshes.Add(m);
            var g=Mesh("Orange and ivory canopy",m,Paint(rocket.accent),canopy);g.GetComponent<Renderer>().sharedMaterials=new[]{Paint(rocket.accent),Paint("#EDE5D2")};
            cords=new LineRenderer[8];for(int i=0;i<cords.Length;i++)cords[i]=Line("Suspension line",2,.0008f);
            shock=Line("Shock cord",3,.0012f); SetRecoveryVisible(false);
        }
        void SetRecoveryVisible(bool visible){canopy.gameObject.SetActive(visible);foreach(var l in cords)l.enabled=visible;shock.enabled=visible;}
        public void UpdateFlight(FlightState state,bool flying,Vector3 origin)
        {
            Airframe.position=origin+new Vector3((float)state.position.x,(float)state.position.y,(float)state.position.z);
            Airframe.rotation=Quaternion.FromToRotation(Vector3.up,new Vector3((float)state.axis.x,(float)state.axis.y,(float)state.axis.z));
            bool recovery=flying&&state.deployedAt.HasValue;SetRecoveryVisible(recovery);
            if(!recovery){cap.localPosition=capRest;cap.localRotation=Quaternion.identity;return;}
            float inflate=(float)state.inflation,l=(float)rocket.length,c=(float)rocket.chute;
            var attach=Airframe.TransformPoint(new Vector3(0,l*.7f,0));
            var sway=new Vector3(Mathf.Sin((float)state.t*1.4f),0,Mathf.Cos((float)state.t*1.1f))*(c*.12f);
            canopy.position=Airframe.position+Vector3.up*(l+c*.95f)+sway;
            canopy.rotation=Quaternion.Euler(Mathf.Sin((float)state.t)*8,0,Mathf.Cos((float)state.t)*6);
            float scale=Mathf.Max(.06f,inflate)*(state.chuteFailed?.35f:1);canopy.localScale=new Vector3(scale,Mathf.Lerp(2,1,inflate),scale);
            cap.position=attach+Vector3.up*(l*.35f)+Vector3.right*l*.35f;cap.rotation=Quaternion.Euler(35,0,-45);
            if(state.phase==FlightPhase.Landed)
            {Airframe.rotation=Quaternion.Euler(0,25,90);Airframe.position=new Vector3(Airframe.position.x,.05f,Airframe.position.z);canopy.position=Airframe.position+new Vector3(c,.03f,c*.2f);canopy.localScale=new Vector3(1,.08f,1);cap.position=Airframe.position+new Vector3(-l*.4f,.02f,c*.1f);}
            var join=Airframe.TransformPoint(capRest);
            for(int i=0;i<cords.Length;i++){float a=i*Mathf.PI*2/cords.Length;cords[i].SetPosition(0,canopy.TransformPoint(new Vector3(Mathf.Cos(a)*c*.5f,0,Mathf.Sin(a)*c*.5f)));cords[i].SetPosition(1,join);}
            shock.SetPosition(0,join);shock.SetPosition(1,cap.position);shock.SetPosition(2,canopy.position);
        }
        void OnDestroy()
        {
            // Imported resources are shared assets; destroy only runtime meshes owned by this instance.
            foreach(var f in GetComponentsInChildren<MeshFilter>(true)) if(f.sharedMesh && !ownedMeshes.Contains(f.sharedMesh) && f.sharedMesh.name!="Cube")
            {if(f.sharedMesh.name=="Lathe"||f.sharedMesh.name=="Airframe fin")ownedMeshes.Add(f.sharedMesh);}
            foreach(var m in ownedMeshes)if(m)Destroy(m);
        }
    }
}
