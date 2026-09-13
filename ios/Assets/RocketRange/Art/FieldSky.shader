Shader "RocketRange/FieldSky"
{
    Properties
    {
        _Zenith ("Zenith", Color) = (.19, .39, .64, 1)
        _Horizon ("Horizon", Color) = (.64, .76, .80, 1)
        _SunDirection ("Sun direction", Vector) = (0, 1, 0, 0)
        _WindOffset ("Cloud drift", Vector) = (0, 0, 0, 0)
    }
    SubShader
    {
        Tags { "Queue"="Background" "RenderType"="Background" "PreviewType"="Skybox" "RenderPipeline"="UniversalPipeline" }
        Cull Off ZWrite Off
        Pass
        {
            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            CBUFFER_START(UnityPerMaterial)
            half4 _Zenith, _Horizon;
            float4 _SunDirection, _WindOffset;
            CBUFFER_END
            struct Attributes { float4 positionOS : POSITION; };
            struct Varyings { float4 positionCS : SV_POSITION; float3 direction : TEXCOORD0; };
            Varyings vert(Attributes v)
            {
                Varyings o;
                o.positionCS = TransformObjectToHClip(v.positionOS.xyz);
                o.direction = v.positionOS.xyz;
                return o;
            }
            float hash(float2 p)
            {
                p = frac(p * float2(123.34, 456.21));
                p += dot(p, p + 45.32);
                return frac(p.x * p.y);
            }
            float noise(float2 p)
            {
                float2 cell = floor(p), f = frac(p);
                f = f * f * (3 - 2 * f);
                return lerp(lerp(hash(cell), hash(cell + float2(1, 0)), f.x),
                    lerp(hash(cell + float2(0, 1)), hash(cell + 1), f.x), f.y);
            }
            float cloudNoise(float2 p)
            {
                return noise(p) * .55 + noise(p * 2.03 + 7) * .27
                    + noise(p * 4.11 + 19) * .13 + noise(p * 8.21) * .05;
            }
            half4 frag(Varyings i) : SV_Target
            {
                float3 ray = normalize(i.direction);
                float elevation = saturate(ray.y);
                half3 sky = lerp(_Horizon.rgb, _Zenith.rgb, pow(elevation, .45));
                float sunDot = saturate(dot(ray, normalize(_SunDirection.xyz)));
                sky += half3(1, .82, .55) * (pow(sunDot, 1800) * 3 + pow(sunDot, 18) * .08);
                // Two high, sparse layers. Fade near the horizon and keep the zenith mostly blue.
                // World-plane projection preserves parallax without placing opaque blobs in the flight field.
                float2 p = (_WorldSpaceCameraPos.xz + ray.xz * max(200, 1600 - _WorldSpaceCameraPos.y)
                    / max(.07, ray.y) - _WindOffset.xy) / 680;
                float n = cloudNoise(p);
                float density = smoothstep(.62, .79, n);
                float wisps = smoothstep(.69, .86, cloudNoise(p * float2(.55, 1.7) + 43));
                float visibility = smoothstep(.03, .18, ray.y) * (1 - smoothstep(.68, .98, ray.y) * .7);
                half3 cloud = lerp(half3(.63, .71, .76), half3(.96, .96, .90), smoothstep(.60, .83, n));
                sky = lerp(sky, cloud, density * visibility * .82);
                sky = lerp(sky, half3(.84, .88, .89), wisps * visibility * .20);
                return half4(sky, 1);
            }
            ENDHLSL
        }
    }
}
