import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Download, FileText, LockKeyhole, Search, Upload, Pencil, Paperclip, Star } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import Auth from './Auth';
import './essay-course.css';

type Material = { id: string; file_name: string; storage_path: string; mime_type: string; size_bytes: number; is_duplicate: boolean };
type Lesson = { id: string; slug: string; title: string; category: string; description: string; learning_content: { focus: string; axes: string[]; repertoire: { title: string; application: string }[]; exercise: string; intervention: string; pitfalls: string[]; checklist: string[] }; essay_course_materials: Material[] };
type Draft = { thesis?: string; argument?: string; repertoire?: string; intervention?: string; notes?: string; checks?: number[] };
type Progress = { module_id: string; completed: boolean; draft: Draft; updated_at?: string };
type Submission = { id: string; file_name: string; status: string; submitted_at: string; total_score: number | null; scores: number[] | null; reviewer_comment: string | null };
const categories = ['Todos', 'Saúde', 'Cidadania', 'Meio ambiente', 'Tecnologia', 'Cultura', 'Educação'];
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const goHome = () => window.location.assign('/');

export default function EssayCourse() {
 const { user, loading: authLoading } = useAuth();
 const userId = user?.id;
 const [access, setAccess] = useState(false);
 const [checking, setChecking] = useState(true);
 const [password, setPassword] = useState('');
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState('');
 const [reload, setReload] = useState(0);
 useEffect(() => {
  let alive = true;
  setAccess(false); setError('');
  if (!userId || !supabase) { setChecking(false); return; }
  setChecking(true);
  void supabase.rpc('has_essay_course_access').then(({ data, error: issue }) => {
   if (!alive) return;
   if (issue) setError('Não foi possível verificar seu acesso. Tente novamente.');
   else setAccess(data === true);
   setChecking(false);
  });
  return () => { alive = false; };
 }, [userId, reload]);
 async function enter() {
  if (!supabase || !user || !password.trim()) return;
  setBusy(true); setError('');
  try {
   const { data, error: issue } = await supabase.functions.invoke('essay-course-access', { body: { password: password.trim() } });
   if (issue || !(data?.success === true || data?.ok === true)) {
    let message = data?.error || 'Não foi possível liberar o acesso. Confira a senha e tente novamente.';
    if (issue?.context instanceof Response) { try { message = (await issue.context.json()).error || message; } catch { /* Keep the friendly fallback. */ } }
    throw new Error(message);
   }
   setPassword(''); setReload(n => n + 1);
  } catch (issue) { setError(issue instanceof Error ? issue.message : 'Não foi possível entrar.'); }
  finally { setBusy(false); }
 }
 if (authLoading || checking) return <div className="essay-course ec-loading" role="status">Carregando seu curso…</div>;
 if (!user) return <div className="essay-course"><header className="ec-header"><a href="/">Conectaê</a><span>Redação com Hellen</span></header><div className="ec-login"><p className="ec-kicker">Seu espaço de aprendizagem</p><h1>Entre para acessar o curso de redação.</h1><p>Use sua conta do Conectaê. Depois, informe a senha do curso.</p><Auth compact onBack={goHome} onSuccess={() => setReload(n => n + 1)} onPrivacy={() => window.location.assign('/privacidade')} onTerms={() => window.location.assign('/termos')} /></div></div>;
 if (!access) return <div className="essay-course"><header className="ec-header"><a href="/"><ArrowLeft size={17} />Conectaê</a><span>Redação com Hellen</span></header><main className="ec-gate"><LockKeyhole size={30} /><p className="ec-kicker">Curso exclusivo</p><h1>Curso de Redação ENEM</h1><p>Materiais originais da professora, aulas por tema e espaço para praticar.</p><form onSubmit={e => { e.preventDefault(); void enter(); }}><label htmlFor="essay-password">Senha do curso</label><input id="essay-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="off" />{error && <p className="ec-error" role="alert">{error}</p>}<button className="ec-primary" disabled={busy}>{busy ? 'Verificando…' : 'Acessar curso'} {!busy && <ArrowRight size={18} />}</button></form><button className="ec-link" onClick={() => setReload(n => n + 1)}>Verificar meu acesso novamente</button><p className="ec-purchase">Para adquirir, entre em contato com <a href="https://www.instagram.com/redacaocomhellen/" target="_blank" rel="noreferrer">@redacaocomhellen</a>.</p><div className="ec-gate-features"><div><FileText size={23}/><span><b>15 aulas</b> completas</span></div><div><Pencil size={23}/><span>Materiais exclusivos</span></div><div><Paperclip size={23}/><span>Envio de redações</span></div><div><Star size={23}/><span>Correção detalhada</span></div></div></main></div>;
 return <CourseWorkspace key={user.id} userId={user.id} />;
}

