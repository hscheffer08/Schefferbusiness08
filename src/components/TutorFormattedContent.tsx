import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { normalizeTutorMarkdown } from '@/lib/tutor-markdown';
import 'katex/dist/katex.min.css';
import './tutor-content.css';

export default function TutorFormattedContent({ content }: { content: string }) {
  return <div className="tutor-formatted-content">
    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[[rehypeKatex, { trust: false, strict: 'ignore' }]]} skipHtml>
      {normalizeTutorMarkdown(content)}
    </ReactMarkdown>
  </div>;
}
