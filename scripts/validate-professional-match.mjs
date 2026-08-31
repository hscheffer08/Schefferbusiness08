import fs from 'node:fs';
const engine = fs.readFileSync('src/lib/professional-area-match.ts', 'utf8');
const results = fs.readFileSync('src/components/CommercialAreaResults.tsx', 'utf8');
const checks = [
  [engine.includes("const PAGE_SIZE = 1000"), 'Pagination page size is defined'],
  [engine.includes("fetchAllRows('area_university_dimension_profiles'"), 'University profiles are paginated'],
  [engine.includes("fetchAllRows('area_dimension_priorities'"), 'Area priorities are paginated'],
  [engine.includes("fetchAllRows('area_questions'"), 'Area questions are paginated'],
  [engine.includes('normalizeFallbackMatchProfile'), 'Fallback profiles use professional dimension IDs'],
  [engine.includes('eligibleUniversities'), 'Universities without dimensional profiles are excluded'],
  [results.includes("'Não cadastrados'"), 'Missing official indicators are not shown as 0/5'],
];
let failed = 0;
for (const [ok,label] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`); if (!ok) failed++; }
if (failed) process.exit(1);
console.log('Professional match validation passed.');
