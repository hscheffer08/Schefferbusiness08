import type { ExamId, ExamMetric, ExamModel } from '@/lib/exam-models';

export type RoadmapQuestion = { id:number; exam_id:string; area:string; skill_name:string; prompt:string; difficulty:number };
export type RoadmapPriority = { metric: ExamMetric; current:number; goal:number; missing:number; score:number };

export type ExamMilestone = { label:string; date:string; note:string };
export type RoadmapWeek = {
  week:number;
  start:string;
  end:string;
  phase:string;
  focusKey:string;
  focusLabel:string;
  topic:string;
  target:string;
  hours:number;
  questionTarget:number;
  questionIds:number[];
  videoTitle:string;
  videoChannel:string;
  videoUrl:string;
  checkpoint:string;
};

const TZ = 'T12:00:00-03:00';
const day = 86400000;
const norm = (s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const date = (iso:string)=>new Date(`${iso}${TZ}`);
const isoDate = (d:Date)=>d.toISOString().slice(0,10);
const fmt = (iso:string)=>new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short'}).format(date(iso));

export function getMilestones(examId:ExamId, course:string): ExamMilestone[] {
  if(examId==='insper') return [{label:'Vestibular Insper 2027.1',date:'2026-10-11',note:'60 objetivas + redação'}];
  if(examId==='cmmg') {
    if(course==='Medicina') return [{label:'CMMG Medicina 2027.1',date:'2026-10-18',note:'prova presencial'}];
    return [{label:`CMMG ${course} 2027.1`,date:'2026-10-17',note:'40 objetivas + redação'}];
  }
  if(examId==='fuvest') return [
    {label:'FUVEST 1ª fase',date:'2026-11-01',note:'80 questões'},
    {label:'FUVEST 2ª fase — dia 1',date:'2026-12-06',note:'Português + redação'},
    {label:'FUVEST 2ª fase — dia 2',date:'2026-12-07',note:'disciplinas específicas da carreira'},
  ];
  if(examId==='enem') return [
    {label:'ENEM — 1º dia',date:'2026-11-08',note:'Linguagens + Humanas + Redação'},
    {label:'ENEM — 2º dia',date:'2026-11-15',note:'Natureza + Matemática'},
  ];
  return [
    {label:'PREP — prazo final',date:'2026-10-16',note:'vídeo + portfólio + documentação'},
    {label:'Link Sprint',date:'2026-10-23',note:'20–23/10: Matemática + Business Case'},
    {label:'Entrevistas — fim da janela',date:'2026-11-07',note:'28–30/10 e 03–07/11'},
  ];
}

const topicPools:Record<string,string[]> = {
  'linguagens':['interpretação e inferência','funções da linguagem e gêneros textuais','coesão, coerência e argumentação','literatura e leitura de texto'],
  'lingua portuguesa':['interpretação, sintaxe e efeitos de sentido','coesão, regência e concordância','gêneros textuais e argumentação'],
  'portugues':['interpretação, sintaxe e efeitos de sentido','coesão, regência e concordância','literatura e análise textual'],
  'literatura':['obra obrigatória e interpretação literária','escolas literárias e recursos de linguagem','narrador, personagens e construção de sentido'],
  'ingles':['leitura instrumental e inferência','vocabulário em contexto e cognatos','interpretação de textos em inglês'],
  'humanas':['Brasil República e cidadania','geopolítica e globalização','filosofia, sociologia e leitura de fontes','território, população e economia'],
  'conhecimentos gerais':['História e cidadania','Geografia e atualidades','Filosofia e Sociologia'],
  'historia':['Brasil República, cidadania e movimentos sociais','História Moderna e Contemporânea','interpretação de fontes históricas'],
  'geografia':['geopolítica e globalização','urbanização, população e território','clima, ambiente e economia'],
  'filosofia':['ética, política e teoria do conhecimento','filosofia moderna e contemporânea'],
  'sociologia':['cultura, desigualdade e cidadania','trabalho, poder e movimentos sociais'],
  'natureza':['ecologia e ciclos biogeoquímicos','mecânica, energia e eletricidade','estequiometria, soluções e química orgânica','genética, fisiologia e evolução'],
  'biologia':['genética e biologia molecular','ecologia e evolução','fisiologia humana','citologia e metabolismo'],
  'fisica':['mecânica e dinâmica','energia, trabalho e potência','eletricidade e circuitos','ondas, óptica e termologia'],
  'quimica':['estequiometria e soluções','química orgânica e funções','equilíbrio, pH e eletroquímica','ligações e propriedades da matéria'],
  'matematica':['funções e gráficos','geometria plana e espacial','probabilidade e combinatória','razões, porcentagem e matemática financeira','estatística e análise de dados'],
  'redacao':['tese, repertório e projeto de texto','argumentação e desenvolvimento','coesão e proposta de intervenção','reescrita com correção por critérios'],
  '1ª fase':['prova interdisciplinar e gestão de tempo','revisão de alta incidência + estratégia de prova'],
  'business case':['estruturação de problema e hipóteses','unit economics e análise de dados','recomendação executiva baseada em evidências'],
  'escrita':['escrita executiva: problema, análise e recomendação','clareza, síntese e persuasão'],
  'oral':['comunicação em vídeo: estrutura, clareza e presença','storytelling e resposta objetiva'],
  'portfolio':['seleção de evidências, impacto e narrativa pessoal','portfólio: contexto, ação e resultado'],
  'entrevista':['motivação, fit e exemplos comportamentais','entrevista em português e inglês'],
};

const channelFor=(key:string)=>{
  const k=norm(key);
  if(k.includes('matemat')) return 'Professor Ferretto / Khan Academy Brasil';
  if(['fisica','quimica','biologia','natureza'].some(x=>k.includes(x))) return 'Professor Ferretto / Brasil Escola';
  if(['historia','geografia','filosofia','sociologia','humanas'].some(x=>k.includes(x))) return 'Brasil Escola / Curso Enem Gratuito';
  if(['redacao','portugues','linguagens','literatura','ingles'].some(x=>k.includes(x))) return 'Professor Noslen / Brasil Escola';
  if(k.includes('business')||k.includes('escrita')||k.includes('portfolio')||k.includes('entrevista')||k.includes('oral')) return 'Link School of Business / Sebrae';
  return 'Khan Academy Brasil / Brasil Escola';
};

function ytUrl(key:string,topic:string,examId:ExamId,course:string){
  const channel=channelFor(key).split(' / ')[0];
  const context=examId==='fuvest'?'FUVEST':examId==='cmmg'?'vestibular Ciências Médicas':examId==='insper'?'vestibular Insper':examId==='link'?'Jornada Link':'ENEM';
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${topic} ${context} ${course} ${channel}`)}`;
}

function matchArea(area:string,key:string){
  const a=norm(area), k=norm(key.replace('2ª fase — ','').replace('2a fase — ',''));
  if(a===k||a.includes(k)||k.includes(a)) return true;
  if(k==='natureza') return ['natureza','biologia','fisica','quimica'].some(x=>a.includes(x));
  if(k==='humanas'||k==='conhecimentos gerais') return ['humanas','historia','geografia','filosofia','sociologia','conhecimentos gerais'].some(x=>a.includes(x));
  if(k==='linguagens') return ['linguagens','portugues','literatura','ingles'].some(x=>a.includes(x));
  if(k==='1ª fase') return true;
  if(k==='oral') return a.includes('comunicacao')||a.includes('entrevista');
  if(k==='portfolio') return a.includes('prep')||a.includes('portfolio');
  if(k==='escrita') return a.includes('business case')||a.includes('sprint')||a.includes('escrita');
  return false;
}

function phaseFor(examId:ExamId, start:Date){
  const t=start.getTime();
  if(examId==='fuvest') return t<date('2026-11-02').getTime()?'FUVEST · 1ª fase':'FUVEST · 2ª fase';
  if(examId==='enem') return t<date('2026-11-09').getTime()?'ENEM · 1º dia':'ENEM · 2º dia';
  if(examId==='link') {
    if(t<date('2026-10-17').getTime()) return 'Link · PREP';
    if(t<date('2026-10-24').getTime()) return 'Link · Sprint';
    return 'Link · Entrevista';
  }
  return 'Reta de preparação';
}

function eligible(priority:RoadmapPriority,examId:ExamId,phase:string){
  const k=norm(priority.metric.key);
  if(examId==='fuvest') {
    if(phase.includes('1ª')) return k==='1ª fase';
    return k!=='1ª fase';
  }
  if(examId==='enem') {
    if(phase.includes('1º')) return ['linguagens','humanas','redacao'].includes(k);
    return ['natureza','matematica'].includes(k);
  }
  if(examId==='link') {
    if(phase.includes('PREP')) return ['portfolio','oral'].includes(k);
    if(phase.includes('Sprint')) return ['matematica','business case','escrita','oral'].includes(k);
    return ['entrevista','oral'].includes(k);
  }
  return true;
}

export function buildRoadmap(args:{model:ExamModel;course:string;priorities:RoadmapPriority[];weeklyHours:number;questions:RoadmapQuestion[];today?:Date}){
  const {model,course,priorities,weeklyHours,questions}=args;
  const milestones=getMilestones(model.examId,course);
  const finalDate=date(milestones[milestones.length-1].date);
  const rawToday=args.today??new Date();
  const startToday=new Date(rawToday.getFullYear(),rawToday.getMonth(),rawToday.getDate(),12);
  const monday=new Date(startToday); monday.setDate(startToday.getDate()-((startToday.getDay()+6)%7));
  const weeks:RoadmapWeek[]=[];
  const maxWeeks=22;
  for(let i=0;i<maxWeeks;i++){
    const ws=new Date(monday.getTime()+i*7*day);
    if(ws.getTime()>finalDate.getTime()) break;
    const we=new Date(Math.min(ws.getTime()+6*day,finalDate.getTime()));
    const phase=phaseFor(model.examId,ws);
    let candidates=priorities.filter(p=>eligible(p,model.examId,phase));
    if(!candidates.length) candidates=priorities;
    const p=candidates[i%candidates.length]??priorities[0];
    if(!p) continue;
    const baseKey=p.metric.key.replace('2ª fase — ','');
    const pool=topicPools[norm(baseKey)]??topicPools[norm(p.metric.label)]??['revisão dirigida e resolução de questões'];
    const topic=pool[Math.floor(i/Math.max(1,candidates.length))%pool.length];
    const relevant=questions.filter(q=>matchArea(q.area,baseKey));
    const qTarget=Math.max(8,Math.min(45,Math.round(weeklyHours*2.4*(p.score>.25?1.2:1))));
    const questionIds=relevant.slice((i*5)%Math.max(1,relevant.length),((i*5)%Math.max(1,relevant.length))+Math.min(qTarget,12)).map(q=>q.id);
    const hours=Math.max(1,Math.round((weeklyHours/Math.max(1,Math.min(candidates.length,4)))*10)/10);
    const closeToExam=(finalDate.getTime()-ws.getTime())/day<=10;
    const target=closeToExam?'revisão de erros + simulado em tempo real':`dominar ${topic} e transformar erro em acerto repetível`;
    const checkpoint=p.metric.unit==='acertos'?`Buscar ${Math.min(p.goal,p.current+Math.max(1,Math.ceil(p.missing/Math.max(1,weeks.length+2))))}/${p.metric.max} no próximo bloco.`:`Melhorar desempenho em ${baseKey} com correção por critérios.`;
    weeks.push({week:i+1,start:isoDate(ws),end:isoDate(we),phase,focusKey:baseKey,focusLabel:p.metric.label,topic,target,hours,questionTarget:qTarget,questionIds,videoTitle:`Aula: ${topic}`,videoChannel:channelFor(baseKey),videoUrl:ytUrl(baseKey,topic,model.examId,course),checkpoint});
  }
  return {weeks,milestones,finalDate:isoDate(finalDate),daysLeft:Math.max(0,Math.ceil((finalDate.getTime()-startToday.getTime())/day)),dateLabel:`${fmt(milestones[0].date)}${milestones.length>1?` → ${fmt(milestones[milestones.length-1].date)}`:''}`};
}
