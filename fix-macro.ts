import { readFileSync, writeFileSync } from 'fs';

let content = readFileSync('main.tsx', 'utf8');
if (!content.includes('const MACRO = {')) {
    content = 'const MACRO = { VERSION: \"1.0.0-leaked\" };\n' + content;
    writeFileSync('main.tsx', content);
}

console.log('==========================================');
console.log('✅ VARIÁVEL MACRO INJETADA COM SUCESSO!');
console.log('==========================================');
