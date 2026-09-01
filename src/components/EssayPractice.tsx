import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BookOpenCheck, CheckCircle2, FilePenLine, RefreshCw, ScanText, Sparkles } from 'lucide-react';
import './essay-practice.css';

type ExamId='enem'|'fuvest'|'cmmg'|'insper'|'link';
type EssayTheme={title:string;angle:string;repertoire:string[];checklist:string[]};
type ReviewItem={label:string;score:number;max:number;comment:string};
type Review={total:number;max:number;range:string;items:ReviewItem[];alerts:string[]};

const THEMES:Record<Exclude<ExamId,'link'>,EssayTheme[]>={
  enem:[
    {title:'Desafios para combater o isolamento social de pessoas idosas no Brasil',angle:'Envelhecimento, vínculos comunitários, etarismo e políticas de convivência.',repertoire:['Estatuto da Pessoa Idosa','Simone de Beauvoir — A Velhice','dados demográficos do IBGE'],checklist:['tese com dois fatores','2 argumentos desenvolvidos','proposta de intervenção com agente, ação, meio, finalidade e detalhamento']},
    {title:'Caminhos para reduzir os impactos das apostas digitais sobre jovens brasileiros',angle:'Tecnologia, saúde mental, educação financeira e regulação.',repertoire:['Código de Defesa do Consumidor','educação financeira','economia comportamental'],checklist:['problematizar sem moralismo','explicar causas estruturais','intervenção viável e respeitosa aos direitos humanos']},
    {title:'Desafios para valorizar o trabalho de cuidado no Brasil',angle:'Divisão sexual do trabalho, economia do cuidado e desigualdade.',repertoire:['Constituição Federal — igualdade','economia do cuidado','participação feminina no mercado de trabalho'],checklist:['contextualização brasileira','repertório produtivo','proposta de intervenção completa']},
    {title:'Estratégias para enfrentar a exclusão digital de grupos vulneráveis no Brasil',angle:'Cidadania, acesso a serviços, alfabetização digital e desigualdade territorial.',repertoire:['Marco Civil da Internet','cidadania digital','desigualdade regional'],checklist:['causa + consequência','argumentos não repetitivos','agente público/social bem definido']},
    {title:'Desafios para a preservação de memórias culturais de comunidades brasileiras',angle:'Patrimônio, identidade, apagamento histórico e acesso à cultura.',repertoire:['Constituição Federal — patrimônio cultural','IPHAN','memória coletiva'],checklist:['definir o problema','articular cultura e cidadania','intervenção específica']},
    {title:'Caminhos para ampliar a inclusão de pessoas com deficiência nos espaços de lazer no Brasil',angle:'Acessibilidade, desenho universal, participação social e capacitismo.',repertoire:['Lei Brasileira de Inclusão','desenho universal','direito à cidade'],checklist:['evitar generalizações','mostrar barreiras concretas','proposta com execução clara']},
  ],
  fuvest:[
    {title:'A confiança ainda é possível em uma sociedade mediada por algoritmos?',angle:'Relações sociais, informação, tecnologia, autoridade e responsabilidade individual.',repertoire:['Byung-Chul Han','Hannah Arendt','redes sociais e curadoria algorítmica'],checklist:['formular ponto de vista próprio','dialogar com ideias contraditórias','construir progressão argumentativa']},
    {title:'O que uma sociedade perde quando deixa de escutar?',angle:'Escuta, polarização, linguagem, democracia e relações humanas.',repertoire:['Paulo Freire','Habermas','literatura e diálogo'],checklist:['interpretar a frase-tema integralmente','usar repertório como argumento','priorizar coerência e estilo']},
    {title:'Entre exposição e intimidade: quem somos quando tudo pode ser publicado?',angle:'Identidade, vida privada, redes sociais e construção pública do eu.',repertoire:['Goffman — representação do eu','sociedade do espetáculo','cultura digital'],checklist:['evitar texto meramente expositivo','sustentar uma tese','articular exemplos e conceitos']},
    {title:'A solidariedade pode existir sem proximidade?',angle:'Comunidade, distância, responsabilidade coletiva e novas formas de vínculo.',repertoire:['Edgar Morin','Zygmunt Bauman','ações coletivas em rede'],checklist:['explorar tensões do tema','não reduzir solidariedade a caridade','concluir retomando a tese']},
    {title:'Quando a eficiência entra em conflito com o cuidado',angle:'Produtividade, saúde, educação, trabalho e ética.',repertoire:['ética do cuidado','Hannah Arendt','sociedade do desempenho'],checklist:['definir os conceitos centrais','contrapor perspectivas','usar linguagem precisa']},
  ],
  cmmg:[
    {title:'Os limites entre informação em saúde e desinformação nas redes sociais',angle:'Saúde pública, confiança, ciência, comunicação e responsabilidade.',repertoire:['SUS','alfabetização científica','OMS'],checklist:['raciocínio lógico e crítico','citações pertinentes e moderadas','aderência exata ao tema','argumentação, coerência e clareza','padrão culto e recursos coesivos']},
    {title:'A importância das redes de apoio para a saúde mental de jovens',angle:'Família, escola, comunidade, prevenção e acesso a cuidado.',repertoire:['OMS','SUS/RAPS','determinantes sociais da saúde'],checklist:['não medicalizar todo sofrimento','mostrar fatores sociais','usar referências apenas quando ajudam o argumento']},
    {title:'Como enfrentar a banalização da violência no cotidiano brasileiro',angle:'Cultura, mídia, relações sociais, prevenção e cidadania.',repertoire:['Constituição Federal','cultura de paz','educação em direitos humanos'],checklist:['delimitar o problema','argumentar com clareza','evitar modelo pronto desconectado da proposta']},
    {title:'O impacto da solidão na qualidade de vida em uma sociedade hiperconectada',angle:'Saúde, tecnologia, vínculos e pertencimento.',repertoire:['OMS','capital social','uso de redes digitais'],checklist:['relacionar indivíduo e sociedade','evitar determinismo tecnológico','organizar progressão textual']},
    {title:'A responsabilidade coletiva na promoção de hábitos de vida saudáveis',angle:'Escolhas individuais, ambiente, políticas públicas e desigualdade.',repertoire:['determinantes sociais da saúde','SUS','direito à saúde'],checklist:['não culpabilizar indivíduos','mostrar condicionantes estruturais','usar exemplos pertinentes']},
  ],
  insper:[
    {title:'Até que ponto a inteligência artificial deve participar de decisões que afetam pessoas?',angle:'Eficiência, viés, transparência, responsabilidade e governança.',repertoire:['ética algorítmica','LGPD','accountability'],checklist:['definir critério para sua posição','considerar contraponto','usar exemplos econômicos e sociais']},
    {title:'O crescimento econômico pode ser dissociado do aumento do consumo de recursos?',angle:'Produtividade, inovação, sustentabilidade e incentivos.',repertoire:['economia circular','externalidades','inovação tecnológica'],checklist:['argumentar com causalidade','evitar slogans','conclusão coerente com a tese']},
    {title:'A conveniência digital está diminuindo nossa autonomia?',angle:'Plataformas, escolhas, dados, consumo e comportamento.',repertoire:['economia comportamental','capitalismo de vigilância','design de escolha'],checklist:['explicar mecanismos','ponderar benefícios e custos','usar linguagem objetiva']},
    {title:'Qual deve ser o papel das empresas diante de problemas sociais?',angle:'Lucro, responsabilidade, impacto, ESG e limites da atuação privada.',repertoire:['stakeholder capitalism','externalidades','governança corporativa'],checklist:['definir limites','usar argumento econômico e social','evitar resposta binária']},
    {title:'A meritocracia é suficiente para explicar resultados educacionais e profissionais?',angle:'Esforço, oportunidade, desigualdade e desenho institucional.',repertoire:['mobilidade social','capital humano','desigualdade de oportunidades'],checklist:['distinguir mérito de oportunidade','considerar objeções','usar evidências e conceitos']},
  ],
};

