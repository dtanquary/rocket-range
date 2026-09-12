import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { Rocket } from './catalog';

export const materials = {
  steel:new T.MeshStandardMaterial({color:'#b5bcc0',metalness:.85,roughness:.25}),
  black:new T.MeshStandardMaterial({color:'#191d21',roughness:.55}),
  red:new T.MeshStandardMaterial({color:'#e33925',roughness:.37}),
  yellow:new T.MeshStandardMaterial({color:'#f2c126',roughness:.44}),
};
export function mesh(geo:T.BufferGeometry,mat:T.Material,parent:T.Object3D,x=0,y=0,z=0){
  const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
export function cylinder(parent:T.Object3D,r1:number,r2:number,h:number,y:number,mat:T.Material,x=0,z=0){return mesh(new T.CylinderGeometry(r1,r2,h,48),mat,parent,x,y,z);}
export function beam(parent:T.Object3D,a:T.Vector3,b:T.Vector3,r:number,mat:T.Material){const d=b.clone().sub(a);const m=mesh(new T.CylinderGeometry(r,r,d.length(),8),mat,parent);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;}
function labelTexture(r:Rocket){
  const c=document.createElement('canvas');c.width=1024;c.height=2048;const x=c.getContext('2d')!;
  x.fillStyle=r.color;x.fillRect(0,0,1024,2048);
  x.fillStyle=r.accent;
  if(r.id==='bertha'||r.id==='alpha'){x.fillRect(0,1530,1024,80);x.fillRect(0,1650,1024,34);}
  if(r.id==='max'){x.fillStyle='#e6ded4';x.font='bold 180px Arial';x.textAlign='center';x.fillText('✚',512,600);x.fillStyle=r.accent;}
  if(r.id==='patriot'){x.fillRect(0,0,1024,150);x.fillRect(0,1650,1024,280);}
  if(r.id==='baby'||r.id==='executioner'){x.fillRect(0,1200,1024,370);}
  if(r.id==='mean'){for(let i=0;i<8;i++)x.fillRect(i*128,1320,64,160);}
  if(r.shape==='redstone'||r.shape==='saturn'){for(let i=0;i<8;i++){x.fillRect(i*128,0,64,260);x.fillRect(i*128,1450,64,330);} }
  if(r.shape==='falcon'){x.fillRect(0,480,1024,140);x.fillStyle='#202e3c';}
  x.save();x.translate(540,980);x.rotate(-Math.PI/2);x.textAlign='center';x.font=`700 ${r.id==='mean'?76:92}px Arial`;x.fillText(r.shape==='redstone'||r.shape==='atlas'?'UNITED STATES':r.shape==='falcon'?'SPACEX':r.name.toUpperCase(),0,0);x.restore();
  if(r.family==='Estes classics'){x.font='bold 42px Arial';x.textAlign='center';x.fillText('ESTES',512,1850);}
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.anisotropy=8;return map;
}
function nose(parent:T.Object3D,radius:number,length:number,mat:T.Material,profile='ogive'){
  const pts:T.Vector2[]=[];for(let i=0;i<=32;i++){const t=i/32;const rad=profile==='round'?Math.cos(t*Math.PI/2):Math.pow(1-t*t,.68);pts.push(new T.Vector2(Math.max(.0001,radius*rad),t*length));}
  return mesh(new T.LatheGeometry(pts,48),mat,parent);
}
export function createRocket(r:Rocket){
  const root=new T.Group(),body=new T.Group(),cap=new T.Group();root.add(body,cap);root.userData={cap,body,rocket:r};
  const rad=r.diameter/2,nh=r.length*r.noseRatio,bh=r.length-nh;
  const painted=new T.MeshStandardMaterial({map:labelTexture(r),roughness:.36,metalness:r.shape==='atlas'?.72:.05});
  const accent=new T.MeshStandardMaterial({color:r.accent,roughness:.34});
  const noseMat=new T.MeshStandardMaterial({color:r.nose,roughness:.28,metalness:.08});
  cylinder(body,rad,rad,bh,bh/2,painted);
  cylinder(body,rad*1.005,rad*1.005,.003,.007,materials.steel);
  cylinder(body,rad*.44,rad*.5,.018,-.005,materials.black);
  cap.position.y=bh;
  if(r.shape==='saturn'){
    nose(cap,rad,nh*.35,noseMat);cylinder(cap,rad*.38,rad*.6,nh*.35,nh*.35,noseMat);nose(cap,rad*.38,nh*.4,noseMat).position.y=nh*.52;
    cylinder(cap,.001,.002,nh*.24,nh*.96,materials.steel);
    for(const h of [.3,.53,.72])cylinder(body,rad*1.015,rad*1.015,.014,bh*h,accent);
    for(let i=0;i<5;i++){const a=i*Math.PI/2;const d=i===4?0:rad*.55;cylinder(body,rad*.12,rad*.2,.035,-.02,materials.steel,Math.cos(a)*d,Math.sin(a)*d);}
  }else if(r.shape==='redstone'||r.shape==='atlas'){
    cylinder(cap,rad*.4,rad,r.shape==='atlas'?nh*.28:.008,r.shape==='atlas'?nh*.14:0,materials.steel);
    const base=r.shape==='atlas'?nh*.28:0;cylinder(cap,rad*.14,rad*.45,nh*.33,base+nh*.165,materials.black);
    const towerY=base+nh*.33;
    for(let i=0;i<4;i++){const a=i*Math.PI/2;beam(cap,new T.Vector3(Math.cos(a)*rad*.17,towerY,Math.sin(a)*rad*.17),new T.Vector3(Math.cos(a)*rad*.06,nh*.9,Math.sin(a)*rad*.06),.0013,materials.red);}
    cylinder(cap,.003,.003,nh*.25,nh*.88,materials.red);nose(cap,.003,nh*.06,materials.red).position.y=nh;
  }else{
    nose(cap,rad*(r.shape==='falcon'?1.25:1),nh,noseMat,r.id==='bertha'?'round':'ogive');
  }
  const finShape=new T.Shape();finShape.moveTo(rad*.8,.012);finShape.lineTo(rad+r.finSpan,0);finShape.lineTo(rad+r.finSpan*.85,r.finHeight*.43);finShape.lineTo(rad,r.finHeight);finShape.closePath();
  const finGeo=new T.ExtrudeGeometry(finShape,{depth:Math.min(.002,r.diameter*.04),bevelEnabled:true,bevelSize:.0005,bevelThickness:.0005,bevelSegments:1,steps:1});
  for(let i=0;i<r.fins;i++){const f=mesh(finGeo,accent,body);f.rotation.y=i*Math.PI*2/r.fins;}
  // Launch lug, motor hook and Falcon landing-leg fairings.
  cylinder(body,.003,.003,.025,bh*.35,painted,rad+.002);
  if(r.shape==='falcon'){for(let i=0;i<4;i++){const a=i*Math.PI/2;beam(body,new T.Vector3(Math.cos(a)*rad,bh*.19,Math.sin(a)*rad),new T.Vector3(Math.cos(a)*rad*1.3,.025,Math.sin(a)*rad*1.3),.005,accent);}}
  root.traverse(o=>{o.castShadow=true;o.receiveShadow=true;});return root;
}
export const MODEL_PATHS:Record<string,string>={saturn:'/models/saturn-v.glb',redstone:'/models/mercury-redstone.glb',atlas:'/models/mercury-atlas.glb'};
const cache=new Map<string,Promise<T.Group>>();
export async function loadRocketAsset(r:Rocket):Promise<T.Group|null>{
  const path=MODEL_PATHS[r.id];if(!path)return null;
  if(!cache.has(path))cache.set(path,new GLTFLoader().loadAsync(path).then(g=>{
    const model=g.scene;model.updateMatrixWorld(true);let b=new T.Box3().setFromObject(model),s=b.getSize(new T.Vector3());
    // Source assets use different up axes; normalize the longest axis to Y.
    if(s.z>s.y&&s.z>s.x)model.rotation.x=-Math.PI/2;else if(s.x>s.y)model.rotation.z=Math.PI/2;
    model.updateMatrixWorld(true);b=new T.Box3().setFromObject(model);s=b.getSize(new T.Vector3());
    model.scale.multiplyScalar(r.length/s.y);model.updateMatrixWorld(true);b=new T.Box3().setFromObject(model);
    const center=b.getCenter(new T.Vector3());model.position.sub(new T.Vector3(center.x,b.min.y,center.z));
    const wrapper=new T.Group();wrapper.add(model);wrapper.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=true;o.receiveShadow=true;}});return wrapper;
  }).catch(e=>{cache.delete(path);throw e;}));
  const loaded=(await cache.get(path)!).clone(true);loaded.userData={imported:true,rocket:r};return loaded;
}
export function createPad(large=false){
  const g=new T.Group(),mat=large?materials.black:materials.red;
  cylinder(g,.056,.075,.075,.07,mat);
  for(let i=0;i<3;i++){
    const leg=new T.Group();leg.rotation.y=i*2*Math.PI/3;g.add(leg);
    const shape=new T.Shape();shape.moveTo(.02,.09);shape.lineTo(.34,.023);shape.lineTo(.34,0);shape.lineTo(.24,0);shape.lineTo(.035,.045);shape.closePath();
    mesh(new T.ExtrudeGeometry(shape,{depth:.026,bevelEnabled:true,bevelThickness:.005,bevelSize:.005,bevelSegments:2}),mat,leg,0,0,-.013);
  }
  const plate=cylinder(g,.093,.093,.003,.15,materials.steel);plate.rotation.z=.06;
  cylinder(g,.002,.002,1.0,.63,materials.steel,.043);
  cylinder(g,.011,.011,.012,.13,materials.black,.043);
  if(large)g.scale.setScalar(1.2);
  return g;
}
export function createController(){
  const g=new T.Group();
  const box=mesh(new T.BoxGeometry(.18,.055,.11),materials.yellow,g,0,.04,0);
  const face=mesh(new T.BoxGeometry(.166,.002,.098),materials.black,g,0,.069,0);
  face.userData.label='Electron Beam';box.userData.label='Estes-inspired recreation';
  cylinder(g,.016,.017,.014,.081,materials.red,.045,.015);
  cylinder(g,.007,.007,.007,.074,new T.MeshStandardMaterial({color:'#daef9a',emissive:'#58802b',emissiveIntensity:.5}),-.042,-.02);
  cylinder(g,.008,.008,.009,.076,materials.steel,-.04,.016);
  beam(g,new T.Vector3(-.04,.08,.016),new T.Vector3(-.04,.108,.016),.002,materials.steel);
  mesh(new T.TorusGeometry(.011,.002,6,20),materials.steel,g,-.04,.112,.016).rotation.x=Math.PI/2;
  return g;
}
export function createChute(r:Rocket){
  const g=new T.Group(),radius=r.chute/2;
  const geo=new T.SphereGeometry(radius,48,20,0,Math.PI*2,0,Math.PI*.44);geo.scale(1,.5,1);
  const orange=new T.MeshStandardMaterial({color:'#ff6b25',side:T.DoubleSide,roughness:.8,transparent:true,opacity:.92});
  const white=new T.MeshStandardMaterial({color:'#fff4dd',side:T.DoubleSide,roughness:.8,transparent:true,opacity:.92});
  geo.clearGroups();const idx=geo.index!;for(let i=0;i<idx.count;i+=6){const vertex=idx.getX(i),u=geo.attributes.uv.getX(vertex);geo.addGroup(i,Math.min(6,idx.count-i),Math.floor(u*12)%2);}
  mesh(geo,[orange,white] as unknown as T.Material,g,0,radius*1.5,0);
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2;beam(g,new T.Vector3(0,0,0),new T.Vector3(Math.cos(a)*radius*.98,radius*1.58,Math.sin(a)*radius*.98),.0006,new T.MeshBasicMaterial({color:'#eee4d5'}));}
  return g;
}
export function disposeObject(obj:T.Object3D){obj.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material]){if(m.map)m.map.dispose();m.dispose();}}});}
export async function makeThumbnails(rockets:Rocket[],onImage:(id:string,url:string)=>void){
  const renderer=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});renderer.setSize(180,260);renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
  const scene=new T.Scene();scene.add(new T.HemisphereLight('#eaf5ff','#69707b',2.5));const sun=new T.DirectionalLight('#fff4da',4);sun.position.set(3,5,6);scene.add(sun);
  const cam=new T.PerspectiveCamera(28,180/260,.001,100);
  for(const r of rockets){let obj:T.Group;try{obj=await loadRocketAsset(r)||createRocket(r);}catch{obj=createRocket(r);}scene.add(obj);obj.rotation.z=-.17;obj.rotation.y=.55;
    const h=r.length, dist=h*2.5;cam.position.set(dist*.15,h*.53,dist);cam.lookAt(0,h*.47,0);renderer.render(scene,cam);onImage(r.id,renderer.domElement.toDataURL('image/png'));scene.remove(obj);
  }renderer.dispose();renderer.forceContextLoss();
}
