Shader "RocketRange/Grass"
{
 Properties { _BaseColor("Color",Color)=(.3,.4,.15,1) _Wind("Wind",Float)=1.5 }
 SubShader
 {
  Tags { "RenderType"="Opaque" "RenderPipeline"="UniversalPipeline" }
  Pass
  {
   Tags { "LightMode"="UniversalForward" }
   Cull Off
   HLSLPROGRAM
   #pragma vertex vert
   #pragma fragment frag
   #pragma multi_compile_instancing
   #pragma multi_compile_fog
   #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
   #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"
   CBUFFER_START(UnityPerMaterial)
   half4 _BaseColor;
   float _Wind;
   CBUFFER_END
   struct Attributes { float4 positionOS:POSITION; UNITY_VERTEX_INPUT_INSTANCE_ID };
   struct Varyings { float4 positionCS:SV_POSITION; half brightness:TEXCOORD0; half fog:TEXCOORD1; };
   Varyings vert(Attributes v)
   {
    UNITY_SETUP_INSTANCE_ID(v);
    Varyings o;
    float3 p=TransformObjectToWorld(v.positionOS.xyz);
    p.x+=sin(_Time.y*1.7+p.x*.6+p.z*.4)*v.positionOS.y*v.positionOS.y*(.7+_Wind*.2);
    o.positionCS=TransformWorldToHClip(p);
    o.brightness=.65+saturate(v.positionOS.y*5)*.35+sin(p.x*31+p.z*17)*.06;
    o.fog=ComputeFogFactor(o.positionCS.z);
    return o;
   }
   half4 frag(Varyings i):SV_Target
   {
    Light sun=GetMainLight();half3 c=_BaseColor.rgb*i.brightness*(half3(.5,.56,.58)+sun.color*.5);
    return half4(MixFog(c,i.fog),1);
   }
   ENDHLSL
  }
 }
}
