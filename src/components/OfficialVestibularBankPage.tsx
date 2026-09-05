import { ArrowLeft, GraduationCap } from 'lucide-react';
import OfficialVestibularBank from '@/components/OfficialVestibularBank';
import './admissions-planner-v6.css';

export default function OfficialVestibularBankPage({onBack}:{onBack:()=>void}){
  return <div className="plan6">
    <header className="plan6-top">
      <div className="plan6-shell plan6-topin">
        <button className="plan6-back" onClick={onBack}><ArrowLeft size={17}/>Voltar</button>
        <div className="plan6-brand"><span className="plan6-mark"><GraduationCap size={18}/></span><span>Conectaê</span></div>
        <div className="plan6-kicker plan6-desktop-only">Questões oficiais</div>
      </div>
    </header>
    <main className="plan6-shell" style={{paddingTop:28,paddingBottom:48}}>
      <section className="plan6-hero">
        <div>
          <div className="plan6-eyebrow">Banco oficial por vestibular</div>
          <h1>Questões reais, separadas da parte autoral.</h1>
          <p className="plan6-lead">Filtre por vestibular, edição e área. Cada item mantém a identificação da prova e acesso à fonte oficial correspondente.</p>
        </div>
        <aside className="plan6-summary"><strong>548+</strong><small>questões oficiais indexadas</small><div className="plan6-summary-row"><span>ENEM + CMMG</span><span><b>fontes rastreadas</b></span></div></aside>
      </section>
      <div className="plan6-grid"><OfficialVestibularBank/></div>
    </main>
  </div>;
}
