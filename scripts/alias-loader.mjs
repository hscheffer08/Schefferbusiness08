import { pathToFileURL } from 'node:url';
import { resolve as resolvePath } from 'node:path';
import { existsSync } from 'node:fs';

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const base = resolvePath(process.cwd(), 'src', specifier.slice(2));
    const candidates = [base, `${base}.ts`, `${base}.tsx`, resolvePath(base, 'index.ts'), resolvePath(base, 'index.tsx')];
    const match = candidates.find(existsSync);
    if (!match) throw new Error(`Unable to resolve alias ${specifier}`);
    return { url: pathToFileURL(match).href, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
