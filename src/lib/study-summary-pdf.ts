import { jsPDF } from 'jspdf';

export type StudySummaryPdfData={
  title:string;subject:string;topic:string;focus:string;orientation:string;introduction:string;
  sections:{number:number;title:string;objective:string;explanation:string;keyPoints:string[];connections:string[]}[];
  chronology:{label:string;description:string}[];
  glossary:{term:string;definition:string}[];
  mustRemember:string[];
  commonConfusions:{mistake:string;correction:string}[];
  finalReview:string;
  activeRecall:{question:string;answer:string}[];
};

const PAGE_W=210;
const PAGE_H=297;
const MARGIN=16;
const CONTENT_W=PAGE_W-MARGIN*2;
const BOTTOM=278;
const NAVY:[number,number,number]=[6,21,47];
const BLUE:[number,number,number]=[36,108,255];
const TEXT:[number,number,number]=[38,51,72];
const MUTED:[number,number,number]=[100,116,139];
const LINE:[number,number,number]=[222,229,241];

function clean(value:string){return(value||'').replace(/\r/g,'').trim()}
function slug(value:string){
  const normalized=value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  return(normalized||'resumo').slice(0,54);
}
function header(doc:jsPDF,label:string){
  doc.setFillColor(...NAVY);doc.rect(0,0,PAGE_W,18,'F');
  doc.setFont('helvetica','bold');doc.setFontSize(8);doc.setTextColor(255,255,255);doc.text('CONECTAÊ  /  RESUMO ASTRA',MARGIN,11);
  doc.setFont('helvetica','normal');doc.setTextColor(173,198,239);doc.text(label.slice(0,58),PAGE_W-MARGIN,11,{align:'right'});
}
function newPage(doc:jsPDF,label:string){doc.addPage();header(doc,label);return 29}
function ensure(doc:jsPDF,y:number,needed:number,label:string){return y+needed>BOTTOM?newPage(doc,label):y}
function writeWrapped(doc:jsPDF,text:string,y:number,opts:{size?:number;bold?:boolean;color?:[number,number,number];indent?:number;gap?:number;label:string}){
  const value=clean(text);if(!value)return y;
  const size=opts.size??9.5,indent=opts.indent??0,gap=opts.gap??4.8;
  doc.setFont('helvetica',opts.bold?'bold':'normal');doc.setFontSize(size);doc.setTextColor(...(opts.color??TEXT));
  const lines=doc.splitTextToSize(value,CONTENT_W-indent) as string[];
  for(const line of lines){y=ensure(doc,y,gap+2,opts.label);doc.text(line,MARGIN+indent,y);y+=gap}
  return y;
}
function heading(doc:jsPDF,title:string,y:number,label:string,level:1|2=2){
  y=ensure(doc,y,level===1?15:11,label);
  doc.setFont('helvetica','bold');doc.setTextColor(...(level===1?NAVY:BLUE));doc.setFontSize(level===1?17:12);
  const lines=doc.splitTextToSize(clean(title),CONTENT_W) as string[];
  doc.text(lines,MARGIN,y);return y+lines.length*(level===1?7:5.5)+2;
}
function bullets(doc:jsPDF,items:string[],y:number,label:string){
  for(const item of items){y=writeWrapped(doc,`- ${item}`,y,{size:9.2,indent:2,gap:4.6,label});y+=1}
  return y;
}
function addFooters(doc:jsPDF){
  const pages=doc.getNumberOfPages();
  for(let page=1;page<=pages;page++){
    doc.setPage(page);doc.setDrawColor(...LINE);doc.line(MARGIN,285,PAGE_W-MARGIN,285);
    doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.setTextColor(...MUTED);
    doc.text('Conectaê - resumo gerado pelo Astra',MARGIN,291);
    doc.text(`${page}/${pages}`,PAGE_W-MARGIN,291,{align:'right'});
  }
}
export function buildStudySummaryPdf(summary:StudySummaryPdfData){
  const doc=new jsPDF({unit:'mm',format:'a4'});
  doc.setFillColor(...NAVY);doc.rect(0,0,PAGE_W,PAGE_H,'F');
  doc.setFillColor(...BLUE);doc.rect(0,0,PAGE_W,3,'F');
  doc.setFont('helvetica','bold');doc.setFontSize(10);doc.setTextColor(145,183,255);doc.text('CONECTAÊ  /  ASTRA',MARGIN,28);
  doc.setFont('helvetica','bold');doc.setFontSize(27);doc.setTextColor(255,255,255);
  const titleLines=doc.splitTextToSize(clean(summary.title),CONTENT_W) as string[];doc.text(titleLines,MARGIN,48);
  let coverY=48+titleLines.length*10+5;
  doc.setFont('helvetica','normal');doc.setFontSize(11);doc.setTextColor(185,204,232);
  const meta=doc.splitTextToSize(`${summary.subject} · ${summary.topic} · ${summary.focus}`,CONTENT_W) as string[];doc.text(meta,MARGIN,coverY);
  coverY+=meta.length*6+13;
  doc.setFont('helvetica','bold');doc.setFontSize(9);doc.setTextColor(145,183,255);doc.text('COMO USAR ESTE RESUMO',MARGIN,coverY);
  coverY+=8;doc.setFont('helvetica','normal');doc.setFontSize(10);doc.setTextColor(226,234,247);
  const orientation=doc.splitTextToSize(clean(summary.orientation)||'Leia na ordem e use as perguntas finais para revisão ativa.',CONTENT_W) as string[];
  doc.text(orientation,MARGIN,coverY);
  doc.setFontSize(8);doc.setTextColor(127,151,188);doc.text(`Gerado em ${new Intl.DateTimeFormat('pt-BR',{dateStyle:'long'}).format(new Date())}`,MARGIN,278);

  let y=newPage(doc,summary.subject);
  y=heading(doc,'Visão geral',y,summary.subject,1);
  y=writeWrapped(doc,summary.introduction,y,{size:10,gap:5.2,label:summary.subject});y+=7;

  for(const section of summary.sections){
    y=heading(doc,`${section.number}. ${section.title}`,y,summary.subject,1);
    if(section.objective){y=writeWrapped(doc,`Objetivo: ${section.objective}`,y,{size:8.7,bold:true,color:MUTED,gap:4.5,label:summary.subject});y+=3}
    y=writeWrapped(doc,section.explanation,y,{size:9.6,gap:5,label:summary.subject});y+=5;
    if(section.keyPoints.length){y=heading(doc,'Pontos-chave',y,summary.subject);y=bullets(doc,section.keyPoints,y,summary.subject);y+=3}
    if(section.connections.length){y=heading(doc,'Como isso se conecta',y,summary.subject);y=bullets(doc,section.connections,y,summary.subject);y+=5}
  }

  if(summary.chronology.length){
    y=heading(doc,'Sequência do assunto',y,summary.subject,1);
    for(const item of summary.chronology){
      y=writeWrapped(doc,item.label,y,{size:9.2,bold:true,color:BLUE,gap:4.6,label:summary.subject});
      y=writeWrapped(doc,item.description,y,{size:9.2,indent:3,gap:4.7,label:summary.subject});y+=3;
    }
  }
  if(summary.glossary.length){
    y=heading(doc,'Glossário essencial',y,summary.subject,1);
    for(const item of summary.glossary){
      y=writeWrapped(doc,item.term,y,{size:9.2,bold:true,color:BLUE,gap:4.6,label:summary.subject});
      y=writeWrapped(doc,item.definition,y,{size:9.2,indent:3,gap:4.7,label:summary.subject});y+=3;
    }
  }
  if(summary.mustRemember.length){y=heading(doc,'O que você não pode esquecer',y,summary.subject,1);y=bullets(doc,summary.mustRemember,y,summary.subject);y+=6}
  if(summary.commonConfusions.length){
    y=heading(doc,'Confusões comuns',y,summary.subject,1);
    for(const item of summary.commonConfusions){
      y=writeWrapped(doc,`Confusão: ${item.mistake}`,y,{size:9.2,bold:true,gap:4.7,label:summary.subject});
      y=writeWrapped(doc,`Correto: ${item.correction}`,y,{size:9.2,indent:3,gap:4.7,label:summary.subject});y+=4;
    }
  }
  if(summary.finalReview){y=heading(doc,'Revisão final integrada',y,summary.subject,1);y=writeWrapped(doc,summary.finalReview,y,{size:9.6,gap:5,label:summary.subject});y+=6}
  if(summary.activeRecall.length){
    y=heading(doc,'Perguntas de revisão',y,summary.subject,1);
    summary.activeRecall.forEach((item,index)=>{
      y=writeWrapped(doc,`${index+1}. ${item.question}`,y,{size:9.4,bold:true,gap:4.8,label:summary.subject});
      y=writeWrapped(doc,`Resposta: ${item.answer}`,y,{size:9.2,indent:3,color:MUTED,gap:4.7,label:summary.subject});y+=4;
    });
  }

  addFooters(doc);
  const filename=`conectae-resumo-${slug(summary.topic||summary.title)}-${new Date().toISOString().slice(0,10)}.pdf`;
  return{doc,filename};
}
export function downloadStudySummaryPdf(summary:StudySummaryPdfData){const{doc,filename}=buildStudySummaryPdf(summary);doc.save(filename)}
export function createStudySummaryPdfFile(summary:StudySummaryPdfData){const{doc,filename}=buildStudySummaryPdf(summary);return new File([doc.output('blob')],filename,{type:'application/pdf'})}
