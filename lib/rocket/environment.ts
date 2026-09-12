import * as T from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { beam, cylinder, materials, mesh, createController } from './models';
export function random(seed=42){let s=seed;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
const noiseGLSL=`
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
`;
export function buildEnvironment(scene:T.Scene){
  const root=new T.Group();scene.add(root);const rand=random();
  scene.background=new T.Color('#b4d0d9');scene.fog=new T.FogExp2('#bfd1cf',.00135);
  const sky=new Sky();sky.scale.setScalar(450000);const u=sky.material.uniforms;
  u.turbidity.value=3;u.rayleigh.value=1.5;u.mieCoefficient.value=.005;u.mieDirectionalG.value=.83;
  const sunPos=new T.Vector3(-.5,.5,-.75).normalize();u.sunPosition.value.copy(sunPos);scene.add(sky);
  scene.add(new T.HemisphereLight('#d5e9ff','#6b7543',2.5));
  const sun=new T.DirectionalLight('#fff0ca',3.8);sun.position.set(-24,35,-18);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-18;sun.shadow.camera.right=18;sun.shadow.camera.top=18;sun.shadow.camera.bottom=-18;sun.shadow.camera.far=110;sun.shadow.normalBias=.015;sun.shadow.bias=-.00012;scene.add(sun);
  const groundMat=new T.MeshStandardMaterial({color:'#81905a',roughness:1});
  groundMat.onBeforeCompile=shader=>{
    shader.vertexShader='varying vec3 vGround;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvGround = position;');
    shader.fragmentShader='varying vec3 vGround;\n'+noiseGLSL+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      vec2 p=vGround.xz;float n=noise(p*.22)*.55+noise(p*1.4)*.28+noise(p*9.)*.17;
      vec3 grass=mix(vec3(.18,.25,.095),vec3(.47,.49,.23),n);
      float stripe=smoothstep(.45,.55,sin(p.x*.16)*.5+.5);grass*=.93+stripe*.12;
      float dust=1.-smoothstep(.8,1.6,length(p));
      diffuseColor.rgb=mix(grass,vec3(.40,.35,.25),dust*.8);`);
  };
  const groundGeo=new T.PlaneGeometry(3600,3600,140,140);groundGeo.rotateX(-Math.PI/2);
  const a=groundGeo.attributes.position;for(let i=0;i<a.count;i++){const x=a.getX(i),z=a.getZ(i),d=Math.hypot(x,z);a.setY(i,d<120?-.025:Math.max(0,Math.sin(x*.004+1)*Math.cos(z*.005)*38+Math.sin(z*.011+x*.003)*12)*Math.min(1,(d-120)/180)-.025);}
  groundGeo.computeVertexNormals();mesh(groundGeo,groundMat,root).castShadow=false;
  // Individual grass blades, instanced once and animated on the GPU.
  const blade=new T.BufferGeometry();blade.setAttribute('position',new T.Float32BufferAttribute([-.018,0,0,.018,0,0,-.011,.075,.006,.011,.075,.006,0,.15,.025],3));blade.setIndex([0,1,2,1,3,2,2,3,4]);blade.computeVertexNormals();
  const grassMat=new T.MeshStandardMaterial({color:'#74894a',side:T.DoubleSide,roughness:1});const time={value:0};
  grassMat.onBeforeCompile=s=>{s.uniforms.uTime=time;s.vertexShader='uniform float uTime;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>\ntransformed.x += sin(uTime*1.6+instanceMatrix[3].x*.65+instanceMatrix[3].z*.4)*position.y*position.y*1.4;`);};
  const grass=new T.InstancedMesh(blade,grassMat,38000);const dummy=new T.Object3D();const col=new T.Color();
  for(let i=0;i<38000;i++){const angle=rand()*Math.PI*2,d=Math.sqrt(rand())*(i<22000?22:105);const x=Math.cos(angle)*d,z=Math.sin(angle)*d;dummy.position.set(x,-.015,z);dummy.rotation.y=rand()*Math.PI;const scale=d<1.1?.03:(.45+rand()*.7);dummy.scale.set(scale,scale*(d<12?.5:1),scale);dummy.updateMatrix();grass.setMatrixAt(i,dummy.matrix);col.setHSL(.19+rand()*.06,.22+rand()*.18,.23+rand()*.11);grass.setColorAt(i,col);}
  grass.receiveShadow=true;grass.frustumCulled=false;root.add(grass);
  // A tree line in irregular clusters, with shadowed trunks and foliage.
  const trunks=new T.InstancedMesh(new T.CylinderGeometry(.16,.26,1,7),new T.MeshStandardMaterial({color:'#514638',roughness:1}),230);
  const leaves=new T.InstancedMesh(new T.IcosahedronGeometry(1,2),new T.MeshStandardMaterial({color:'#354c2c',roughness:1}),230*5);
  for(let i=0;i<230;i++){
    const angle=rand()*Math.PI*2,d=125+rand()*210,x=Math.cos(angle)*d,z=Math.sin(angle)*d,h=4+rand()*9;
    dummy.position.set(x,h*.35,z);dummy.scale.set(1,h*.7,1);dummy.rotation.set(0,0,0);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);
    for(let j=0;j<5;j++){dummy.position.set(x+(rand()-.5)*h*.4,h*.62+rand()*h*.22,z+(rand()-.5)*h*.4);dummy.scale.set(h*(.22+rand()*.11),h*(.24+rand()*.17),h*(.2+rand()*.15));dummy.rotation.set(rand(),rand(),rand());dummy.updateMatrix();leaves.setMatrixAt(i*5+j,dummy.matrix);col.setHSL(.21+rand()*.08,.21+rand()*.2,.13+rand()*.1);leaves.setColorAt(i*5+j,col);}
  }trunks.castShadow=true;leaves.castShadow=true;root.add(trunks,leaves);
  const wood=new T.MeshStandardMaterial({color:'#a59c7e',roughness:.92});
  // Low split-rail fence along the far side of the range.
  for(let i=-16;i<=16;i++){const x=i*5;mesh(new T.BoxGeometry(.15,1.2,.15),wood,root,x,.6,-82);if(i<16)for(const y of [.45,.94])mesh(new T.BoxGeometry(5,.095,.095),wood,root,x+2.5,y,-82);}
  // Preparation table, with real launch controller and a field equipment case.
  const bench=new T.Group();bench.position.set(1.4,0,.35);root.add(bench);
  mesh(new T.BoxGeometry(.85,.04,.5),wood,bench,0,.69,0);
  for(const x of [-.34,.34])for(const z of [-.17,.17])beam(bench,new T.Vector3(x,0,z),new T.Vector3(x*.8,.67,z),.018,materials.steel);
  const controller=createController();controller.position.set(.22,.711,0);controller.rotation.y=-.25;bench.add(controller);
  mesh(new T.BoxGeometry(.34,.2,.25),materials.black,root,2,.1,.5);
  // A striped windsock and boundary cones.
  const sock=new T.Group();sock.position.set(-5,0,-5);root.add(sock);cylinder(sock,.022,.022,3.1,1.55,materials.steel);
  const fabric=new T.Group();fabric.position.y=3;fabric.rotation.z=-Math.PI/2;fabric.rotation.x=.16;sock.add(fabric);
  for(let i=0;i<6;i++){const r=.16-i*.018;cylinder(fabric,r-.018,r,.16,i*.16,new T.MeshStandardMaterial({color:i%2?'#f5ece1':'#e86028',side:T.DoubleSide}));}
  for(let i=0;i<7;i++){const x=(i-3)*3;const cone=new T.Group();cone.position.set(x,0,8);root.add(cone);mesh(new T.BoxGeometry(.22,.022,.22),materials.black,cone,0,.011,0);cylinder(cone,.016,.08,.28,.16,new T.MeshStandardMaterial({color:'#e56b2c'}));cylinder(cone,.04,.05,.04,.19,new T.MeshStandardMaterial({color:'#f0eadd'}));}
  // A controller lead resting on the grass.
  const points=[new T.Vector3(1.6,.73,.35),new T.Vector3(1.85,.2,.5),new T.Vector3(1.4,.013,.8),new T.Vector3(.6,.013,.65),new T.Vector3(.25,.02,.3),new T.Vector3(0,.14,0)];
  mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),60,.0025,5,false),materials.black,root);
  // Soft, layered cloud sheets at a true sky distance.
  const cloudMat=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{uTime:time},vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec2 vUv;uniform float uTime;${noiseGLSL}void main(){vec2 p=vUv*8.+vec2(uTime*.003,0.);float n=noise(p)*.5+noise(p*2.)*.3+noise(p*4.)*.2;float edge=smoothstep(0.,.18,vUv.x)*smoothstep(0.,.18,1.-vUv.x)*smoothstep(0.,.18,vUv.y)*smoothstep(0.,.18,1.-vUv.y);float a=smoothstep(.42,.7,n)*edge*.58;gl_FragColor=vec4(mix(vec3(.83,.86,.84),vec3(1.),n),a);}`});
  for(let i=0;i<5;i++){const c=mesh(new T.PlaneGeometry(1900,900),cloudMat,root,(i-2)*850,500+i*30,-1400-i*180);c.rotation.x=-.35;c.castShadow=false;c.receiveShadow=false;}
  return {root,sky,sun,update:(t:number,wind:number)=>{time.value=t;fabric.rotation.y=Math.sin(t*.6)*.07;fabric.rotation.z=-Math.PI/2+.15+Math.sin(t*2)*.025*Math.max(.2,wind);}};
}