function CourseWorkspace({ userId }: { userId: string }) {
 const [lessons, setLessons] = useState<Lesson[]>([]);
 const [progress, setProgress] = useState<Record<string, Progress>>({});
 const [dirty, setDirty] = useState<string[]>([]);
 const [submissions, setSubmissions] = useState<Submission[]>([]);
 const [loading, setLoading] = useState(true);
 const [loadError, setLoadError] = useState('');
 const [tab, setTab] = useState('aulas');
 const [selected, setSelected] = useState<string | null>(null);
 const [query, setQuery] = useState('');
 const [category, setCategory] = useState('Todos');
 const [saving, setSaving] = useState(false);
 const [notice, setNotice] = useState('');
 const [file, setFile] = useState<File | null>(null);
 const [uploading, setUploading] = useState(false);
 const [uploadMessage, setUploadMessage] = useState('');
 const fileInput = useRef<HTMLInputElement>(null);
 const lessonHeading = useRef<HTMLHeadingElement>(null);
 const load = useCallback(async () => {
  if (!supabase) return;
  setLoading(true); setLoadError('');
  const results = await Promise.all([
   supabase.from('essay_course_modules').select('id,slug,title,category,description,learning_content,essay_course_materials(id,file_name,storage_path,mime_type,size_bytes,is_duplicate)').eq('status', 'published').not('slug', 'is', null).order('sort_order'),
   supabase.from('essay_course_progress').select('module_id,completed,draft,updated_at').eq('user_id', userId),
   supabase.from('essay_submissions').select('id,file_name,status,submitted_at,total_score,scores,reviewer_comment').eq('user_id', userId).order('submitted_at', { ascending: false }),
  ]);
  if (results.some(r => r.error)) setLoadError('Não foi possível carregar todos os dados do curso. Tente novamente.');
  setLessons((results[0].data ?? []) as unknown as Lesson[]);
  setProgress(Object.fromEntries((results[1].data ?? []).map((p: Progress) => [p.module_id, p])));
  setSubmissions((results[2].data ?? []) as Submission[]);
  setLoading(false);
 }, [userId]);
 useEffect(() => { void load(); }, [load]);
 useEffect(() => {
  if (!dirty.length) return;
  const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
  window.addEventListener('beforeunload', warn);
  return () => window.removeEventListener('beforeunload', warn);
 }, [dirty.length]);
 useEffect(() => { if (selected) lessonHeading.current?.focus(); }, [selected]);
 const filtered = useMemo(() => lessons.filter(l => (category === 'Todos' || l.category === category) && normalize(l.title + ' ' + l.description).includes(normalize(query))), [lessons, category, query]);
 const current = lessons.find(l => l.id === selected);
 const done = lessons.filter(l => progress[l.id]?.completed).length;
 function updateDraft(id: string, patch: Partial<Draft>) {
  setProgress(p => ({ ...p, [id]: { module_id: id, completed: p[id]?.completed ?? false, draft: { ...p[id]?.draft, ...patch } } }));
  setDirty(d => d.includes(id) ? d : [...d, id]); setNotice('');
 }
 async function save(id: string, completed?: boolean) {
  if (!supabase) return;
  setSaving(true); setNotice('');
  const item = progress[id] ?? { module_id: id, completed: false, draft: {} };
  const next = { ...item, completed: completed ?? item.completed, updated_at: new Date().toISOString() };
  try {
   const { error } = await supabase.from('essay_course_progress').upsert({ ...next, user_id: userId }, { onConflict: 'user_id,module_id' });
   if (error) throw error;
   setProgress(p => ({ ...p, [id]: next })); setDirty(d => d.filter(x => x !== id)); setNotice('Rascunho e progresso salvos na sua conta.');
  } catch { setNotice('Não foi possível salvar. Seu texto continua nesta página; tente novamente.'); }
  finally { setSaving(false); }
 }
 async function upload() {
  if (!file || !supabase) return;
  setUploading(true); setUploadMessage('');
  let uploadedPath: string | null = null;
  try {
   if (file.size > 10 * 1024 * 1024 || !(file.type === 'application/pdf' || file.type.startsWith('image/'))) throw new Error('Selecione uma imagem ou PDF de até 10 MB.');
   const week = new Date(); week.setHours(0, 0, 0, 0); week.setDate(week.getDate() - week.getDay());
   const { data: existing, error: lookupError } = await supabase.from('essay_submissions').select('id').eq('user_id', userId).gte('submitted_at', week.toISOString()).limit(1);
   if (lookupError) throw new Error('Não foi possível verificar os envios da semana. Tente novamente.');
   if (existing?.length) throw new Error('Você já enviou a redação desta semana. Acompanhe em Minhas correções.');
   const path = `${userId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
   const { error: storageError } = await supabase.storage.from('essay-submissions').upload(path, file);
   if (storageError) throw new Error('Não foi possível enviar o arquivo. Tente novamente.');
   uploadedPath = path;
   const { data, error: dbError } = await supabase.from('essay_submissions').insert({ user_id: userId, file_path: path, file_name: file.name, file_type: file.type, week_key: week.toISOString().slice(0, 10) }).select('id,file_name,status,submitted_at,total_score,scores,reviewer_comment').single();
   if (dbError) throw new Error('Não foi possível registrar a redação. Tente novamente.');
   uploadedPath = null;
   setSubmissions(s => [data as Submission, ...s]); setFile(null); if (fileInput.current) fileInput.current.value = '';
   setUploadMessage('Redação enviada. Acompanhe a avaliação em Minhas correções.');
  } catch (issue) {
   if (uploadedPath) await supabase.storage.from('essay-submissions').remove([uploadedPath]);
   setUploadMessage(issue instanceof Error ? issue.message : 'Não foi possível enviar.');
  } finally { setUploading(false); }
 }
 return <div className="essay-course"><header className="ec-header"><a href="/"><ArrowLeft size={17} />Conectaê</a><span>Redação com Hellen</span></header><main className="ec-main">
  <section className="ec-hero"><div><p className="ec-kicker">Estudar. Escrever. Revisar.</p><h1>Sua próxima redação<br />começa aqui.</h1><p>Explore as aulas da professora Hellen, construa seus argumentos e transforme repertório em texto.</p><button className="ec-primary" onClick={() => { setTab('roteiro'); setSelected(null); }}>Meu roteiro de escrita <ArrowRight size={17} /></button></div><div className="ec-progress"><BookOpen size={28} /><strong>{done}<span> / {lessons.length || '—'}</span></strong><p>aulas concluídas por você</p><progress aria-label="Progresso das aulas" value={done} max={lessons.length || 1} /><small>Um tema por vez. Uma escrita mais consciente.</small></div></section>
  <nav className="ec-tabs" aria-label="Seções do curso">{[['aulas', 'Aulas e materiais'], ['roteiro', 'Roteiro de escrita'], ['correcoes', 'Minhas correções']].map(([id, label]) => <button key={id} aria-current={tab === id ? 'page' : undefined} onClick={() => { setTab(id); setNotice(''); }}>{label}</button>)}</nav>
  {loadError && <div className="ec-error" role="alert">{loadError} <button onClick={() => void load()}>Tentar novamente</button></div>}
  {loading ? <p role="status">Carregando aulas e materiais…</p> : tab === 'aulas' ? current ? <>
   <button className="ec-back" onClick={() => setSelected(null)}><ArrowLeft size={16} />Todas as aulas</button>
   <section className="ec-lesson-head"><p className="ec-kicker">{current.category}</p><h2 ref={lessonHeading} tabIndex={-1}>{current.title}</h2><p>{current.learning_content.focus}</p></section>
   <div className="ec-lesson-layout"><div className="ec-lesson-content"><Materials key={current.id} materials={current.essay_course_materials.filter(m => !m.is_duplicate)} /><section className="ec-panel"><p className="ec-kicker">Apoio de estudo do Conectaê</p><h3>Do tema ao argumento</h3><p>Possíveis caminhos para desenvolver sua própria tese:</p><ol>{current.learning_content.axes.map(axis => <li key={axis}>{axis}</li>)}</ol><h4>Repertório em ação</h4>{current.learning_content.repertoire.map(r => <div key={r.title}><strong>{r.title}</strong><p>{r.application}</p></div>)}<h4>Treino de 15 minutos</h4><p>{current.learning_content.exercise}</p><h4>Uma possibilidade de intervenção</h4><p>{current.learning_content.intervention}</p><small>Adapte o exemplo ao argumento desenvolvido. Ele é uma sugestão de treino.</small><h4>Cuidados com o recorte</h4><ul>{current.learning_content.pitfalls.map(p => <li key={p}>{p}</li>)}</ul></section></div>
   <aside className="ec-panel ec-draft"><p className="ec-kicker">Seu projeto de texto</p><h3>Pratique nesta aula</h3><p>Salve as ideias na sua conta e retome quando quiser.</p><fieldset disabled={saving}>{([['thesis', 'Minha tese', 'Que ponto de vista você vai defender?'], ['argument', 'Meus argumentos', 'Explique seus dois eixos e a relação entre eles.'], ['repertoire', 'Repertório e conexão', 'Como a referência sustenta seu argumento?'], ['intervention', 'Minha intervenção', 'Quem faz o quê, por qual meio, com que finalidade e detalhamento?'], ['notes', 'Dúvidas para a professora', 'Registre o que você precisa revisar.']] as const).map(([key, label, placeholder]) => <label key={key}>{label}<textarea maxLength={6000} rows={3} value={progress[current.id]?.draft[key] ?? ''} onChange={e => updateDraft(current.id, { [key]: e.target.value })} placeholder={placeholder} /></label>)}<h4>Antes de concluir</h4>{current.learning_content.checklist.map((check, index) => <label className="ec-check" key={check}><input type="checkbox" checked={(progress[current.id]?.draft.checks ?? []).includes(index)} onChange={e => { const old = progress[current.id]?.draft.checks ?? []; updateDraft(current.id, { checks: e.target.checked ? [...old, index] : old.filter(n => n !== index) }); }} /><span>{check}</span></label>)}</fieldset><button disabled={saving} className="ec-primary" onClick={() => void save(current.id)}>{saving ? 'Salvando…' : 'Salvar rascunho'}</button><button disabled={saving} className="ec-secondary" onClick={() => void save(current.id, !progress[current.id]?.completed)}><CheckCircle2 size={17} />{progress[current.id]?.completed ? 'Marcar como em estudo' : 'Salvar e concluir aula'}</button>{dirty.includes(current.id) && <small>Há alterações ainda não salvas.</small>}{notice && <p className="ec-notice" role="status">{notice}</p>}</aside></div>
  </> : <section><div className="ec-section-title"><div><p className="ec-kicker">Biblioteca de aulas</p><h2>Escolha o próximo tema.</h2><p>Materiais originais e atividades específicas para cada recorte.</p></div><label className="ec-search"><Search size={18} /><input aria-label="Buscar aula" placeholder="Buscar um tema…" value={query} onChange={e => setQuery(e.target.value)} /></label></div><div className="ec-filters" aria-label="Filtrar por eixo temático">{categories.map(c => <button key={c} aria-pressed={category === c} onClick={() => setCategory(c)}>{c}</button>)}</div><div className="ec-grid">{filtered.map((lesson, index) => <button className="ec-card" key={lesson.id} onClick={() => { setSelected(lesson.id); setNotice(''); }}><span className="ec-card-top"><span>{lesson.category}</span>{progress[lesson.id]?.completed ? <CheckCircle2 size={20} aria-label="Aula concluída" /> : <span className="ec-number">{String(index + 1).padStart(2, '0')}</span>}</span><h3>{lesson.title}</h3><p>{lesson.description}</p><span className="ec-card-bottom"><span><FileText size={15} />{lesson.essay_course_materials.some(m => m.mime_type.includes('presentation')) ? 'PowerPoint original' : 'PDF original'}</span><ArrowRight size={18} /></span>{dirty.includes(lesson.id) && <small>Rascunho não salvo</small>}</button>)}</div>{!filtered.length && <p className="ec-empty">Nenhuma aula encontrada. Tente outro termo ou filtro.</p>}</section> : tab === 'roteiro' ? <div className="ec-lesson-layout"><WritingGuide /><section className="ec-panel"><p className="ec-kicker">Correção individual</p><h2>Redação da semana</h2><p>Envie uma foto legível ou PDF. O retorno da corretora aparecerá em “Minhas correções”.</p><label className="ec-upload"><Upload size={26} /><strong>{file?.name || 'Selecionar redação'}</strong><span>Imagem ou PDF, até 10 MB</span><input ref={fileInput} type="file" accept="image/*,.pdf" onChange={e => { setFile(e.target.files?.[0] ?? null); setUploadMessage(''); }} /></label><button disabled={!file || uploading} className="ec-primary" onClick={() => void upload()}>{uploading ? 'Enviando…' : 'Enviar para correção'}</button><small>1 redação por semana. Revise a nitidez e confira se todas as linhas aparecem antes de enviar.</small>{uploadMessage && <p className="ec-notice" role="status">{uploadMessage}</p>}</section></div> : <section className="ec-panel"><h2>Minhas correções</h2><p>Veja o histórico dos seus envios e os comentários da corretora.</p>{submissions.length === 0 ? <div className="ec-empty"><FileText size={30} /><p>Você ainda não enviou uma redação.</p><button className="ec-primary" onClick={() => setTab('roteiro')}>Enviar minha primeira redação</button></div> : <div className="ec-submissions">{submissions.map(s => <article key={s.id}><div className="ec-section-title"><div><h3>{s.file_name}</h3><small>Enviada em {new Date(s.submitted_at).toLocaleDateString('pt-BR')}</small></div><span className="ec-status">{s.status === 'corrected' ? 'Corrigida' : 'Aguardando correção'}</span></div>{s.status === 'corrected' && <><p className="ec-score">{s.total_score ?? '—'}<span>/1000</span></p>{Array.isArray(s.scores) && <div className="ec-scores">{s.scores.map((score, i) => <span key={i}>C{i + 1}: <b>{score}</b></span>)}</div>}{s.reviewer_comment && <div className="ec-comment"><h4>Comentário da corretora</h4><p>{s.reviewer_comment}</p></div>}</>}</article>)}</div>}</section>}
  <footer className="ec-footer">Redação com Hellen · Conectaê <span>Os materiais originais preservam o conteúdo da professora. As atividades de apoio complementam o estudo.</span></footer>
 </main></div>;
}

function Materials({ materials }: { materials: Material[] }) {
 const [opening, setOpening] = useState(false);
 const [view, setView] = useState<{ url: string; downloadUrl: string; file: Material } | null>(null);
 const [error, setError] = useState('');
 async function open(file: Material) {
  if (!supabase) return;
  setOpening(true); setError(''); setView(null);
  try {
   const [preview, download] = await Promise.all([
    supabase.storage.from('essay-course-materials').createSignedUrl(file.storage_path, 900),
    supabase.storage.from('essay-course-materials').createSignedUrl(file.storage_path, 900, { download: file.file_name }),
   ]);
   if (preview.error || download.error || !preview.data?.signedUrl || !download.data?.signedUrl) throw new Error('Arquivo indisponível');
   setView({ url: preview.data.signedUrl, downloadUrl: download.data.signedUrl, file });
  } catch { setError('Não foi possível abrir o material. Tente novamente.'); }
  finally { setOpening(false); }
 }
 return <section className="ec-panel"><p className="ec-kicker">Material da professora</p><h3>Aula original</h3><p>Leia o material e use o projeto de texto ao lado para organizar suas ideias.</p>{materials.map(m => <div className="ec-material" key={m.id}><FileText size={23} /><div><strong>{m.file_name}</strong><small>{m.mime_type === 'application/pdf' ? 'PDF' : 'PowerPoint'} · {(m.size_bytes / 1024 / 1024).toFixed(1)} MB</small></div><button className="ec-secondary" disabled={opening} onClick={() => void open(m)}>{opening ? 'Abrindo…' : 'Acessar'}</button></div>)}{!materials.length && <p>Este material ainda não está disponível.</p>}{error && <p role="alert" className="ec-error">{error}</p>}{view && <div className="ec-preview"><div className="ec-preview-actions"><a className="ec-secondary" href={view.downloadUrl} target="_blank" rel="noreferrer"><Download size={16} />Baixar original</a><a href={view.url} target="_blank" rel="noreferrer">Abrir em outra aba</a><button className="ec-link" onClick={() => setView(null)}>Fechar</button></div>{view.file.mime_type === 'application/pdf' ? <iframe src={view.url} title={`Material original: ${view.file.file_name}`} /> : <p>Baixe o PowerPoint para abrir no aplicativo de apresentações de sua preferência. As atividades de estudo estão disponíveis abaixo.</p>}<small>Se o arquivo não aparecer no celular, use “Baixar original”. O acesso expira em 15 minutos; clique em “Acessar” para renovar.</small></div>}</section>;
}

function WritingGuide() {
 return <section className="ec-panel ec-guide"><p className="ec-kicker">Da leitura à revisão</p><h2>Um roteiro para cada redação</h2><ol><li><h3>Leia o recorte</h3><p>Identifique o assunto, o problema e os limites da proposta. Sublinhe as palavras que precisam aparecer na sua discussão.</p></li><li><h3>Planeje sua tese</h3><p>Escreva seu ponto de vista em uma frase. Escolha os argumentos que ajudam a sustentá-lo e decida a ordem da explicação.</p></li><li><h3>Desenvolva com evidências</h3><p>Apresente a ideia do parágrafo, explique o mecanismo e conecte a referência à tese. A referência precisa ajudar o leitor a entender o argumento.</p></li><li><h3>Proponha uma intervenção</h3><p>Defina agente, ação, meio, finalidade e um detalhamento pertinente. A proposta deve responder ao problema discutido e respeitar os direitos humanos.</p></li><li><h3>Revise com intenção</h3><p>Verifique se o texto responde à proposta, se os parágrafos avançam e se os conectivos expressam a relação pretendida. Leia outra vez para corrigir desvios de linguagem.</p></li></ol><h3>Conectivos com função</h3><dl className="ec-connectors"><div><dt>Adição</dt><dd>Além disso, também</dd></div><div><dt>Contraste</dt><dd>Entretanto, por outro lado</dd></div><div><dt>Consequência</dt><dd>Por isso, desse modo</dd></div><div><dt>Exemplificação</dt><dd>Por exemplo</dd></div></dl><p>Escolha pela relação entre as ideias. Trocar palavras automaticamente não garante coesão.</p><h3>Uma semana de prática</h3><p><strong>Primeiro encontro:</strong> leia uma aula e planeje o texto. <strong>Segundo:</strong> escreva a redação. <strong>Terceiro:</strong> revise e envie. Ao receber a correção, reescreva um trecho considerando o comentário da professora.</p></section>;
}
