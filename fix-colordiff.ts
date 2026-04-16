import { readFileSync, writeFileSync } from 'fs';

const targetFile = 'components/StructuredDiff.tsx';

try {
    let content = readFileSync(targetFile, 'utf8');
    const originalLength = content.length;
    
    // Procura por new ColorDiff(...) mesmo que tenha quebras de linha
    content = content.replace(/new ColorDiff\([\s\S]*?\)/g, "({ render: () => null })");
    
    if (content.length !== originalLength) {
        writeFileSync(targetFile, content);
        console.log('==========================================');
        console.log('✅ CLASSE ColorDiff DESTRUÍDA NO FICHEIRO CORRETO!');
        console.log('==========================================');
    } else {
        console.log('⚠️ Nenhuma chamada encontrada. O ficheiro já pode estar corrigido.');
    }
} catch (e) {
    console.error('❌ Erro ao procurar o ficheiro:', e.message);
}
