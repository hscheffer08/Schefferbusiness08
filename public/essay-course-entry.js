(() => {
  const COURSE_PATH = '/curso-redacao';
  const isHome = () => window.location.pathname === '/' && !new URLSearchParams(window.location.search).toString();
  const mount = () => {
    if (!isHome() || document.getElementById('essay-course-home-entry')) return;
    const hero = Array.from(document.querySelectorAll('button')).find((b) => (b.textContent || '').includes('Montar meu plano'));
    if (!hero) return;
    const actions = hero.parentElement;
    if (!actions) return;
    const button = document.createElement('button');
    button.id = 'essay-course-home-entry';
    button.type = 'button';
    button.setAttribute('aria-label', 'Abrir Curso de Redação ENEM');
    button.innerHTML = '<span style="font-size:18px;line-height:1">✍️</span><span><strong style="display:block;font-size:14px;line-height:18px">Curso de Redação ENEM</strong><small style="display:block;font-size:10px;line-height:14px;font-weight:700;opacity:.68">com corretora oficial do ENEM</small></span><span style="margin-left:auto;font-size:18px">→</span>';
    Object.assign(button.style, { width:'100%', minHeight:'56px', display:'flex', alignItems:'center', gap:'10px', padding:'10px 18px', borderRadius:'16px', border:'1px solid #c7d1ff', background:'#fff', color:'#172344', fontFamily:'inherit', fontWeight:'800', textAlign:'left', cursor:'pointer', boxShadow:'0 4px 14px rgba(49,85,231,.07)' });
    button.onclick = () => window.location.assign(COURSE_PATH);
    actions.appendChild(button);
  };
  const observer = new MutationObserver(mount);
  observer.observe(document.documentElement, { childList:true, subtree:true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
  setTimeout(mount, 500);
})();