const LABEL:Record<ExamId,string>={enem:'ENEM / UFMG',fuvest:'FUVEST / USP',cmmg:'Ciências Médicas-MG',insper:'Insper',link:'Link'};
const STOP=new Set('a o as os de da do das dos e em no na nos nas para por com sem um uma uns umas que se ao aos à às como sobre seus suas esse essa esta este seus suas brasil brasileira brasileiro caminhos desafios importância impacto sociedade'.split(' '));
const CONNECTORS=['além disso','portanto','todavia','entretanto','contudo','assim','desse modo','dessa forma','nesse sentido','por conseguinte','ademais','logo','embora','porque','uma vez que','em contrapartida'];
const ARGUMENT=['porque','devido','causa','consequência','consequentemente','pois','uma vez que','isso ocorre','decorre','resultado','impacto'];
const INTERVENTION_AGENTS=['governo','estado','ministério','prefeitura','escola','universidade','mídia','sociedade','empresas','ong','família'];
const INTERVENTION_ACTION=['deve','devem','precisa','implementar','promover','criar','ampliar','fiscalizar','garantir','oferecer','desenvolver'];
const INTERVENTION_MEANS=['por meio','mediante','através','com campanhas','com investimento','por intermédio'];
const INTERVENTION_PURPOSE=['a fim de','para que','com o objetivo','visando','de modo a'];

