import fs from 'node:fs';

function patchFile(path, patches) {
  let src = fs.readFileSync(path, 'utf8');
  for (const { from, to, label } of patches) {
    if (src.includes(to)) continue;
    if (!src.includes(from)) {
      throw new Error(`Visual patch failed (${label}) in ${path}`);
    }
    src = src.replace(from, to);
  }
  fs.writeFileSync(path, src);
}

patchFile('src/components/OfficialQuestionWorkspaceV5.tsx', [
  {
    label: 'official visual fields',
    from: `  option_e: string | null;\n};\ntype P = {`,
    to: `  option_e: string | null;\n  image_url: string | null;\n  image_alt: string | null;\n  source_page: number | null;\n};\ntype P = {`,
  },
  {
    label: 'visual metadata view',
    from: `.from("official_vestibular_question_bank")`,
    to: `.from("official_vestibular_question_bank_v2")`,
  },
  {
    label: 'visual metadata select',
    from: `"question_id,series_id,year,question_number,area,subject,skill_name,correct_option,source_pdf_url,answer_key_url,prompt_text,option_a,option_b,option_c,option_d,option_e",`,
    to: `"question_id,series_id,year,question_number,area,subject,skill_name,correct_option,source_pdf_url,answer_key_url,prompt_text,option_a,option_b,option_c,option_d,option_e,image_url,image_alt,source_page",`,
  },
  {
    label: 'visual cache version',
    from: `const key = \`conectae:official-v8:\${q.question_id}\`;`,
    to: `const key = \`conectae:official-v10:\${q.question_id}\`;`,
  },
  {
    label: 'stored visual payload',
    from: `      const stored = {\n        found: true,\n        prompt: q.prompt_text || "",\n        option_a: q.option_a,\n        option_b: q.option_b,\n        option_c: q.option_c,\n        option_d: q.option_d,\n        option_e: q.option_e,\n        correct_option: q.correct_option,\n        needs_source_image: false,\n        image_note: null,\n        confidence: 1,\n      };`,
    to: `      const visualCue = /\\b(figura|imagem|gr[aá]fico|tabela|mapa|esquema|fotografia|charge|tirinha|diagrama|cartum|quadrinho|ilustra[cç][aã]o)\\b/i.test(\n        [q.prompt_text, q.option_a, q.option_b, q.option_c, q.option_d, q.option_e]\n          .filter(Boolean)\n          .join(" "),\n      );\n      const stored = {\n        found: true,\n        prompt: q.prompt_text || "",\n        option_a: q.option_a,\n        option_b: q.option_b,\n        option_c: q.option_c,\n        option_d: q.option_d,\n        option_e: q.option_e,\n        correct_option: q.correct_option,\n        needs_source_image: Boolean(q.image_url || q.image_alt || q.source_page || visualCue),\n        image_note:\n          q.image_alt ||\n          (visualCue ? "Esta questão contém elemento visual da prova oficial." : null),\n        confidence: 1,\n        images: q.image_url ? [q.image_url] : undefined,\n        source_page: q.source_page || undefined,\n      };`,
  },
  {
    label: 'instant text before visual hydration',
    from: `      if (!v)\n        throw new Error(\n          "Não consegui carregar esta questão completa agora. Tente novamente em alguns segundos.",\n        );\n      if (\n        v.needs_source_image &&`,
    to: `      if (!v)\n        throw new Error(\n          "Não consegui carregar esta questão completa agora. Tente novamente em alguns segundos.",\n        );\n\n      // O texto abre imediatamente. O visual é hidratado em seguida, sem travar o modal.\n      setExt(v);\n      setExtracting(false);\n\n      if (\n        v.needs_source_image &&\n        !v.images?.length &&\n        !v.source_page &&\n        q.source_pdf_url\n      ) {\n        try {\n          const localMeta = await extractOfficialQuestion(\n            q.source_pdf_url,\n            q.question_number,\n          );\n          if (localMeta?.source_page) {\n            v = {\n              ...v,\n              source_page: localMeta.source_page,\n              image_note: v.image_note || localMeta.image_note || null,\n            };\n          }\n        } catch (e) {\n          console.warn("official visual page lookup failed", e);\n        }\n      }\n      if (\n        v.needs_source_image &&\n        !v.images?.length &&\n        !v.source_page &&\n        q.source_pdf_url\n      ) {\n        try {\n          const remoteMeta = await extractOfficialQuestionRemotely(\n            q.source_pdf_url,\n            q.question_number,\n            cfg.label,\n            q.year,\n          );\n          if (remoteMeta?.source_page) {\n            v = {\n              ...v,\n              source_page: remoteMeta.source_page,\n              image_note: v.image_note || remoteMeta.image_note || null,\n            };\n          }\n        } catch (e) {\n          console.warn("official remote visual page lookup failed", e);\n        }\n      }\n\n      if (\n        v.needs_source_image &&`,
  },
  {
    label: 'render INEP pages too',
    from: `        v.source_page &&\n        q.source_pdf_url &&\n        !/download\\.inep\\.gov\\.br/i.test(q.source_pdf_url)\n      ) {`,
    to: `        v.source_page &&\n        q.source_pdf_url\n      ) {`,
  },
  {
    label: 'better visual note',
    from: `                      {ext.image_note ||\n                        "Confira também o elemento visual na prova oficial."}`,
    to: `                      {ext.image_note ||\n                        "Gráfico, foto, mapa, tabela ou outro elemento visual da página oficial exibido acima."}`,
  },
]);

patchFile('src/lib/official-pdf-client.ts', [
  {
    label: 'pdf document cache declaration',
    from: `let pdfjsPromise:Promise<any>|null=null;`,
    to: `let pdfjsPromise:Promise<any>|null=null;\nconst pdfDocumentCache=new Map<string,Promise<any>>();`,
  },
  {
    label: 'pdf document cache',
    from: `async function loadPdf(sourceUrl:string){\n  const lib=await pdfjs();\n  const data=await fetchPdfBytes(sourceUrl);\n  return lib.getDocument({data:new Uint8Array(data),useWorkerFetch:true,isEvalSupported:false}).promise;\n}`,
    to: `async function loadPdf(sourceUrl:string){\n  let cached=pdfDocumentCache.get(sourceUrl);\n  if(cached)return cached;\n  cached=(async()=>{\n    const lib=await pdfjs();\n    const data=await fetchPdfBytes(sourceUrl);\n    return lib.getDocument({data:new Uint8Array(data),useWorkerFetch:true,isEvalSupported:false}).promise;\n  })();\n  pdfDocumentCache.set(sourceUrl,cached);\n  try{return await cached}catch(error){pdfDocumentCache.delete(sourceUrl);throw error}\n}`,
  },
  {
    label: 'higher visual render quality',
    from: `  const viewport=page.getViewport({scale:1.5});`,
    to: `  const viewport=page.getViewport({scale:1.75});`,
  },
]);

console.log('Official question visual patch applied.');
