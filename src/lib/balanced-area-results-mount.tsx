import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type InstitutionType = 'public' | 'private';

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

function inferInstitutionType(name: string): InstitutionType {
  const value = normalize(name);
  const publicMarkers = [
    'usp','fea-usp','unicamp','unesp','ufmg','ufrj','ufrgs','ufpr','ufsc','unb','ufpe','ufba','ufg','ufrn','ufabc','ufscar','unifesp','uerj','uff','ufv','ufla','ufsm','ufpb','ufc','uel','uem','udesc','utfpr','fatec','instituto federal','ifsp','ifsc','ifrs','ifce','ifpe','ifpb','ifba','ifrn','ifg','ifes','ufrpe','ufpel','ufes','ufal','ufpa','ufjf','ufpi','ufrb','ufs'
  ];
  return publicMarkers.some((marker) => value === marker || value.startsWith(`${marker} `) || value.startsWith(`${marker}/`) || value.includes(` ${marker}`)) ? 'public' : 'private';
}

export default function BalancedAreaResultsMount() {
  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let cancelled = false;
    let typeByName = new Map<string, InstitutionType>();

    const classifyResults = () => {
      if (cancelled || typeByName.size === 0) return;
      const rankingTitle = Array.from(document.querySelectorAll('div')).find((el) => el.textContent?.trim() === 'Ranking completo');
      const section = rankingTitle?.parentElement?.parentElement?.nextElementSibling;
      if (!(section instanceof HTMLElement) || !section.classList.contains('space-y-4')) return;

      section.classList.add('conectae-balanced-results');
      const articles = Array.from(section.querySelectorAll(':scope > article')) as HTMLElement[];
      for (const article of articles) {
        const name = article.querySelector('h3')?.textContent?.trim();
        if (!name) continue;
        article.dataset.institutionType = typeByName.get(normalize(name)) ?? inferInstitutionType(name);
      }

      let publicHeader = section.querySelector('[data-balanced-header="public"]') as HTMLElement | null;
      let privateHeader = section.querySelector('[data-balanced-header="private"]') as HTMLElement | null;
      if (!publicHeader) {
        publicHeader = document.createElement('div');
        publicHeader.dataset.balancedHeader = 'public';
        publicHeader.className = 'conectae-balanced-header conectae-balanced-public-header';
        publicHeader.innerHTML = '<span>Universidades públicas</span><small>Top 10 por fit</small>';
        section.prepend(publicHeader);
      }
      if (!privateHeader) {
        privateHeader = document.createElement('div');
        privateHeader.dataset.balancedHeader = 'private';
        privateHeader.className = 'conectae-balanced-header conectae-balanced-private-header';
        publicHeader.insertAdjacentElement('afterend', privateHeader);
        privateHeader.innerHTML = '<span>Universidades particulares</span><small>Top 10 por fit</small>';
      }

      const publicCards = articles.filter((a) => a.dataset.institutionType === 'public');
      const privateCards = articles.filter((a) => a.dataset.institutionType === 'private');
      publicCards.forEach((card, index) => { card.style.display = index < 10 ? '' : 'none'; });
      privateCards.forEach((card, index) => { card.style.display = index < 10 ? '' : 'none'; });
    };

    const load = async () => {
      const { data, error } = await client
        .from('area_universities')
        .select('university_name,institution_type')
        .not('institution_type', 'is', null);
      if (cancelled || error || !data) return;
      typeByName = new Map(
        data
          .filter((row: any) => row.institution_type === 'public' || row.institution_type === 'private')
          .map((row: any) => [normalize(String(row.university_name)), row.institution_type as InstitutionType])
      );
      classifyResults();
    };

    const observer = new MutationObserver(() => classifyResults());
    observer.observe(document.body, { childList: true, subtree: true });
    void load();
    return () => { cancelled = true; observer.disconnect(); };
  }, []);

  return null;
}
