import { supabase } from '@/lib/supabase';
import type { AcademicArea, AreaUniversity } from '@/lib/area-match-data';

export interface ProfessionalUniversity extends AreaUniversity {
  areaUniversityId: number;
  campus?: string | null;
  modality?: string | null;
  cpc?: number | null;
  enade?: number | null;
  idd?: number | null;
  igc?: number | null;
  cc?: number | null;
  regulatoryStatus?: string | null;
  officialCourseUrl?: string | null;
  curriculumSummary?: string | null;
  researchSummary?: string | null;
  careerSummary?: string | null;
  internationalSummary?: string | null;
  scholarshipsSummary?: string | null;
  studentExperienceSummary?: string | null;
  dataConfidence: number;
  evidenceCount: number;
}

export interface ProfessionalArea extends Omit<AcademicArea, 'universities'> {
  universities: ProfessionalUniversity[];
  dimensionWeights: Record<string, number>;
}

export interface ProfessionalMatchResult {
  university: ProfessionalUniversity;
  score: number;
  confidence: number;
  breakdown: Record<'academic'|'learning'|'environment'|'career'|'globalPurpose', number>;
  strengths: string[];
  watchouts: string[];
}

const CATEGORY_MAP: Record<string, keyof ProfessionalMatchResult['breakdown']> = {
  academic: 'academic',
  learning: 'learning',
  environment: 'environment',
  career: 'career',
  global: 'globalPurpose',
  purpose: 'globalPurpose',
  outcomes: 'academic',
};

const QUESTION_DIMENSION_MAP: Record<string, string[]> = {
  rigor: ['academic_rigor'],
  practical: ['practical_learning','project_based'],
  research: ['research_intensity'],
  people: ['people_contact','collaborative_culture'],
  technology: ['technology_integration'],
  leadership: ['leadership','entrepreneurship'],
  structure: ['structure_support'],
  international: ['international_exposure'],
  flexibility: ['academic_flexibility','autonomy'],
  faculty: ['faculty_access'],
  belonging: ['belonging_support','campus_experience'],
  competition: ['competitive_environment'],
  quantitative: ['quantitative_intensity'],
  theory: ['theory_orientation'],
  career: ['career_integration','employability_focus'],
  impact: ['social_impact'],
};

const LEGACY_BUSINESS_DIMENSION_MAP: Record<string, string[]> = {
  academic_rigor: ['rigor_depth', 'academic_perf', 'achievement_selectivity'],
  academic_flexibility: ['autonomy_selfdirection', 'curiosity_learning'],
  faculty_access: ['oral_pitch', 'teamwork_collab'],
  research_intensity: ['critical_thinking', 'theory_comfort', 'curiosity_learning'],
  practical_learning: ['practical_learning', 'experimental_learning', 'work_experience'],
  project_based: ['project_execution', 'experimental_learning', 'problem_solving'],
  theory_orientation: ['theory_comfort', 'writing_argument'],
  quantitative_intensity: ['math_quant', 'analytical_data'],
  technology_integration: ['tech_ai_orientation', 'analytical_data'],
  people_contact: ['oral_pitch', 'teamwork_collab', 'conflict_handling'],
  autonomy: ['autonomy_selfdirection', 'initiative_history'],
  structure_support: ['time_discipline', 'academic_perf'],
  competitive_environment: ['achievement_selectivity', 'resilience_pressure'],
  collaborative_culture: ['teamwork_collab', 'conflict_handling'],
  campus_experience: ['student_life_traditional', 'extracurricular_depth'],
  belonging_support: ['teamwork_collab', 'extracurricular_depth'],
  career_integration: ['market_employability', 'work_experience', 'networking_value'],
  employability_focus: ['market_employability', 'corporate_management'],
  entrepreneurship: ['entrepreneurial_intent', 'entrepreneurial_proof', 'startup_founder_fit'],
  leadership: ['leadership_evidence', 'oral_pitch', 'initiative_history'],
  international_exposure: ['global_mindset', 'english_level', 'mobility_willingness'],
  social_impact: ['purpose_impact'],
  prestige_network: ['brand_prestige', 'networking_value'],
  academic_value_added: ['critical_thinking', 'problem_solving', 'curiosity_learning'],
};

