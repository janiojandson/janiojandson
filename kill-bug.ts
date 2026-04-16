import { readFileSync, writeFileSync } from 'fs';

// 1. Corrigir o erro do Commander no main.tsx
let content = readFileSync('main.tsx', 'utf8');
content = content.replace(/'-d2e,\s*--debug-to-stderr'/g, "'--debug-to-stderr'");
writeFileSync('main.tsx', content);

// 2. Criar o ficheiro de arranque definitivo
writeFileSync('index.ts', "import { main } from './main.tsx';\nmain();\n");

console.log('==========================================');
console.log('✅ BUG DO COMMANDER DESTRUÍDO!');
console.log('✅ Ficheiro index.ts (Motor principal) criado!');
console.log('==========================================');
