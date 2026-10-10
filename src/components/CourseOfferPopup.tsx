import { useState } from 'react';
import { ArrowRight, CalendarClock, Crown, X } from 'lucide-react';

const PROMOTION_END = Date.parse('2027-01-01T03:00:00Z');
const POPUP_KEY = 'conectae-course-offer-2026-seen';

export default function CourseOfferPopup() {
  const [open, setOpen] = useState(() => {
    try { return sessionStorage.getItem(POPUP_KEY) !== 'yes'; }
    catch { return true; }
  });
  const early = Date.now() < PROMOTION_END;
  const close = () => {
    setOpen(false);
    try { sessionStorage.setItem(POPUP_KEY, 'yes'); } catch {/* private browsing */}
  };
  if (!open) return null;
  const openPlans = () => {
    close();
    window.dispatchEvent(new Event('conectae:open-premium'));
  };
  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center overflow-y-auto bg-[#020817]/85 p-4 backdrop-blur-md"
         role="dialog" aria-modal="true" aria-labelledby="conectae-offer-heading">
      <div className="relative my-auto w-full max-w-[560px] overflow-hidden rounded-[28px] border border-[#29548a] bg-[#07152d] p-6 text-white shadow-2xl sm:p-9">
        <button type="button" aria-label="Fechar aviso" onClick={close}
                className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/5 p-2 text-slate-200 hover:bg-white/10">
          <X size={18}/>
        </button>
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-xs font-extrabold uppercase tracking-widest text-amber-200">
          <Crown size={14}/> {early ? 'Condição especial até dezembro' : 'Novidade no Conectaê'}
        </div>
        <h2 id="conectae-offer-heading" className="max-w-md text-3xl font-black tracking-tight sm:text-4xl">
          {early ? 'Aproveite o curso com preço especial.' : 'O curso Conectaê agora tem assinatura.'}
        </h2>
        <p className="mt-4 text-sm leading-6 text-slate-300">
          {early
            ? 'A partir de janeiro de 2027, o acesso ao curso será pago. Você pode contratar agora com valor promocional nas mensalidades de 2026.'
            : 'Desde janeiro de 2027, o curso é oferecido por assinatura mensal. Conheça os benefícios e as condições.'}
        </p>
        <div className="mt-7 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-amber-300/30 bg-amber-300/[.08] p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-amber-200">{early ? 'Até dezembro de 2026' : 'Promoção encerrada'}</p>
            <p className="mt-2 text-3xl font-black text-white">R$ 9,99</p>
            <p className="mt-1 text-xs text-slate-300">por mês {early ? 'na promoção' : '(valor anterior)'}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0c2347] p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-300">A partir de janeiro de 2027</p>
            <p className="mt-2 text-3xl font-black text-white">R$ 19,99</p>
            <p className="mt-1 text-xs text-slate-300">por mês</p>
          </div>
        </div>
        <p className="mt-5 flex gap-2 text-xs leading-5 text-slate-300">
          <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-amber-200"/>
          {early
            ? 'O preço de R$ 9,99 vale nas cobranças mensais feitas até dezembro de 2026. Na primeira renovação em janeiro de 2027, o valor passa a R$ 19,99 por mês. Sem fidelidade; cancele antes da próxima renovação.'
            : 'A cobrança é mensal e recorrente. Você pode cancelar a renovação pelo portal de assinatura.'}
        </p>
        <button type="button" onClick={openPlans} className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-300 px-5 py-4 text-sm font-black text-[#10172a] transition hover:bg-amber-200">
          {early ? 'Ver oferta antecipada' : 'Conhecer assinatura'} <ArrowRight size={17}/>
        </button>
        {early && <button type="button" onClick={close}
          className="mt-3 w-full rounded-2xl px-4 py-3 text-sm font-semibold text-slate-300 hover:text-white">
          Continuar estudando gratuitamente até dezembro
        </button>}
        <p className="mt-4 text-center text-[11px] leading-4 text-slate-400">Ao contratar, confira a data da próxima cobrança e aceite os <a className="underline" href="/termos">Termos de Uso</a>.</p>
      </div>
    </div>
  );
}
