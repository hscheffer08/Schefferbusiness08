import fs from 'node:fs';

const path='src/components/OfficialQuestionWorkspaceV3.tsx';
let src=fs.readFileSync(path,'utf8');
function patch(from,to,label){
  if(src.includes(to))return;
  if(!src.includes(from))throw new Error(`Active visual patch failed: ${label}`);
  src=src.replace(from,to);
}

patch(
  `option_e:string|null};\ntype Practice=`,
  `option_e:string|null;image_url:string|null;image_alt:string|null;source_page:number|null};\ntype Practice=`,
  'OfficialRef visual fields',
);

patch(
  `.from('official_vestibular_question_bank')`,
  `.from('official_vestibular_question_bank_v2')`,
  'visual metadata view',
);

patch(
  `.select('question_id,series_id,vestibular,year,question_number,area,subject,skill_name,correct_option,source_pdf_url,answer_key_url,source_url,day,booklet_code,color,prompt_text,option_a,option_b,option_c,option_d,option_e')`,
  `.select('question_id,series_id,vestibular,year,question_number,area,subject,skill_name,correct_option,source_pdf_url,answer_key_url,source_url,day,booklet_code,color,prompt_text,option_a,option_b,option_c,option_d,option_e,image_url,image_alt,source_page')`,
  'visual metadata select',
);

patch(
  `const key=\`conectae:official-v8:\${q.question_id}\`;`,
  `const key=\`conectae:official-v13:\${q.question_id}\`;`,
  'visual cache version',
);

patch(
  `      const stored={found:true,prompt:q.prompt_text||'',option_a:q.option_a,option_b:q.option_b,option_c:q.option_c,option_d:q.option_d,option_e:q.option_e,correct_option:q.correct_option,needs_source_image:false,image_note:null,confidence:1};if(isUsableOfficialQuestion(stored))value=stored;`,
  `      const visualCue=/\\b(figura|imagem|gr[aá]fico|tabela|mapa|esquema|fotografia|charge|tirinha|diagrama|cartum|quadrinho|ilustra[cç][aã]o)\\b/i.test([q.prompt_text,q.option_a,q.option_b,q.option_c,q.option_d,q.option_e].filter(Boolean).join(' '));\n      const stored:Extracted={found:true,prompt:q.prompt_text||'',option_a:q.option_a,option_b:q.option_b,option_c:q.option_c,option_d:q.option_d,option_e:q.option_e,correct_option:q.correct_option,needs_source_image:Boolean(q.image_url||q.image_alt||visualCue),image_note:q.image_alt||(visualCue?'Esta questão contém elemento visual da prova oficial.':null),confidence:1,images:q.image_url?[q.image_url]:undefined,source_page:undefined};if(isUsableOfficialQuestion(stored))value=stored;`,
  'stored visual payload',
);

patch(
  `      if(!value)throw new Error('Não consegui carregar esta questão completa agora. Tente novamente em alguns segundos.');\n      if(value.needs_source_image&&!value.images?.length&&value.source_page&&q.source_pdf_url&&!/^https:\\/\\/download\\.inep\\.gov\\.br\\//i.test(q.source_pdf_url)){try{const image=await renderOfficialPdfPage(q.source_pdf_url,value.source_page);if(image)value={...value,images:[image]}}catch(e){console.warn('official source page rendering failed',e)}}`,
  `      if(!value)throw new Error('Não consegui carregar esta questão completa agora. Tente novamente em alguns segundos.');\n      // Mostra o texto imediatamente; o gráfico/foto é carregado sem bloquear a questão.\n      setExtracted(value);setExtracting(false);\n      if(value.needs_source_image&&!value.images?.length&&!value.source_page&&q.source_pdf_url){\n        try{const localMeta=await extractOfficialQuestion(q.source_pdf_url,q.question_number);if(localMeta?.source_page)value={...value,source_page:localMeta.source_page,image_note:value.image_note||localMeta.image_note||null}}catch(e){console.warn('official visual page lookup failed',e)}\n      }\n      if(value.needs_source_image&&!value.images?.length&&!value.source_page&&q.source_pdf_url){\n        try{const remoteMeta=await extractOfficialQuestionRemotely(q.source_pdf_url,q.question_number,q.vestibular,q.year);if(remoteMeta?.source_page)value={...value,source_page:remoteMeta.source_page,image_note:value.image_note||remoteMeta.image_note||null}}catch(e){console.warn('official remote visual page lookup failed',e)}\n      }\n      // Último fallback: usa a página previamente materializada somente se os localizadores atuais falharem.\n      if(value.needs_source_image&&!value.images?.length&&!value.source_page&&q.source_page)value={...value,source_page:q.source_page};\n      if(value.needs_source_image&&!value.images?.length&&value.source_page&&q.source_pdf_url){try{const image=await renderOfficialPdfPage(q.source_pdf_url,value.source_page);if(image)value={...value,images:[image]}}catch(e){console.warn('official source page rendering failed',e)}}`,
  'visual hydration',
);

patch(
  `className="mt-4 max-h-[560px] w-full rounded-xl border border-[#173765] bg-white object-contain"`,
  `className="mt-4 w-full rounded-xl border border-[#173765] bg-white object-contain"`,
  'full-width visual',
);

patch(
  `#page=\${Math.max(1,(extracted.source_page||1)-1)}`,
  `#page=\${Math.max(1,extracted.source_page||1)}`,
  'pdf page fragment',
);

patch(
  `activeOfficial?.source_pdf_url&&extracted?.needs_source_image&&!extracted.images?.length&&<iframe`,
  `activeOfficial?.source_pdf_url&&extracted?.needs_source_image&&!extracted.images?.length&&Boolean(extracted.source_page)&&<iframe`,
  'avoid wrong first-page fallback',
);

fs.writeFileSync(path,src);
console.log('Active official question visual patch applied.');
