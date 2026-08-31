from pathlib import Path

commercial = Path('src/components/CommercialAreaResults.tsx')
text = commercial.read_text()

old = "function confidenceLabel(v:number){return v>=75?'Alta':v>=60?'Boa':v>=45?'Moderada':'Inicial'}\nfunction fitLabel(v:number,confidence=100){const base=v>=90?'Fit muito alto':v>=82?'Fit alto':v>=72?'Fit consistente':'Fit relevante';return confidence<50?`${base} · dados em validação`:base}"
new = "function confidenceLabel(v:number){return v>=75?'Alta':v>=60?'Boa':v>=45?'Moderada':'Inicial'}\nfunction confidenceExplanation(v:number){if(v>=75)return 'Há ampla cobertura de dados e evidências para sustentar a leitura deste match.';if(v>=60)return 'Há boa cobertura de dados; o resultado é bem sustentado, embora alguns aspectos ainda possam ter menos evidências.';if(v>=45)return 'O match foi calculado normalmente, mas parte das características da faculdade ainda tem cobertura intermediária de dados. Isso não reduz o seu fit: indica apenas que a evidência disponível é menos completa do que em uma opção com confiança alta.';return 'O match usa os dados disponíveis, mas a cobertura institucional ainda é inicial. Leia o fit como uma hipótese útil e confira mais informações do curso antes de decidir.'}\nfunction fitLabel(v:number,confidence=100){const base=v>=90?'Fit muito alto':v>=82?'Fit alto':v>=72?'Fit consistente':'Fit relevante';return confidence<50?`${base} · dados em validação`:base}"
assert old in text, 'confidence helpers anchor not found'
text = text.replace(old, new)

old = "{top&&<section className=\"grid md:grid-cols-4 gap-3 mb-3\"><DecisionCard label=\"Fit pessoal\" value={`${top.score}%`} detail=\"Compatibilidade com seu perfil\" tone=\"cyan\"/><button onClick={()=>setShowIndicatorsHelp(true)} className=\"text-left\"><DecisionCard label=\"Indicadores oficiais\" value={topMetrics.length ? `${topMetrics.length}/5 disponíveis` : 'Não cadastrados'} detail={topMetrics.length ? 'CPC · Enade · IDD · IGC · CC' : 'Indicadores oficiais ainda não cadastrados para este curso'} tone=\"violet\"/></button><DecisionCard label=\"Admissão\" value=\"Separada\" detail=\"Fit não é chance de aprovação\" tone=\"amber\"/><DecisionCard label=\"Confiança\" value={confidenceLabel(top.confidence)} detail={`${top.confidence}% de cobertura`} tone=\"emerald\"/></section>}\n      <button onClick={()=>setShowIndicatorsHelp(true)} className=\"mb-8 inline-flex items-center gap-2 text-xs text-violet-200 hover:text-violet-100\"><Info className=\"w-3.5 h-3.5\"/> Como funcionam os indicadores oficiais?</button>"
new = "{top&&<section className=\"grid md:grid-cols-4 gap-3 mb-3\"><DecisionCard label=\"Fit pessoal\" value={`${top.score}%`} detail=\"Quanto seu perfil combina com a faculdade\" tone=\"cyan\"/><button onClick={()=>setShowIndicatorsHelp(true)} className=\"text-left\"><DecisionCard label=\"Indicadores oficiais\" value={topMetrics.length ? `${topMetrics.length}/5 disponíveis` : 'Não cadastrados'} detail={topMetrics.length ? 'CPC · Enade · IDD · IGC · CC' : 'Sem indicadores oficiais vinculados a este curso/campus'} tone=\"violet\"/></button><DecisionCard label=\"Admissão\" value=\"Separada\" detail=\"Fit não é chance de aprovação\" tone=\"amber\"/><DecisionCard label=\"Confiança\" value={confidenceLabel(top.confidence)} detail={`${top.confidence}% de cobertura dos dados`} tone=\"emerald\"/></section>}\n      {top&&<section className=\"mb-4 rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.045] p-5\"><div className=\"flex items-start gap-3\"><Info className=\"w-5 h-5 text-emerald-200 mt-0.5 shrink-0\"/><div><div className=\"font-black text-emerald-100 mb-1\">Como ler a confiança: {confidenceLabel(top.confidence)}</div><p className=\"text-sm text-ink-300 leading-relaxed\">{confidenceExplanation(top.confidence)}</p><p className=\"text-xs text-ink-500 mt-2\"><strong className=\"text-ink-300\">Fit</strong> mede compatibilidade com você. <strong className=\"text-ink-300\">Confiança</strong> mede quão completa é a base de dados usada para sustentar essa comparação. Uma confiança moderada não transforma um fit alto em fit baixo.</p></div></div></section>}\n      <button onClick={()=>setShowIndicatorsHelp(true)} className=\"mb-8 inline-flex items-center gap-2 text-xs text-violet-200 hover:text-violet-100\"><Info className=\"w-3.5 h-3.5\"/> Como funcionam os indicadores oficiais?</button>"
assert old in text, 'decision cards anchor not found'
text = text.replace(old, new)

