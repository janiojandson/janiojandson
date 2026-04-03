import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

/**
 * Script Admin Claude para corrigir o erro de exportação do ColorDiff
 * Este script percorre o projeto e corrige a sintaxe de importação.
 */

function walk(dir: string) {
  const files = readdirSync(dir);
  for (const file of files) {
    const path = join(dir, file);
    if (file === 'node_modules' || file === '.git') continue;
    
    if (statSync(path).isDirectory()) {
      walk(path);
    } else if (path.endsWith('.ts') || path.endsWith('.tsx')) {
      let content = readFileSync(path, 'utf8');
      if (content.includes("from 'color-diff-napi'") && content.includes('{ ColorDiff }')) {
        console.log(`A corrigir importação em: ${path}`);
        // Altera 'import { ColorDiff } from ...' para a versão compatível
        const newContent = content.replace(
          /import\s*{\s*ColorDiff\s*}\s+from\s+['"]color-diff-napi['"]/g,
          "import ColorDiffPkg from 'color-diff-napi';\nconst { ColorDiff } = ColorDiffPkg;"
        );
        writeFileSync(path, newContent);
      }
    }
  }
}

console.log("A iniciar cirurgia de correção de cores...");
walk('.');
console.log("Concluído! Tente rodar o main.tsx novamente.");