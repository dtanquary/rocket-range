/** Run from web/: npx tsx ../ios/Tools/export-web-data.ts [--check] */
import { ROCKETS, MOTORS } from '../../web/lib/rocket/catalog';
import { predict } from '../../web/lib/rocket/physics';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const out = fileURLToPath(new URL('../Assets/RocketRange/Resources/Data/', import.meta.url));
mkdirSync(out, {recursive:true});
const conditions = [
  {wind:0, angle:0, heading:0, windDirection:270, gusts:0, rodLength:1, ballast:0},
  {wind:6, angle:10, heading:0, windDirection:270, gusts:1.5, rodLength:1.2, ballast:15},
];
const fixtures = ROCKETS.flatMap(rocket => rocket.motors.flatMap(id => conditions.map(conditions => {
  const motor = MOTORS.find(m => m.id === id)!;
  const f = predict(rocket, motor, conditions);
  return {rocket:rocket.id, motor:id, conditions, t:f.t, apogee:f.apogee, x:f.x, z:f.z,
    maxSpeed:f.maxSpeed, impactSpeed:f.impactSpeed, outcome:f.outcome,
    deployedAt:f.deployedAt ?? -1, rodExitTime:f.rodExitTime ?? -1};
})));
for (const [name, data] of Object.entries({
  catalog: {rockets:ROCKETS, motors:MOTORS.map(m=>({...m,curve:m.curve.map(([time,force])=>({time,force}))}))},
  'flight-reference': {fixtures},
})) {
  const content=JSON.stringify(data,null,2)+'\n';
  const path=out+name+'.json';
  if(process.argv.includes('--check')) {
    if(readFileSync(path,'utf8')!==content) throw new Error(name+' has drifted; regenerate native data.');
  } else writeFileSync(path,content);
}
console.log(`Native catalog: ${ROCKETS.length} rockets, ${MOTORS.length} motors; ${fixtures.length} browser reference flights.`);