const norm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const countHits=(text:string,terms:string[])=>terms.filter(t=>text.includes(norm(t))).length;
const level200=(ratio:number)=>ratio>=.86?200:ratio>=.68?160:ratio>=.48?120:ratio>=.28?80:ratio>.08?40:0;

function themeOverlap(text:string,theme:EssayTheme){
  const tokens=norm(`${theme.title} ${theme.angle}`).split(/[^a-z0-9]+/).filter(t=>t.length>4&&!STOP.has(t));
  const unique=[...new Set(tokens)];
  return unique.length?unique.filter(t=>text.includes(t)).length/unique.length:0;
}

function reviewEnem(raw:string,theme:EssayTheme):Review{
  const text=norm(raw);const words=raw.trim().split(/\s+/).filter(Boolean);const paragraphs=raw.split(/\n\s*\n|\n/).map(p=>p.trim()).filter(p=>p.length>25);
  const sentences=raw.split(/[.!?]+/).map(s=>s.trim()).filter(Boolean);const connectorHits=countHits(text,CONNECTORS);const argumentHits=countHits(text,ARGUMENT);const overlap=themeOverlap(text,theme);
  const obviousNoise=(raw.match(/\b(vc|pq|qdo|tbm|tipo|mano|né)\b/gi)||[]).length+(raw.match(/[!?]{2,}/g)||[]).length;
  const c1Ratio=Math.min(1,(words.length/260)*.55+(sentences.length>=8?.25:.1)+(obviousNoise===0?.2:.05));
  const c2Ratio=Math.min(1,overlap*.65+(words.length>=170?.2:.08)+(paragraphs.length>=3?.15:.05));
  const c3Ratio=Math.min(1,(paragraphs.length>=4?.34:paragraphs.length>=3?.25:.1)+Math.min(.36,argumentHits*.09)+(words.length>=180?.2:.08)+(sentences.length>=9?.1:.04));
  const c4Ratio=Math.min(1,Math.min(.68,connectorHits*.095)+(paragraphs.length>=3?.17:.06)+(sentences.length>=8?.15:.06));
  const agent=countHits(text,INTERVENTION_AGENTS)>0,action=countHits(text,INTERVENTION_ACTION)>0,means=countHits(text,INTERVENTION_MEANS)>0,purpose=countHits(text,INTERVENTION_PURPOSE)>0;
  const c5Ratio=(agent? .24:0)+(action?.28:0)+(means?.2:0)+(purpose?.2:0)+(words.length>=170?.08:.02);
  const scores=[level200(c1Ratio),level200(c2Ratio),level200(c3Ratio),level200(c4Ratio),level200(c5Ratio)];
  const items:ReviewItem[]=[
    {label:'Competência 1 · modalidade escrita formal',score:scores[0],max:200,comment:obviousNoise?'Há sinais superficiais de registro informal/pontuação a revisar. Faça revisão gramatical humana.':'Não detectamos ruídos formais óbvios, mas esta ferramenta não faz correção gramatical completa.'},
    {label:'Competência 2 · tema, repertório e tipo textual',score:scores[1],max:200,comment:overlap>.35?'O texto parece manter boa aderência lexical ao recorte proposto.':'A aderência ao tema parece baixa ou difícil de detectar. Confira se todos os parágrafos respondem exatamente à proposta.'},
    {label:'Competência 3 · seleção e organização de argumentos',score:scores[2],max:200,comment:paragraphs.length>=4&&argumentHits>=3?'Há sinais de estrutura argumentativa e relações de causa/consequência.':'Desenvolva mais a tese: causa, evidência/exemplo, explicação e consequência em cada argumento.'},
    {label:'Competência 4 · coesão',score:scores[3],max:200,comment:connectorHits>=5?'Há variedade mínima de articuladores detectada. Confira se os conectivos estão semanticamente corretos.':'Use conectivos com função clara entre frases e parágrafos, sem apenas repeti-los.'},
    {label:'Competência 5 · proposta de intervenção',score:scores[4],max:200,comment:agent&&action&&means&&purpose?'Foram detectados sinais de agente, ação, meio e finalidade. Ainda é preciso conferir detalhamento e respeito aos direitos humanos.':'A proposta parece incompleta. Verifique agente + ação + meio/modo + finalidade + detalhamento.'},
  ];
  const total=scores.reduce((a,b)=>a+b,0);const margin=100;
  const alerts:string[]=[];if(words.length<130)alerts.push('Texto muito curto para uma redação ENEM competitiva.');if(paragraphs.length<3)alerts.push('Poucos blocos de desenvolvimento detectados.');if(overlap<.18)alerts.push('Risco de tangenciamento temático — releia a proposta.');
  return{total,max:1000,range:`${Math.max(0,total-margin)}–${Math.min(1000,total+margin)}`,items,alerts};
}

