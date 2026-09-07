import ExamSimulatorHub from '@/components/ExamSimulatorHub';
import OfficialExamReviewV2 from '@/components/OfficialExamReviewV2';

export default function SimulationAndReview(){
  return <div className="space-y-8">
    <ExamSimulatorHub />
    <section>
      <div className="mb-4 border-t border-[#173765] pt-7">
        <div className="text-[11px] font-extrabold uppercase tracking-[.12em] text-[#72a5ff]">Já fez uma prova fora do site?</div>
        <h2 className="mt-2 text-2xl font-black tracking-[-.03em]">Corrigir simulado ou prova antiga</h2>
        <p className="mt-2 text-sm text-[#9fb5d4]">Use a correção abaixo para lançar seu cartão de respostas e transformar os erros em prioridades de estudo.</p>
      </div>
      <OfficialExamReviewV2 />
    </section>
  </div>;
}
