import { formatQuestionPrompt } from '@/lib/question-prompt-format';

export default function QuestionPrompt({ text }: { text: string }) {
  return <div className="mt-3 space-y-4 text-base font-normal leading-7" aria-label="Enunciado da questão">
    {formatQuestionPrompt(text).map((paragraph, index) => <p key={index} className="whitespace-pre-line">{paragraph}</p>)}
  </div>;
}
