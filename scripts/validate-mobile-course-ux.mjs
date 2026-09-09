import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const checks = [];
const expect = (condition, label) => {
  checks.push([Boolean(condition), label]);
};

const dashboard = read('src/components/CourseDashboard.tsx');
const gate = read('src/components/AdmissionsPlannerGate.tsx');
const planner = read('src/components/AdmissionsPlannerV11.tsx');
const tutor = read('src/components/AIEducationTutor.tsx');
const css = read('src/components/admissions-planner-v8.css');
const main = read('src/main.tsx');
const html = read('index.html');

expect(dashboard.includes('onOpenCourse:()=>void') && dashboard.includes('onOpenUniversity:()=>void'), 'dashboard exposes dedicated course/faculty edit actions');
expect(dashboard.includes('onClick={onOpenCourse}') && dashboard.includes('onClick={onOpenUniversity}'), 'course and faculty cards no longer route to notes');
expect(dashboard.includes('grid grid-cols-2 gap-2 sm:grid-cols-5'), 'ENEM scores remain readable on narrow screens');
expect(dashboard.includes('pb-[calc(9rem+env(safe-area-inset-bottom))]'), 'dashboard reserves space for mobile nav and safe area');
expect(gate.includes("openPlanner('Hoje','course')") && gate.includes("openPlanner('Hoje','university')") && gate.includes("openPlanner('Hoje','scores')"), 'dashboard taps route to exact planner destinations');
expect(gate.includes("gridTemplateColumns:'repeat(4,minmax(0,1fr))'"), 'mobile navigation is hard-pinned to one row of four items');
expect(gate.includes('<AIEducationTutor mobileDocked />'), 'AI tutor uses course-shell mobile docking');
expect(planner.includes('id="course-target-course"') && planner.includes('id="course-target-university"') && planner.includes('id="planner-scores"'), 'planner exposes stable scroll destinations');
expect(planner.includes('Salvar curso, faculdade e atualizar plano'), 'target save copy describes what is being saved');
expect(/mobileDocked\s*=\s*false/.test(tutor) && tutor.includes('bottom-[calc(78px+env(safe-area-inset-bottom))]'), 'AI floating control clears bottom navigation on mobile');
expect(css.includes('.course-mobile-nav-grid') && css.includes('font-size:16px!important') && css.includes('scroll-margin-top:78px'), 'mobile CSS protects nav, iOS select sizing, and sticky-header scrolling');
expect(main.includes("@vercel/speed-insights/react") && main.includes('<SpeedInsights />'), 'Vercel Speed Insights is mounted');
expect(html.includes('viewport-fit=cover'), 'viewport supports iPhone safe areas');

const failed = checks.filter(([ok]) => !ok);
for (const [ok, label] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
if (failed.length) {
  console.error(`Mobile UX validation failed: ${failed.length} check(s).`);
  process.exit(1);
}
console.log(`Mobile UX validation passed: ${checks.length} checks.`);
