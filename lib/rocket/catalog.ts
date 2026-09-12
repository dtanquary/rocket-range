export type Rocket = {
  id: string; name: string; family: 'Estes classics' | 'Scale fleet'; subtitle: string;
  length: number; diameter: number; mass: number; chute: number;
  color: string; accent: string; nose: string; fins: number; finSpan: number; finHeight: number;
  noseRatio: number; motors: string[]; recommended: string; drag: number;
  shape?: 'saturn' | 'falcon' | 'redstone' | 'atlas' | 'v2'; source: string;
  model?: string; modelCredit?: string;
};
const estes = 'Estes classics' as const, scale = 'Scale fleet' as const;
export const ROCKETS: Rocket[] = [
  {id:'alpha',name:'Alpha III',family:estes,subtitle:'The first-flight classic',length:.307,diameter:.025,mass:.034,chute:.305,color:'#f4f0de',accent:'#f35a17',nose:'#f35a17',fins:3,finSpan:.043,finHeight:.067,noseRatio:.24,motors:['A8-3','B6-4','C6-5','C6-7'],recommended:'B6-4',drag:.56,source:'https://estesrockets.com/products/alpha-iii-launch-set'},
  {id:'bertha',name:'Big Bertha',family:estes,subtitle:'Slow lift. Big personality.',length:.61,diameter:.042,mass:.071,chute:.457,color:'#f7bf17',accent:'#16191a',nose:'#171a1c',fins:4,finSpan:.078,finHeight:.17,noseRatio:.20,motors:['B6-4','C6-5'],recommended:'C6-5',drag:.64,source:'https://estesrockets.com/products/big-bertha'},
  {id:'baby',name:'Baby Bertha',family:estes,subtitle:'A pocket-sized favorite',length:.325,diameter:.042,mass:.054,chute:.305,color:'#25272a',accent:'#ee4030',nose:'#27282b',fins:4,finSpan:.05,finHeight:.075,noseRatio:.28,motors:['A8-3','B6-4','C6-5'],recommended:'B6-4',drag:.6,source:'https://estesrockets.com/products/baby-bertha'},
  {id:'daddy',name:'Big Daddy',family:estes,subtitle:'Wide body. Powerful liftoff.',length:.483,diameter:.076,mass:.15,chute:.61,color:'#f4d52e',accent:'#202025',nose:'#242328',fins:4,finSpan:.075,finHeight:.135,noseRatio:.40,motors:['C11-3','D12-3','E12-4'],recommended:'D12-3',drag:.56,source:'https://estesrockets.com/products/big-daddy'},
  {id:'max',name:'Der Red Max',family:estes,subtitle:'The unmistakable red legend',length:.419,diameter:.042,mass:.068,chute:.457,color:'#cf2824',accent:'#151719',nose:'#16191b',fins:3,finSpan:.064,finHeight:.13,noseRatio:.30,motors:['B6-4','C6-5'],recommended:'C6-5',drag:.62,source:'https://estesrockets.com/products/der-red-max'},
  {id:'mean',name:'Mean Machine',family:estes,subtitle:'Two meters of attitude',length:2.032,diameter:.042,mass:.241,chute:.61,color:'#111c24',accent:'#eaedec',nose:'#161b22',fins:3,finSpan:.055,finHeight:.15,noseRatio:.067,motors:['D12-3','E12-4','E12-6'],recommended:'E12-4',drag:.62,source:'https://estesrockets.com/products/mean-machine'},
  {id:'patriot',name:'Patriot M-104',family:estes,subtitle:'A field-ready scale classic',length:.533,diameter:.041,mass:.057,chute:.305,color:'#edece0',accent:'#b92727',nose:'#e4b724',fins:4,finSpan:.043,finHeight:.10,noseRatio:.22,motors:['B6-4','C6-5'],recommended:'C6-5',drag:.55,source:'https://estesrockets.com/products/patriot-m-104'},
  {id:'executioner',name:'Executioner',family:estes,subtitle:'A commanding D and E flyer',length:.965,diameter:.066,mass:.235,chute:.61,color:'#d8dadd',accent:'#76439c',nose:'#24252c',fins:3,finSpan:.09,finHeight:.23,noseRatio:.22,motors:['D12-3','E12-4','E12-6'],recommended:'E12-4',drag:.65,source:'https://estesrockets.com/products/executioner'},
  {id:'falcon',name:'Falcon 9',family:scale,subtitle:'SpaceX · miniature tribute',length:.96,diameter:.052,mass:.18,chute:.61,color:'#eeeeeb',accent:'#15191d',nose:'#efeee9',fins:4,finSpan:.027,finHeight:.09,noseRatio:.15,motors:['D12-3','E12-4'],recommended:'E12-4',drag:.5,shape:'falcon',source:'https://www.spacex.com/vehicles/falcon-9/'},
  {id:'saturn',name:'Saturn V',family:scale,subtitle:'Apollo · miniature tribute',length:1.1,diameter:.10,mass:.3,chute:.76,color:'#eeeae1',accent:'#191c20',nose:'#efebe2',fins:4,finSpan:.024,finHeight:.09,noseRatio:.18,motors:['E12-4'],recommended:'E12-4',drag:.6,shape:'saturn',source:'https://science.nasa.gov/3d-resources/'},
  {id:'redstone',name:'Mercury-Redstone',family:scale,subtitle:'Freedom 7 · miniature tribute',length:.72,diameter:.051,mass:.125,chute:.51,color:'#f1eee5',accent:'#181b21',nose:'#21252a',fins:4,finSpan:.055,finHeight:.11,noseRatio:.22,motors:['C11-3','D12-3','E12-4'],recommended:'D12-3',drag:.63,shape:'redstone',source:'https://science.nasa.gov/3d-resources/'},
  {id:'atlas',name:'Mercury-Atlas',family:scale,subtitle:'Friendship 7 · miniature tribute',length:.81,diameter:.079,mass:.19,chute:.61,color:'#aab2b6',accent:'#11171d',nose:'#22272b',fins:3,finSpan:.026,finHeight:.11,noseRatio:.22,motors:['D12-3','E12-4'],recommended:'E12-4',drag:.52,shape:'atlas',source:'https://science.nasa.gov/3d-resources/'},
];
export type Motor = {id:string;diameter:number;length:number;impulse:number;burn:number;delay:number;mass:number;propellant:number;curve:[number,number][]};
function motor(id:string,diameter:number,length:number,impulse:number,burn:number,mass:number,propellant:number,peak:number):Motor {
  const delay=Number(id.split('-')[1]);
  const curve:[number,number][]=[[0,0],[.035,peak],[.15,peak*.8],[.28,peak*.33],[burn-.1,peak*.27],[burn,0]];
  let area=0; for(let i=1;i<curve.length;i++) area+=(curve[i][0]-curve[i-1][0])*(curve[i][1]+curve[i-1][1])/2;
  return {id,diameter,length,impulse,burn,delay,mass,propellant,curve:curve.map(([t,f])=>[t,f*impulse/area])};
}
export const MOTORS:Motor[]=[
  motor('A8-3',18,70,2.3,.73,.0162,.0033,10),motor('B6-4',18,70,4.9,.86,.019,.006,12),
  motor('C6-5',18,70,8.8,1.85,.024,.0108,14),motor('C6-7',18,70,8.8,1.85,.024,.0108,14),
  motor('C11-3',24,70,8.8,.8,.033,.012,22),motor('D12-3',24,70,16.8,1.65,.043,.025,30),
  motor('E12-4',24,95,27.2,2.4,.059,.036,32),motor('E12-6',24,95,27.2,2.4,.059,.036,32),
];
export const getMotor=(id:string)=>MOTORS.find(m=>m.id===id)!;
