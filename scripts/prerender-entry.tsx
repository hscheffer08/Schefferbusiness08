import { renderToString } from 'react-dom/server';
import CourseHome from '../src/components/CourseHome';
import PublicStudyPage from '../src/components/PublicStudyPage';
import InfoPages from '../src/components/InfoPages';
import type { PublicPage } from '../src/lib/seo-pages';

const infoPages = { '/como-funciona': 'howitworks', '/metodologia': 'methodology', '/faq': 'faq', '/privacidade': 'privacy', '/termos': 'terms' } as const;
export function render(page: PublicPage) {
  if (page.path === '/') return renderToString(<CourseHome />);
  const info = infoPages[page.path as keyof typeof infoPages];
  if (info) return renderToString(<InfoPages page={info} onBack={() => {}} />);
  return renderToString(<PublicStudyPage page={page} />);
}
