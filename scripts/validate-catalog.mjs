import fs from 'node:fs';

const mapText = fs.readFileSync('src/lib/course-area-map.ts','utf8');
const vocationalText = fs.readFileSync('src/lib/vocational-data.ts','utf8');
const extraText = fs.readFileSync('src/lib/expanded-course-data.ts','utf8');
const mapEntries = [...mapText.matchAll(/^\s*'([^']+)':\s*'([^']+)'/gm)].map(m=>({course:m[1],area:m[2]}));
const courseNames = new Set([
  ...[...vocationalText.matchAll(/\bc\(\s*'[^']+'\s*,\s*'([^']+)'/g)].map(m=>m[1]),
  ...[...extraText.matchAll(/\bc\(\s*"[^"]+"\s*,\s*"([^"]+)"/g)].map(m=>m[1]),
]);
const errors=[];
if(mapEntries.length!==50) errors.push(`expected 50 course mappings, found ${mapEntries.length}`);
if(new Set(mapEntries.map(x=>x.course)).size!==mapEntries.length) errors.push('duplicate course names in canonical map');
if(new Set(mapEntries.map(x=>x.area)).size!==mapEntries.length) errors.push('duplicate area ids in canonical map');
for(const {course} of mapEntries) if(!courseNames.has(course)) errors.push(`mapped course missing from vocational catalog: ${course}`);
for(const course of courseNames) if(!mapEntries.some(x=>x.course===course)) errors.push(`vocational course missing canonical area mapping: ${course}`);
if(courseNames.size!==50) errors.push(`expected 50 vocational courses, found ${courseNames.size}`);
if(errors.length){console.error('\nCatalog validation failed:');for(const e of errors) console.error(`- ${e}`);process.exit(1)}
console.log(`Catalog validation OK: ${courseNames.size} courses, ${mapEntries.length} canonical mappings.`);