old = "<span className=\"text-[11px] px-2 py-1 rounded-full border border-white/10 text-ink-400\">{confidenceLabel(m.confidence)} confiança</span>"
new = "<span title={confidenceExplanation(m.confidence)} className=\"text-[11px] px-2 py-1 rounded-full border border-white/10 text-ink-400\">Confiança {confidenceLabel(m.confidence)} · {m.confidence}%</span>"
assert old in text, 'confidence badge anchor not found'
text = text.replace(old, new)

old = "<DecisionCard label=\"Confiança\" value={confidenceLabel(m.confidence)} detail={`${m.confidence}%`} tone=\"emerald\"/>"
new = "<DecisionCard label=\"Confiança\" value={confidenceLabel(m.confidence)} detail={`${m.confidence}% de cobertura`} tone=\"emerald\"/>"
assert old in text, 'program confidence card anchor not found'
text = text.replace(old, new)

start = text.index("function Comparison({items}:{items:ProfessionalMatchResult[]})")
end = text.index("function Methodology()", start)
comparison = r'''function Comparison({items}:{items:ProfessionalMatchResult[]}){
  if(items.length<2)return <p className="text-ink-400">Selecione pelo menos duas faculdades.</p>;
  const clean=(value:string|null|undefined)=>value?.trim()||'—';
  const rows:{label:string;value:(m:ProfessionalMatchResult)=>string;emphasis?:boolean}[]=[
    {label:'Fit pessoal',value:m=>`${m.score}%`,emphasis:true},
    {label:'Confiança dos dados',value:m=>`${confidenceLabel(m.confidence)} · ${m.confidence}%`},
    {label:'Acadêmico',value:m=>`${m.breakdown.academic}%`},
    {label:'Aprendizagem',value:m=>`${m.breakdown.learning}%`},
    {label:'Ambiente',value:m=>`${m.breakdown.environment}%`},
    {label:'Carreira',value:m=>`${m.breakdown.career}%`},
    {label:'Global / impacto',value:m=>`${m.breakdown.globalPurpose}%`},
    {label:'Curso',value:m=>clean(m.university.course)},
    {label:'Localização',value:m=>clean(m.university.location)},
    {label:'Campus',value:m=>clean(m.university.campus)},
    {label:'Modalidade',value:m=>clean(m.university.modality)},
    {label:'Perfil de alta aderência',value:m=>clean(m.university.highFit)},
    {label:'Currículo',value:m=>clean(m.university.curriculumSummary)},
    {label:'Pesquisa',value:m=>clean(m.university.researchSummary)},
    {label:'Carreira e mercado',value:m=>clean(m.university.careerSummary)},
    {label:'Internacionalização',value:m=>clean(m.university.internationalSummary)},
    {label:'Bolsas e valor',value:m=>clean(m.university.scholarshipsSummary)},
    {label:'Experiência estudantil',value:m=>clean(m.university.studentExperienceSummary)},
    {label:'Evidências associadas',value:m=>m.university.evidenceCount>0?String(m.university.evidenceCount):'—'},
    {label:'CPC',value:m=>m.university.cpc==null?'—':String(m.university.cpc)},
    {label:'Enade',value:m=>m.university.enade==null?'—':String(m.university.enade)},
    {label:'IDD',value:m=>m.university.idd==null?'—':String(m.university.idd)},
    {label:'IGC',value:m=>m.university.igc==null?'—':String(m.university.igc)},
    {label:'CC',value:m=>m.university.cc==null?'—':String(m.university.cc)},
  ];
  const visibleRows=rows.filter(row=>items.some(m=>row.value(m)!=='—'));
  return <div>
    <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.045] p-4 mb-5 text-sm text-ink-300"><strong className="text-emerald-100">Confiança não é o fit.</strong> Ela mostra a cobertura dos dados que sustentam o resultado. Campos sem informação validada são ocultados do comparador em vez de aparecerem como espaços vazios.</div>
    <div className="overflow-x-auto"><table className="w-full min-w-[760px]"><thead><tr><th className="text-left p-3 text-ink-500">Critério</th>{items.map(m=><th key={m.university.id} className="text-left p-3 min-w-[210px]"><div className="font-black">{m.university.name}</div>{m.university.location&&<div className="text-xs text-ink-500 mt-1">{m.university.location}</div>}</th>)}</tr></thead><tbody>{visibleRows.map(row=><tr key={row.label} className="border-t border-white/10 align-top"><td className="p-3 text-sm text-ink-500 whitespace-nowrap">{row.label}</td>{items.map(m=>{const value=row.value(m);return <td key={m.university.id} className={`p-3 ${row.emphasis?'text-xl text-cyan-200':'text-sm text-ink-200'} font-bold leading-relaxed`}>{value==='—'?<span className="text-ink-700">—</span>:value}</td>})}</tr>)}</tbody></table></div>
  </div>
}
'''
text = text[:start] + comparison + text[end:]
commercial.write_text(text)

