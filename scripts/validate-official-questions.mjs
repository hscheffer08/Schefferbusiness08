import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalizeEnemQuestion} from '../api/enem-official-questions.ts';
import {isQuestionMarker,splitOptions} from '../src/lib/official-pdf-client.ts';
import {ENEM_INTERACTIVE_TOTAL,isEnemInteractiveQuestion} from '../src/lib/enem-official-availability.ts';

const fixture={
  index:24,year:2023,language:null,
  context:'**TEXTO**\n\n![](https://enem.dev/2023/questions/24/visual.png)\nContexto real.',
  files:['https://enem.dev/2023/questions/24/visual.png'],
  alternativesIntroduction:'Assinale a alternativa correta.',correctAlternative:'C',
  alternatives:['A','B','C','D','E'].map(letter=>({letter,text:`Alternativa ${letter}`,isCorrect:letter==='C'})),
};
const normalized=normalizeEnemQuestion(fixture);
assert.equal(normalized.found,true);
assert.equal(normalized.correct_option,'C');
assert.equal(normalized.option_e,'Alternativa E');
assert.deepEqual(normalized.images,['https://enem.dev/2023/questions/24/visual.png']);
assert.equal(normalized.prompt.includes('![]'),false);
assert.equal(ENEM_INTERACTIVE_TOTAL,1166);
assert.equal(isEnemInteractiveQuestion(2023,24),true);
assert.equal(isEnemInteractiveQuestion(2023,34),false);
assert.equal(isEnemInteractiveQuestion(2024,1),true);
assert.equal(isEnemInteractiveQuestion(2025,180),true);

assert.equal(isQuestionMarker('01. Considerando o texto anterior, responda.',1),true);
assert.equal(isQuestionMarker('QUESTÃO 135',135),true);
assert.equal(isQuestionMarker('1',1),false);
assert.equal(isQuestionMarker('10 palavras no parágrafo',10),false);
const cmmg=splitOptions(['Assinale a alternativa CORRETA.','A) primeira','B) segunda','C) terceira','D) quarta']);
assert.equal(cmmg?.prompt,'Assinale a alternativa CORRETA.');
assert.equal(cmmg?.opts.D,'quarta');

const workspace=await readFile(new URL('../src/components/OfficialQuestionWorkspaceV3.tsx',import.meta.url),'utf8');
const publicPage=await readFile(new URL('../src/components/OfficialVestibularBankPage.tsx',import.meta.url),'utf8');
const pdfClient=await readFile(new URL('../src/lib/official-pdf-client.ts',import.meta.url),'utf8');
assert.match(workspace,/\.range\(from,from\+499\)/);
assert.match(workspace,/isEnemInteractiveQuestion\(q\.year,q\.question_number\)/);
assert.match(publicPage,/OfficialQuestionWorkspaceV3/);
assert.doesNotMatch(publicPage,/OfficialVestibularBank\/>/);
assert.match(workspace,/extracted\?\.correct_option/);
assert.match(workspace,/extractOfficialQuestionRemotely/);
assert.match(workspace,/extractOfficialAnswerRemotely/);
assert.doesNotMatch(workspace,/filter\(x=>x\.area===q\.area\)\.length\)<60/);
assert.ok(pdfClient.indexOf('/api/proxy-official-pdf')<pdfClient.indexOf('SUPABASE_PDF_PROXY}?url='));
assert.match(pdfClient,/start=\$\{offset\}&end=\$\{end\}/);

console.log('Official question validation passed: ENEM 2019-2025, CMMG numbering/options, subject filters, full pagination, answer hiding and local proxy priority.');