export async function loadProfessionalAreas(fallback: AcademicArea[]): Promise<ProfessionalArea[]> {
  if (!supabase) return fallback.map(toFallbackProfessionalArea);
  try {
    const [
      { data: areas },
      { data: universities },
      { data: profiles },
      { data: weights },
      { data: evidence },
      { data: legacyUniversities },
      { data: legacyWeights },
      { data: legacyEvidence },
    ] = await Promise.all([
      supabase.from('academic_areas').select('area_id,name,courses,description'),
      supabase.from('area_universities').select('*'),
      supabase.from('area_university_dimension_profiles').select('*'),
      supabase.from('area_dimension_priorities').select('*'),
      supabase.from('area_university_evidence').select('area_university_id,confidence'),
      supabase.from('universities').select('*'),
      supabase.from('university_dimension_weights').select('university_id,dimension_id,weight'),
      supabase.from('official_evidence').select('university_id,evidence_id'),
    ]);
    if (!areas?.length || !universities?.length) return fallback.map(toFallbackProfessionalArea);

    const profilesByUniversity = new Map<number, Record<string, { score:number; confidence:number }>>();
    for (const p of profiles ?? []) {
      const id = Number(p.area_university_id);
      const current = profilesByUniversity.get(id) ?? {};
      current[p.dimension_id] = { score: Number(p.score), confidence: Number(p.confidence ?? 0.5) };
      profilesByUniversity.set(id, current);
    }
    const weightsByArea = new Map<string, Record<string, number>>();
    for (const w of weights ?? []) {
      const current = weightsByArea.get(w.area_id) ?? {};
      current[w.dimension_id] = Number(w.weight ?? 1);
      weightsByArea.set(w.area_id, current);
    }
    const evidenceByUniversity = new Map<number, { count:number; avg:number }>();
    for (const e of evidence ?? []) {
      const id = Number(e.area_university_id);
      const current = evidenceByUniversity.get(id) ?? { count:0, avg:0 };
      current.avg = (current.avg * current.count + Number(e.confidence ?? 0.5)) / (current.count + 1);
      current.count += 1;
      evidenceByUniversity.set(id,current);
    }

    const loaded: ProfessionalArea[] = areas.map((a:any) => ({
      id: a.area_id,
      name: a.name,
      courses: a.courses,
      description: a.description,
      dimensionWeights: weightsByArea.get(a.area_id) ?? {},
      universities: universities.filter((u:any)=>u.area_id===a.area_id).map((u:any)=>{
        const p = profilesByUniversity.get(Number(u.area_university_id)) ?? {};
        const evidenceStats = evidenceByUniversity.get(Number(u.area_university_id)) ?? {count:0,avg:0};
        const profileConfidence = Object.values(p).length
          ? Object.values(p).reduce((sum, value) => sum + Number(value.confidence ?? 0.45), 0) / Object.values(p).length
          : Number(u.data_confidence ?? 0.45);
        const specificEvidenceBonus = Math.min(0.08, Math.max(0, evidenceStats.count - 2) * 0.02);
        return {
          id: String(u.area_university_id),
          areaUniversityId: Number(u.area_university_id),
          name: u.university_name,
          course: u.course_label,
          location: u.campus || 'Brasil',
          campus: u.campus,
          modality: u.modality,
          differentiators: Array.isArray(u.differentiators) ? u.differentiators : [],
          highFit: u.high_fit_student || u.positioning || '',
          matchProfile: Object.fromEntries(Object.entries(p).map(([key,value]:any)=>[key,value.score])),
          cpc: u.cpc == null ? null : Number(u.cpc),
          enade: u.enade == null ? null : Number(u.enade),
          idd: u.idd == null ? null : Number(u.idd),
          igc: u.igc == null ? null : Number(u.igc),
          cc: u.cc == null ? null : Number(u.cc),
          regulatoryStatus: u.regulatory_status,
          officialCourseUrl: u.official_course_url,
          curriculumSummary: u.curriculum_summary,
          researchSummary: u.research_summary,
          careerSummary: u.career_summary,
          internationalSummary: u.international_summary,
          scholarshipsSummary: u.scholarships_summary,
          studentExperienceSummary: u.student_experience_summary,
          dataConfidence: Math.round(100 * Math.min(0.8, profileConfidence + specificEvidenceBonus)),
          evidenceCount: evidenceStats.count,
        };
      })
    }));

    const businessIndex = loaded.findIndex((area) => area.name === 'Negócios e Gestão');
    if (businessIndex >= 0 && legacyUniversities?.length) {
      const businessArea = loaded[businessIndex];
      const brBusinessUniversities = legacyUniversities.filter((u:any) => u.country_code === 'BR');
      const weightsByLegacyUniversity = new Map<string, Record<string, number>>();
      for (const row of legacyWeights ?? []) {
        const current = weightsByLegacyUniversity.get(String(row.university_id)) ?? {};
        current[String(row.dimension_id)] = Number(row.weight ?? 60);
        weightsByLegacyUniversity.set(String(row.university_id), current);
      }
      const evidenceCountByLegacyUniversity = new Map<string, number>();
      for (const row of legacyEvidence ?? []) {
        const id = String(row.university_id);
        evidenceCountByLegacyUniversity.set(id, (evidenceCountByLegacyUniversity.get(id) ?? 0) + 1);
      }

      const unifiedBusinessUniversities: ProfessionalUniversity[] = brBusinessUniversities.map((u:any, index:number) => {
        const legacyProfile = weightsByLegacyUniversity.get(String(u.university_id)) ?? {};
        const matchProfile = Object.fromEntries(
          Object.entries(LEGACY_BUSINESS_DIMENSION_MAP).map(([professionalDimension, legacyDimensions]) => {
            const values = legacyDimensions
              .map((dimension) => legacyProfile[dimension])
              .filter((value): value is number => Number.isFinite(value));
            const score = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 60;
            return [professionalDimension, Math.round(score)];
          })
        );
        const evidenceCount = evidenceCountByLegacyUniversity.get(String(u.university_id)) ?? 0;
        const mappedDimensionCount = Object.keys(legacyProfile).length;
        const confidence = Math.min(80, 58 + Math.min(14, evidenceCount * 2) + (mappedDimensionCount >= 20 ? 6 : 0));
        return {
          id: `business-${u.university_id}`,
          areaUniversityId: 900000 + index,
          name: u.name,
          course: u.course || 'Administração',
          location: u.location || 'Brasil',
          campus: u.location || null,
          modality: u.format || null,
          differentiators: String(u.program_differentiators || '')
            .split(';')
            .map((item) => item.trim())
            .filter(Boolean)
            .slice(0, 5),
          highFit: u.high_fit_student || u.positioning || '',
          matchProfile,
          regulatoryStatus: null,
          officialCourseUrl: u.primary_source_url || null,
          curriculumSummary: u.program_differentiators || null,
          researchSummary: null,
          careerSummary: u.match_rationale || u.positioning || null,
          internationalSummary: null,
          scholarshipsSummary: null,
          studentExperienceSummary: u.values || null,
          dataConfidence: confidence,
          evidenceCount,
        };
      });

      loaded[businessIndex] = {
        ...businessArea,
        name: 'Negócios e Gestão ',
        universities: unifiedBusinessUniversities.length ? unifiedBusinessUniversities : businessArea.universities,
      };
    }

    return loaded;
  } catch (error) {
    console.warn('Professional area data unavailable, using curated fallback.', error);
    return fallback.map(toFallbackProfessionalArea);
  }
}

