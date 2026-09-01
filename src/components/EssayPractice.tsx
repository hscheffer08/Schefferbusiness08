import { useEffect, useMemo, useState } from 'react';
import { BookOpenCheck, CheckCircle2, FilePenLine, RefreshCw, Sparkles } from 'lucide-react';
import './essay-practice.css';

type ExamId='enem'|'fuvest'|'cmmg'|'insper'|'link';
type EssayTheme={title:string;angle:string;repertoire:string[];checklist:string[]};

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
    {title:'Os limites entre informação em saúde e desinformação nas redes sociais',angle:'Saúde pública, confiança, ciência, comunicação e responsabilidade.',repertoire:['SUS','alfabetização científica','OMS'],checklist:['tese clara','argumentos conectados à realidade social','norma-padrão e conclusão consistente']},
    {title:'A importância das redes de apoio para a saúde mental de jovens',angle:'Família, escola, comunidade, prevenção e acesso a cuidado.',repertoire:['OMS','SUS/RAPS','conceito de determinantes sociais da saúde'],checklist:['não medicalizar todo sofrimento','mostrar fatores sociais','propor caminhos concretos']},
    {title:'Como enfrentar a banalização da violência no cotidiano brasileiro',angle:'Cultura, mídia, relações sociais, prevenção e cidadania.',repertoire:['Constituição Federal','cultura de paz','educação em direitos humanos'],checklist:['delimitar o tipo de violência discutido','explicar causas','concluir de forma propositiva']},
    {title:'O impacto da solidão na qualidade de vida em uma sociedade hiperconectada',angle:'Saúde, tecnologia, vínculos e pertencimento.',repertoire:['OMS','capital social','uso de redes digitais'],checklist:['relacionar indivíduo e sociedade','evitar determinismo tecnológico','organizar bem os parágrafos']},
    {title:'A responsabilidade coletiva na promoção de hábitos de vida saudáveis',angle:'Escolhas individuais, ambiente, políticas públicas e desigualdade.',repertoire:['determinantes sociais da saúde','SUS','direito à saúde'],checklist:['não culpabilizar indivíduos','mostrar condicionantes estruturais','usar exemplos concretos']},
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

export default function EssayPractice(){
  const[examId,setExamId]=useState<ExamId>((localStorage.getItem('conectae:active-exam') as ExamId)||'enem');
  const[index,setIndex]=useState(0);
  useEffect(()=>{const sync=()=>setExamId(((localStorage.getItem('conectae:active-exam') as ExamId)||'enem'));sync();const t=window.setInterval(sync,1000);return()=>window.clearInterval(t)},[]);
  useEffect(()=>setIndex(0),[examId]);
  const themes=useMemo(()=>examId==='link'?[]:THEMES[examId],[examId]);
  if(examId==='link')return null;
  const theme=themes[index%themes.length];
  return <section className="essay12-wrap" id="treino-redacao">
    <div className="essay12-head"><div><span className="essay12-kicker"><FilePenLine size={15}/>Treino de redação · {LABEL[examId]}</span><h2>Temas que fazem sentido para o padrão da sua prova.</h2><p>Os temas abaixo são <b>autorais</b>, construídos a partir do formato e das tendências recentes da banca. Não são previsão de tema.</p></div><button type="button" className="essay12-random" onClick={()=>setIndex(v=>(v+1)%themes.length)}><RefreshCw size={15}/>Trocar tema</button></div>
    <div className="essay12-grid"><article className="essay12-main"><span className="essay12-tag"><Sparkles size={14}/>Tema sugerido</span><h3>{theme.title}</h3><p>{theme.angle}</p><div className="essay12-repertoire"><strong>Repertórios possíveis</strong>{theme.repertoire.map(item=><span key={item}>{item}</span>)}</div></article><aside className="essay12-side"><strong><BookOpenCheck size={16}/>Checklist da banca</strong>{theme.checklist.map(item=><p key={item}><CheckCircle2 size={14}/>{item}</p>)}</aside></div>
    <div className="essay12-list"><strong>Outros temas para treinar</strong><div>{themes.map((t,i)=><button type="button" key={t.title} className={i===index?'active':''} onClick={()=>setIndex(i)}>{t.title}</button>)}</div></div>
  </section>;
}
