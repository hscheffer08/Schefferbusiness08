import fs from 'node:fs';

const path='src/components/OfficialQuestionWorkspaceV3.tsx';
let src=fs.readFileSync(path,'utf8');
if(src.includes('conectae:official-v16:')){
  console.log('Active official question visuals are current.');
  process.exit(0);
}
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

// V14: a imagem oficial é parte obrigatória da questão, não uma descrição opcional.
patch(
  `const key=\`conectae:official-v13:\${q.question_id}\`;`,
  `const key=\`conectae:official-v14:\${q.question_id}\`;`,
  'visual cache v14',
);

patch(
  `try{const cached=JSON.parse(sessionStorage.getItem(key)||'null');if(isUsableOfficialQuestion(cached)){setExtracted(cached);return}}catch{}`,
  `try{const cached=JSON.parse(sessionStorage.getItem(key)||'null');if(isUsableOfficialQuestion(cached)){setExtracted(cached);setExtracting(false);return}}catch{}`,
  'cached question loading state',
);

patch(
  `images:q.image_url?[q.image_url]:undefined,source_page:undefined};if(isUsableOfficialQuestion(stored))value=stored;`,
  `images:q.image_url?[q.image_url]:undefined,source_page:q.source_page??undefined};if(isUsableOfficialQuestion(stored))value=stored;`,
  'use known source page immediately',
);

patch(
  `      // Mostra o texto imediatamente; o gráfico/foto é carregado sem bloquear a questão.\n      setExtracted(value);setExtracting(false);\n      if(value.needs_source_image&&!value.images?.length&&!value.source_page&&q.source_pdf_url){\n        try{const localMeta=await extractOfficialQuestion(q.source_pdf_url,q.question_number);if(localMeta?.source_page)value={...value,source_page:localMeta.source_page,image_note:value.image_note||localMeta.image_note||null}}catch(e){console.warn('official visual page lookup failed',e)}\n      }`,
  `      // Questões visuais só aparecem completas: primeiro localizamos a página original.\n      if(value.needs_source_image&&!value.images?.length&&!value.source_page&&q.source_pdf_url){\n        try{\n          const response=await fetch(\`/api/locate-official-question-page?sourceUrl=\${encodeURIComponent(q.source_pdf_url)}&questionNumber=\${q.question_number}\`);\n          const data=await response.json().catch(()=>({}));\n          const sourcePage=Number(data?.source_page);\n          if(response.ok&&Number.isInteger(sourcePage)&&sourcePage>0)value={...value,source_page:sourcePage};\n        }catch(e){console.warn('official deterministic page locator failed',e)}\n      }\n      // Se a página já é conhecida, o texto abre na hora e o screenshot é hidratado em seguida.\n      setExtracted(value);setExtracting(false);\n      if(value.needs_source_image&&!value.images?.length&&!value.source_page&&q.source_pdf_url){\n        try{const localMeta=await extractOfficialQuestion(q.source_pdf_url,q.question_number);if(localMeta?.source_page)value={...value,source_page:localMeta.source_page,image_note:value.image_note||localMeta.image_note||null}}catch(e){console.warn('official visual page lookup failed',e)}\n      }`,
  'deterministic visual page locator',
);

patch(
  `setExtracted(value);try{sessionStorage.setItem(key,JSON.stringify(value))}catch{}`,
  `setExtracted(value);if(!value.needs_source_image||value.images?.length){try{sessionStorage.setItem(key,JSON.stringify(value))}catch{}}`,
  'do not cache incomplete visual questions',
);

patch(
  `activeOfficial&&extracted?.needs_source_image&&<div className="mt-3 rounded-xl border border-amber-300/25 bg-amber-300/[.06] p-3 text-xs text-[#9fb5d4]">`,
  `activeOfficial&&extracted?.needs_source_image&&!extracted.images?.length&&!extracted.source_page&&<div className="mt-3 rounded-xl border border-amber-300/25 bg-amber-300/[.06] p-3 text-xs text-[#9fb5d4]">`,
  'hide description when original visual is available',
);

// V15: ENEM usa as mídias originais já recortadas; evita depender do PDF do INEP no navegador embutido do Instagram.
patch(
  `const key=\`conectae:official-v14:\${q.question_id}\`;`,
  `const key=\`conectae:official-v15:\${q.question_id}\`;`,
  'visual cache v15',
);

