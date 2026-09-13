using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Rendering;

namespace RocketRange
{
    public static class Geometry
    {
        static readonly Dictionary<string,Material> cache=new Dictionary<string,Material>();
        public static Color Color(string hex) {ColorUtility.TryParseHtmlString(hex,out var color); return color;}
        public static Material Paint(string hex,float metallic=0,float smoothness=.3f)
        {
            string key=hex+metallic+"/"+smoothness;
            if(cache.TryGetValue(key,out var m) && m) return m;
            m=new Material(Shader.Find("Universal Render Pipeline/Lit")) {name="Paint "+hex,enableInstancing=true};
            m.SetColor("_BaseColor",Color(hex)); m.SetFloat("_Metallic",metallic); m.SetFloat("_Smoothness",smoothness);
            cache[key]=m; return m;
        }
        public static Transform Group(string name,Transform parent=null)
        {var t=new GameObject(name).transform; if(parent) t.SetParent(parent,false); return t;}
        public static GameObject Mesh(string name,UnityEngine.Mesh mesh,Material mat,Transform parent)
        {
            var g=new GameObject(name,typeof(MeshFilter),typeof(MeshRenderer)); g.transform.SetParent(parent,false);
            g.GetComponent<MeshFilter>().sharedMesh=mesh; var renderer=g.GetComponent<MeshRenderer>(); renderer.sharedMaterial=mat;
            renderer.shadowCastingMode=ShadowCastingMode.On; renderer.receiveShadows=true; return g;
        }
        public static GameObject Box(string name,Transform parent,Vector3 position,Vector3 size,Material mat)
        {
            var g=GameObject.CreatePrimitive(PrimitiveType.Cube); g.name=name; g.transform.SetParent(parent,false);
            g.transform.localPosition=position; g.transform.localScale=size; g.GetComponent<Renderer>().sharedMaterial=mat;
            Object.Destroy(g.GetComponent<Collider>()); return g;
        }
        public static GameObject Cylinder(string name,Transform parent,float bottom,float top,float height,float y,Material mat,int sides=40)
        {
            var mesh=Lathe(new[]{new Vector2(0,0),new Vector2(bottom,0),new Vector2(top,height),new Vector2(0,height)},sides);
            var g=Mesh(name,mesh,mat,parent); g.transform.localPosition=new Vector3(0,y,0); return g;
        }
        public static UnityEngine.Mesh Lathe(Vector2[] profile,int sides=40)
        {
            var vertices=new List<Vector3>(); var uv=new List<Vector2>(); var triangles=new List<int>();
            for(int j=0;j<profile.Length;j++) for(int i=0;i<=sides;i++)
            {
                float a=i*Mathf.PI*2/sides; vertices.Add(new Vector3(Mathf.Cos(a)*profile[j].x,profile[j].y,Mathf.Sin(a)*profile[j].x));
                uv.Add(new Vector2(i/(float)sides,j/(float)(profile.Length-1)));
                if(j>0&&i>0) {int k=j*(sides+1)+i; triangles.AddRange(new[]{k,k-1,k-sides-2,k,k-sides-2,k-sides-1});}
            }
            var m=new UnityEngine.Mesh {name="Lathe"}; m.SetVertices(vertices); m.SetUVs(0,uv); m.SetTriangles(triangles,0); m.RecalculateNormals(); m.RecalculateBounds(); return m;
        }
        public static GameObject Beam(string name,Transform parent,Vector3 start,Vector3 end,float radius,Material mat)
        {
            var g=Cylinder(name,parent,radius,radius,Vector3.Distance(start,end),0,mat,8);
            g.transform.localPosition=start; g.transform.localRotation=Quaternion.FromToRotation(Vector3.up,(end-start).normalized); return g;
        }
        public static UnityEngine.Mesh Fin(float radius,float span,float height)
        {
            float thick=.0012f;
            var v=new[]{new Vector3(radius,0,-thick),new Vector3(radius+span,0,-thick),new Vector3(radius+span,height*.43f,-thick),new Vector3(radius,height,-thick),new Vector3(radius,0,thick),new Vector3(radius+span,0,thick),new Vector3(radius+span,height*.43f,thick),new Vector3(radius,height,thick)};
            var m=new UnityEngine.Mesh {name="Airframe fin",vertices=v,triangles=new[]{0,2,1,0,3,2,4,5,6,4,6,7,0,1,5,0,5,4,1,2,6,1,6,5,2,3,7,2,7,6,3,0,4,3,4,7}};
            m.RecalculateNormals(); m.RecalculateBounds(); return m;
        }
    }
}