comparator = Path('src/components/Comparator.tsx')
text = comparator.read_text()

insert_anchor = "  const selectedUniversities = selected\n    .map((id) => universities.find((u: University) => u.university_id === id))\n    .filter(Boolean) as University[];"
insert_new = insert_anchor + "\n\n  const hasText = (value: string | null | undefined) => Boolean(value && value.trim());\n  const optionalRows = [\n    { label: 'Curso', value: (uni: University) => uni.course },\n    { label: 'Localização', value: (uni: University) => uni.location },\n    { label: 'Formato', value: (uni: University) => uni.format },\n    { label: 'Posicionamento', value: (uni: University) => uni.positioning },\n    { label: 'Diferenciais do programa', value: (uni: University) => uni.program_differentiators },\n    { label: 'Admissão', value: (uni: University) => uni.admissions },\n    { label: 'Valores e cultura', value: (uni: University) => uni.values },\n    { label: 'Perfil de alta aderência', value: (uni: University) => uni.high_fit_student },\n    { label: 'Pontos de atenção', value: (uni: University) => uni.low_fit_student },\n    { label: 'Por que combina', value: (uni: University) => uni.match_rationale },\n  ].filter((row) => selectedUniversities.some((uni) => hasText(row.value(uni))));"
assert insert_anchor in text, 'selected universities anchor not found'
text = text.replace(insert_anchor, insert_new)

old = """                  <ComparisonRow label=\"Localização\">\n                    {selectedUniversities.map((uni) => (\n                      <td key={uni.university_id} className=\"p-4 text-sm text-ink-300\">{uni.location ?? '—'}</td>\n                    ))}\n                  </ComparisonRow>\n                  <ComparisonRow label=\"Formato\">\n                    {selectedUniversities.map((uni) => (\n                      <td key={uni.university_id} className=\"p-4 text-sm text-ink-300\">{uni.format ?? '—'}</td>\n                    ))}\n                  </ComparisonRow>"""
new = """                  {optionalRows.map((row) => (\n                    <ComparisonRow key={row.label} label={row.label}>\n                      {selectedUniversities.map((uni) => {\n                        const value = row.value(uni);\n                        return (\n                          <td key={uni.university_id} className=\"p-4 text-sm text-ink-300 leading-relaxed align-top min-w-[190px]\">\n                            {hasText(value) ? value : <span className=\"text-ink-700\">—</span>}\n                          </td>\n                        );\n                      })}\n                    </ComparisonRow>\n                  ))}"""
assert old in text, 'legacy optional rows anchor not found'
text = text.replace(old, new)

notice_anchor = "        {selected.length >= 2 && (\n          <>"
notice_new = "        {selected.length >= 2 && (\n          <>\n            <div className=\"mb-5 rounded-2xl border border-brand-400/15 bg-brand-400/[0.05] p-4 text-sm text-ink-400\">O comparador mostra apenas critérios que têm informação em pelo menos uma das faculdades selecionadas. Campos totalmente vazios são removidos automaticamente.</div>"
assert notice_anchor in text, 'legacy compare notice anchor not found'
text = text.replace(notice_anchor, notice_new)

comparator.write_text(text)
print('Results and comparison polish applied.')