patch(
  `      // Questões visuais só aparecem completas: primeiro localizamos a página original.\n      if(value.needs_source_image&&!value.images?.length&&!value.source_page&&q.source_pdf_url){`,
  `      // No ENEM, buscamos a fotografia/figura recortada e também imagens das alternativas.\n      if(q.series_id==='enem'&&value.needs_source_image&&!value.images?.length){\n        try{\n          const mediaResponse=await fetch(\`/api/enem-question-visuals?year=\${q.year}&questionNumber=\${q.question_number}&prompt=\${encodeURIComponent(value.prompt||q.prompt_text||'')}\`);\n          const media=await mediaResponse.json().catch(()=>({}));\n          const mediaImages=Array.isArray(media?.images)?media.images.filter((url:any)=>typeof url==='string'&&url.startsWith('https://')):[];\n          const optionImages=media?.option_images&&typeof media.option_images==='object'?media.option_images:{};\n          if(mediaResponse.ok&&(mediaImages.length||Object.keys(optionImages).length)){value={...value,images:mediaImages.length?mediaImages:value.images,option_images:optionImages};}\n        }catch(e){console.warn('ENEM original media lookup failed',e)}\n      }\n      // Para as demais provas, ou se o recorte não existir, localizamos a página original.\n      if(value.needs_source_image&&!value.images?.length&&!value.source_page&&q.source_pdf_url){`,
  'ENEM original visual media',
);

patch(
  `activeOfficial&&extracted?.needs_source_image&&!extracted.images?.length&&!extracted.source_page&&<div className="mt-3 rounded-xl border border-amber-300/25 bg-amber-300/[.06] p-3 text-xs text-[#9fb5d4]">`,
  `activeOfficial&&extracted?.needs_source_image&&!extracted.images?.length&&!Object.keys(extracted.option_images||{}).length&&!extracted.source_page&&<div className="mt-3 rounded-xl border border-amber-300/25 bg-amber-300/[.06] p-3 text-xs text-[#9fb5d4]">`,
  'description only without visual media',
);

patch(
  `activeOfficial?.source_pdf_url&&extracted?.needs_source_image&&!extracted.images?.length&&Boolean(extracted.source_page)&&<iframe`,
  `activeOfficial?.source_pdf_url&&extracted?.needs_source_image&&!extracted.images?.length&&!Object.keys(extracted.option_images||{}).length&&Boolean(extracted.source_page)&&<iframe`,
  'avoid PDF when cropped option media exists',
);

fs.writeFileSync(path,src);

// Bundle PDF.js with the app. The worker URL is loaded only in browsers, so Node validators keep working.
const pdfPath='src/lib/official-pdf-client.ts';
let pdfSrc=fs.readFileSync(pdfPath,'utf8');
function patchPdf(from,to,label){
  if(pdfSrc.includes(to))return;
  if(!pdfSrc.includes(from))throw new Error(`PDF visual patch failed: ${label}`);
  pdfSrc=pdfSrc.replace(from,to);
}

patchPdf(
  `const PDFJS_URL='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs';\nconst PDFJS_WORKER='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';`,
  `// PDF.js é empacotado localmente para funcionar também em navegadores embutidos.`,
  'remove remote PDF.js CDN',
);

patchPdf(
  `function remoteImport(url:string){\n  const importer=new Function('u','return import(u)') as (u:string)=>Promise<any>;\n  return importer(url);\n}\n\nasync function pdfjs(){\n  if(!pdfjsPromise){\n    pdfjsPromise=remoteImport(PDFJS_URL).then((mod:any)=>{mod.GlobalWorkerOptions.workerSrc=PDFJS_WORKER;return mod;});\n  }\n  return pdfjsPromise;\n}`,
  `async function pdfjs(){\n  if(!pdfjsPromise){\n    pdfjsPromise=(async()=>{\n      const mod:any=await import('pdfjs-dist/build/pdf.mjs');\n      if(typeof window!=='undefined'){\n        const worker:any=await import('pdfjs-dist/build/pdf.worker.min.mjs?url');\n        mod.GlobalWorkerOptions.workerSrc=worker.default;\n      }\n      return mod;\n    })();\n  }\n  return pdfjsPromise;\n}`,
  'bundle PDF.js runtime',
);

fs.writeFileSync(pdfPath,pdfSrc);
console.log('Active official question visual patch applied.');