function toFallbackProfessionalArea(area: AcademicArea): ProfessionalArea {
  return {
    ...area,
    dimensionWeights: {},
    universities: area.universities.map((u,index)=>({
      ...u,
      areaUniversityId:index+1,
      dataConfidence:40,
      evidenceCount:0,
    }))
  };
}

export function calculateProfessionalMatches(area: ProfessionalArea, answers: Record<string,number>): ProfessionalMatchResult[] {
  const student: Record<string,number> = {};
  Object.entries(QUESTION_DIMENSION_MAP).forEach(([questionId, dimensionIds]) => {
    const raw = answers[questionId];
    if (raw == null) return;
    dimensionIds.forEach(d => student[d] = raw * 20);
  });
  if (answers.area_depth != null) student.academic_rigor = answers.area_depth * 20;
  if (answers.area_environment != null) student.practical_learning = answers.area_environment * 20;

  return area.universities.map(university => {
    let weightedSimilarity = 0;
    let weightTotal = 0;
    let confidenceWeighted = 0;
    const catScores: Record<keyof ProfessionalMatchResult['breakdown'], {sum:number;weight:number}> = {
      academic:{sum:0,weight:0}, learning:{sum:0,weight:0}, environment:{sum:0,weight:0}, career:{sum:0,weight:0}, globalPurpose:{sum:0,weight:0}
    };
    const deltas: Array<{name:string;similarity:number}> = [];

    for (const [dimension,target] of Object.entries(university.matchProfile)) {
      const studentValue = student[dimension] ?? 60;
      const similarity = Math.max(0, 100 - Math.abs(studentValue - Number(target)));
      const weight = area.dimensionWeights[dimension] ?? 1;
      weightedSimilarity += similarity * weight;
      weightTotal += weight;
      confidenceWeighted += (university.dataConfidence / 100) * weight;
      const category = dimensionCategory(dimension);
      catScores[category].sum += similarity * weight;
      catScores[category].weight += weight;
      deltas.push({name:dimensionLabel(dimension), similarity});
    }

    const fit = weightTotal ? weightedSimilarity / weightTotal : 60;
    const confidence = weightTotal ? Math.round((confidenceWeighted / weightTotal) * 100) : university.dataConfidence;
    const reliabilityPenalty = Math.max(0.82, 0.82 + confidence / 100 * 0.18);
    const score = Math.round(Math.min(98, Math.max(50, fit * reliabilityPenalty)));
    deltas.sort((a,b)=>b.similarity-a.similarity);
    const strengths = deltas.slice(0,3).map(d=>d.name);
    const watchouts = [...deltas].sort((a,b)=>a.similarity-b.similarity).slice(0,2).map(d=>d.name);
    const breakdown = Object.fromEntries(Object.entries(catScores).map(([k,v])=>[k, Math.round(v.weight ? v.sum/v.weight : score)])) as ProfessionalMatchResult['breakdown'];
    return { university, score, confidence, breakdown, strengths, watchouts };
  }).sort((a,b)=>b.score-a.score);
}

