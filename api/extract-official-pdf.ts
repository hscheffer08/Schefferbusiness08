import { generateText } from 'ai';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL='https://kmognvgnfisdchzffkgh.supabase.co';
const SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6Imttb2dudmduZmlzZGNoemZma2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MzkxNjksImV4cCI6MjEwMjMxNTE2OX0.JarpsXfgv8PplL3Ryvs6iFfEPiv_rnp2Cx5i1I67fCk';
const supabase=createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const allowedHost=(u:string)=>{try{const h=new URL(u).hostname.toLowerCase();return h==='download.inep.gov.br'||h==='riep.inep.gov.br'||h==='vestibular.cmmg.edu.br'}catch{return false}};
const parse=(raw:string)=>{const s=raw.trim().replace(/^```json\s*/i,'').replace(/^```\s*/,'').replace(/```$/,'').trim();const a=s.indexOf('{'),b=s.lastIndexOf('}');return JSON.parse(a>=0&&b>a?s.slice(a,b+1):s)};

export default async function handler(req:any,res:any){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return res.status(405).json({error:'POST only'});
  try{
    const {pdfUrl,examId,year,start,end}=req.body||{};
    if(typeof pdfUrl!=='string'||!allowedHost(pdfUrl))return res.status(400).json({error:'PDF host not allowed'});
    const y=Number(year),s=Number(start),e=Number(end);
    if(!Number.isInteger(y)||!Number.isInteger(s)||!Number.isInteger(e)||s<1||e<s||e-s>19)return res.status(400).json({error:'Invalid range; max 20 questions'});
    const exam=String(examId||'').toLowerCase();
    const vestibular=exam==='enem'?'ENEM':exam==='cmmg'?'Vestibular Ciências Médicas-MG':exam==='fuvest'?'FUVEST':'';
    if(!vestibular)return res.status(400).json({error:'Unsupported exam'});
    const {data:keys}=await supabase.from('official_vestibular_question_bank')
      .select('question_number,correct_option,area,subject,skill_name,source_pdf_url,answer_key_url,source_url')
      .eq('vestibular',vestibular).eq('year',y).gte('question_number',s).lte('question_number',e).limit(100);
    const keyMap:Record<string,any>={};
    for(const k of keys||[]){const n=String(k.question_number);if(!keyMap[n]||k.source_pdf_url===pdfUrl)keyMap[n]=k;}
    const prompt=`Extraia QUESTÕES OFICIAIS de um PDF de vestibular. A fonte é a própria prova oficial.\n\nPROVA: ${exam.toUpperCase()} ${y}.\nINTERVALO: questões ${s} a ${e}.\nGABARITOS/METADADOS JÁ INDEXADOS: ${JSON.stringify(keyMap)}\n\nREGRAS OBRIGATÓRIAS:\n1. Transcreva fielmente o enunciado/comando e as alternativas da questão, sem criar, resumir, adaptar ou corrigir o texto. Remova apenas cabeçalho/rodapé repetitivo e referências bibliográficas que não façam parte do que o candidato precisa ler.\n2. Se houver texto-base compartilhado necessário para responder, inclua-o no campo prompt da questão correspondente.\n3. Se a questão depender de figura, gráfico, tabela, fórmula visual, charge ou imagem que NÃO possa ser representada integralmente em texto de modo fiel, marque self_contained=false e explique em visual_dependency. NÃO invente descrição substituta.\n4. ENEM normalmente tem A-E; CMMG pode ter A-D. Não invente alternativa inexistente.\n5. correct_option deve vir SOMENTE dos metadados fornecidos acima. Se não houver, null.\n6. area deve usar exatamente uma destas categorias: Linguagens, Humanas, Natureza, Matemática. Para CMMG, Português/Inglês=>Linguagens; Biologia/Física/Química=>Natureza.\n7. subject deve ser a matéria específica. skill_name deve ser uma habilidade curta e objetiva inferida apenas para organização (não altera a origem oficial).\n8. Retorne todas as questões do intervalo encontradas, inclusive as não autocontidas.\n9. Não inclua explicação da resposta.\n\nRetorne APENAS JSON válido neste formato: {"questions":[{"question_number":1,"area":"Linguagens","subject":"Português","skill_name":"Interpretação textual","prompt":"texto completo","option_a":"...","option_b":"...","option_c":"...","option_d":"...","option_e":null,"correct_option":"C","self_contained":true,"visual_dependency":null}]}`;
    const out=await generateText({
      model:'openai/gpt-5.5-fast',
      messages:[{role:'user',content:[{type:'text',text:prompt},{type:'file',mediaType:'application/pdf',data:pdfUrl}]}],
      maxOutputTokens:18000,
      abortSignal:AbortSignal.timeout(110000),
      providerOptions:{gateway:{models:['google/gemini-3.6-flash'],tags:['feature:official-question-extractor',`exam:${exam}`,`year:${y}`]}}
    } as any);
    const parsed=parse(String(out.text||''));
    const qs=Array.isArray(parsed.questions)?parsed.questions:[];
    const clean=qs.filter((q:any)=>Number(q.question_number)>=s&&Number(q.question_number)<=e).map((q:any)=>({
      question_number:Number(q.question_number),area:String(q.area||''),subject:String(q.subject||''),skill_name:String(q.skill_name||''),prompt:String(q.prompt||''),
      option_a:q.option_a==null?null:String(q.option_a),option_b:q.option_b==null?null:String(q.option_b),option_c:q.option_c==null?null:String(q.option_c),option_d:q.option_d==null?null:String(q.option_d),option_e:q.option_e==null?null:String(q.option_e),
      correct_option:keyMap[String(q.question_number)]?.correct_option||null,self_contained:Boolean(q.self_contained),visual_dependency:q.visual_dependency==null?null:String(q.visual_dependency),
      source_pdf_url:pdfUrl,answer_key_url:keyMap[String(q.question_number)]?.answer_key_url||null
    }));
    return res.status(200).json({exam,year:y,start:s,end:e,count:clean.length,questions:clean});
  }catch(err:any){console.error(err);return res.status(500).json({error:err?.message||'extract failed'})}
}