function reviewCmmg(raw:string,theme:EssayTheme):Review{
  const text=norm(raw);const words=raw.trim().split(/\s+/).filter(Boolean);const paragraphs=raw.split(/\n\s*\n|\n/).map(p=>p.trim()).filter(p=>p.length>25);const connectorHits=countHits(text,CONNECTORS);const argumentHits=countHits(text,ARGUMENT);const overlap=themeOverlap(text,theme);
  const citationHits=(raw.match(/\b(segundo|conforme|de acordo com|afirma|autor|constituição|oms|ibge|sus)\b/gi)||[]).length;
  const logical=Math.min(16,Math.round(4+Math.min(7,argumentHits*1.5)+(paragraphs.length>=3?3:1)+(words.length>=160?2:0)));
  const citations=Math.min(16,citationHits===0?10:citationHits<=4?15:Math.max(6,16-citationHits));
  const pertinence=Math.min(16,Math.round(4+overlap*10+(words.length>=140?2:0)));
  const argument=Math.min(16,Math.round(4+Math.min(5,argumentHits)+Math.min(4,connectorHits*.7)+(paragraphs.length>=3?3:1)));
  const formal=Math.min(16,Math.round(7+(words.length>=150?3:1)+(connectorHits>=3?3:1)+(raw.match(/[!?]{2,}|\b(vc|pq|tbm)\b/gi)?0:3)));
  const items:ReviewItem[]=[
    {label:'Raciocínio lógico e crítico',score:logical,max:16,comment:logical>=12?'Há sinais de encadeamento argumentativo.':'Explique melhor relações de causa, consequência e julgamento crítico.'},
    {label:'Pertinência e moderação de citações',score:citations,max:16,comment:citationHits>5?'Há muitas marcas de referência; a CMMG alerta contra excesso ou citações fora de contexto.':'Use repertório apenas quando ele realmente sustentar o raciocínio.'},
    {label:'Pertinência ao tema e objetivo',score:pertinence,max:16,comment:overlap>.3?'A redação parece aderente ao recorte.':'Revise se a tese responde diretamente à questão proposta e evite modelo pronto.'},
    {label:'Argumentação, coerência e clareza',score:argument,max:16,comment:argument>=12?'Estrutura argumentativa superficialmente consistente.':'Faça cada parágrafo cumprir uma função e conecte evidência ao argumento.'},
    {label:'Padrão culto e recursos coesivos',score:formal,max:16,comment:'Faça revisão final de ortografia, acentuação, pontuação, morfossintaxe e coesão; o detector é apenas superficial.'},
  ];
  const total=items.reduce((s,i)=>s+i.score,0);const alerts:string[]=[];if(words.length<120)alerts.push('Texto curto: confira se você desenvolveu o raciocínio com profundidade.');if(overlap<.16)alerts.push('Possível afastamento do tema/objetivo da questão.');if(citationHits>6)alerts.push('Possível excesso de citações/referências.');
  return{total,max:80,range:`${Math.max(0,total-8)}–${Math.min(80,total+8)}`,items,alerts};
}