function dimensionCategory(id:string): keyof ProfessionalMatchResult['breakdown'] {
  if (['academic_rigor','academic_flexibility','faculty_access','research_intensity','academic_value_added','prestige_network'].includes(id)) return 'academic';
  if (['practical_learning','project_based','quantitative_intensity','technology_integration','theory_orientation'].includes(id)) return 'learning';
  if (['autonomy','belonging_support','campus_experience','collaborative_culture','competitive_environment','people_contact','structure_support'].includes(id)) return 'environment';
  if (['career_integration','employability_focus','entrepreneurship','leadership'].includes(id)) return 'career';
  return 'globalPurpose';
}

function dimensionLabel(id:string) {
  const labels: Record<string,string> = {
    academic_rigor:'rigor acadêmico', academic_flexibility:'flexibilidade curricular', faculty_access:'acesso a professores', research_intensity:'pesquisa',
    practical_learning:'aprendizagem prática', project_based:'projetos', quantitative_intensity:'intensidade quantitativa', technology_integration:'tecnologia e dados', theory_orientation:'base teórica',
    autonomy:'autonomia', belonging_support:'pertencimento e suporte', campus_experience:'experiência universitária', collaborative_culture:'cultura colaborativa', competitive_environment:'ambiente competitivo', people_contact:'contato humano', structure_support:'estrutura e suporte',
    career_integration:'integração com carreira', employability_focus:'empregabilidade', entrepreneurship:'empreendedorismo', leadership:'liderança', international_exposure:'exposição internacional', social_impact:'impacto social', academic_value_added:'valor acadêmico agregado', prestige_network:'marca e rede'
  };
  return labels[id] ?? id.replaceAll('_',' ');
}
