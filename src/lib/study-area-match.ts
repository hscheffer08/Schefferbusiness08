/** Canonical subject names; never confuse Física with Educação Física. */
export function canonicalStudyArea(value: string) {
  const key = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/^2[ªa] fase\s*[—-]\s*/, '').split(' · ')[0].trim();
  if (/^educacao fisica(?: e|$)/.test(key)) return 'educacao fisica';
  if (/^(?:lingua portuguesa|portugues)(?: e|$)/.test(key)) return 'portugues';
  if (/^literatura(?: e|$)/.test(key)) return 'literatura';
  if (key === 'lingua estrangeira' || key === 'lingua inglesa') return 'ingles';
  return key;
}
export function sameStudySubject(area: string, key: string): boolean | undefined {
  const a = canonicalStudyArea(area), k = canonicalStudyArea(key);
  if (!a || !k) return false;
  if (a === k) return true;
  const subjects = ['fisica', 'educacao fisica', 'quimica', 'biologia', 'portugues', 'literatura', 'ingles', 'historia', 'geografia', 'filosofia', 'sociologia', 'redacao'];
  // A specific subject must not inherit a broader area or an unrelated subject.
  if (subjects.includes(k)) return false;
  return undefined;
}