export default function EssayPractice(){
  const[examId,setExamId]=useState<ExamId>((localStorage.getItem('conectae:active-exam') as ExamId)||'enem');
  const[index,setIndex]=useState(0);const[text,setText]=useState('');const[review,setReview]=useState<Review|null>(null);
  useEffect(()=>{const sync=()=>setExamId(((localStorage.getItem('conectae:active-exam') as ExamId)||'enem'));sync();const t=window.setInterval(sync,1000);return()=>window.clearInterval(t)},[]);
  useEffect(()=>{setIndex(0);setText('');setReview(null)},[examId]);
  const themes=useMemo(()=>examId==='link'?[]:THEMES[examId],[examId]);
  if(examId==='link')return null;
  const theme=themes[index%themes.length];const canReview=examId==='enem'||examId==='cmmg';
  const runReview=()=>{if(text.trim().length<80)return;setReview(examId==='enem'?reviewEnem(text,theme):reviewCmmg(text,theme))};
  return <section className="essay12-wrap" id="treino-redacao">
    <div className="essay12-head"><div><span className="essay12-kicker"><FilePenLine size={15}/>Treino de redação · {LABEL[examId]}</span><h2>Treine no padrão da sua prova e receba uma correção superficial.</h2><p>Os temas são <b>autorais</b>, construídos a partir do formato e dos critérios da banca. Não são previsão de tema.</p></div><button type="button" className="essay12-random" onClick={()=>{setIndex(v=>(v+1)%themes.length);setReview(null)}}><RefreshCw size={15}/>Trocar tema</button></div>
    <div className="essay12-grid"><article className="essay12-main"><span className="essay12-tag"><Sparkles size={14}/>Tema sugerido</span><h3>{theme.title}</h3><p>{theme.angle}</p><div className="essay12-repertoire"><strong>Repertórios possíveis</strong>{theme.repertoire.map(item=><span key={item}>{item}</span>)}</div></article><aside className="essay12-side"><strong><BookOpenCheck size={16}/>Checklist da banca</strong>{theme.checklist.map(item=><p key={item}><CheckCircle2 size={14}/>{item}</p>)}</aside></div>
    {canReview&&<div className="essay12-review"><div className="essay12-disclaimer"><AlertTriangle size={17}/><p><b>Correção superficial e educacional.</b> Não substitui corretor humano, espelho oficial ou nota da banca. O site detecta estrutura, aderência lexical, conectivos e sinais de argumentação; ele pode não perceber ironia, qualidade real do repertório, erros gramaticais sutis ou fuga temática semântica.</p></div><label><ScanText size={16}/>Cole sua redação</label><textarea value={text} onChange={e=>{setText(e.target.value);setReview(null)}} placeholder={`Escreva ou cole aqui sua redação sobre: ${theme.title}`} rows={12}/><div className="essay12-reviewbar"><span>{text.trim()?text.trim().split(/\s+/).length:0} palavras</span><button type="button" disabled={text.trim().length<80} onClick={runReview}>Fazer correção superficial</button></div>{review&&<div className="essay12-result"><div className="essay12-score"><span>Faixa pedagógica estimada</span><strong>{review.range}</strong><small>centro do diagnóstico: {review.total}/{review.max}</small></div>{review.alerts.length>0&&<div className="essay12-alerts">{review.alerts.map(a=><p key={a}><AlertTriangle size={13}/>{a}</p>)}</div>}<div className="essay12-rubric">{review.items.map(item=><article key={item.label}><div><strong>{item.label}</strong><b>{item.score}/{item.max}</b></div><div className="essay12-meter"><span style={{width:`${(item.score/item.max)*100}%`}}/></div><p>{item.comment}</p></article>)}</div><p className="essay12-source">Base pedagógica: {examId==='enem'?'5 competências da Cartilha do Participante do Inep (0–200 cada).':'critérios publicados no Manual do Candidato da Ciências Médicas-MG. A divisão em 16 pontos por critério é apenas um índice didático do site, não ponderação oficial da banca.'}</p></div>}</div>}
    <div className="essay12-list"><strong>Outros temas para treinar</strong><div>{themes.map((t,i)=><button type="button" key={t.title} className={i===index?'active':''} onClick={()=>{setIndex(i);setReview(null)}}>{t.title}</button>)}</div></div>
  </section>;
}
