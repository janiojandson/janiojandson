import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

/**
 * Script Admin Claude: Reparação Ultra-Robusta (V6 - Persistência Máxima)
 * -----------------------------------------------------------------
 * Este script agora:
 * 1. Corrige ColorDiff (N-API Windows)
 * 2. Injeta Stubs e Skills necessárias
 * 3. Força a abertura do STDIN (mantém o processo vivo no Windows)
 * 4. Monitoriza o evento 'beforeExit' para diagnosticar falhas de renderização
 */

function ensureDirectoryExistence(filePath: string) {
  const dir = dirname(filePath);
  if (existsSync(dir)) return;
  mkdirSync(dir, { recursive: true });
}

function createStub(path: string, content: string) {
  if (!existsSync(path)) {
    console.log(`[🔨 Stub] Criando ficheiro ausente: ${path}`);
    ensureDirectoryExistence(path);
    writeFileSync(path, content);
    console.log(`[✅ Sucesso] Ficheiro criado.`);
  }
}

function fixVerifyContent() {
  const verifyPath = join('skills', 'bundled', 'verifyContent.ts');
  if (existsSync(verifyPath)) {
    let content = readFileSync(verifyPath, 'utf8');
    let modified = false;
    if (!content.includes('export const SKILL_MD')) {
      content += `\nexport const SKILL_MD = '# Verify Content\\nVerification documentation.';`;
      modified = true;
    }
    if (!content.includes('export const SKILL_FILES')) {
      content += `\nexport const SKILL_FILES = [];`;
      modified = true;
    }
    if (modified) {
      writeFileSync(verifyPath, content);
      console.log(`[✅ Sucesso] Skills em verifyContent.ts corrigidas.`);
    }
  }
}

function fixChromeSkill() {
  const chromePath = join('skills', 'bundled', 'claudeInChrome.ts');
  if (existsSync(chromePath)) {
    let content = readFileSync(chromePath, 'utf8');
    if (!content.includes('export const registerClaudeInChromeSkill')) {
      content += `\nexport const registerClaudeInChromeSkill = { name: 'claude_in_chrome', call: async () => ({ content: 'Mocked', isError: false }) };\n`;
      writeFileSync(chromePath, content);
      console.log(`[✅ Sucesso] Chrome Skill injetada.`);
    }
  }
}

function patchMainEntry() {
  const mainPath = 'main.tsx';
  if (existsSync(mainPath)) {
    console.log(`[🔍 Analisando] ${mainPath}`);
    let content = readFileSync(mainPath, 'utf8');
    
    // Limpa diagnósticos antigos para não duplicar
    content = content.replace(/\/\*\* Admin Claude Diagnostics \*\*\/[\s\S]*?\/\*\* End Diagnostics \*\*\//g, '');
    
    const diagnosticHeader = `
/** Admin Claude Diagnostics **/
console.log('[Ignition] Iniciando motor de persistência...');

// Forçar o processo a permanecer vivo (evita fechar no Windows)
process.stdin.resume(); 

const _originalExit = process.exit;
process.exit = (code) => {
  console.log('\\n[TERMINATION] O programa tentou fechar com código:', code);
  if (code !== 0) console.trace('Rastro do encerramento:');
  // Mantemos o processo aberto por 10 segundos para ver os logs
  setTimeout(() => _originalExit(code), 10000);
  return undefined as never;
};

process.on('uncaughtException', (err) => {
  console.error('\\n[FATAL ERROR] Exceção não capturada:', err);
});

process.on('beforeExit', (code) => {
  console.log('[DEBUG] O loop de eventos ficou vazio (Código ' + code + ').');
  console.log('[DEBUG] Se a interface não apareceu, verifique se o Ink.render() foi chamado corretamente.');
});

// Âncora de Vida
const keepAlive = setInterval(() => {}, 60000);

console.log('[Ignition] Carregando lógica do Claude Code...');
/** End Diagnostics **/
`;

    const diagnosticFooter = `
/** Admin Claude Diagnostics **/
console.log('[Ignition] O script main.tsx foi totalmente lido e executado.');
console.log('[Ignition] Pressione Ctrl+C para encerrar manualmente se nada aparecer.');
/** End Diagnostics **/
`;

    writeFileSync(mainPath, diagnosticHeader + content + diagnosticFooter);
    console.log(`[✅ Sucesso] Patches de persistência aplicados ao main.tsx.`);
  }
}

function walk(dir: string) {
  let files: string[] = [];
  try { files = readdirSync(dir); } catch (e) { return; }

  for (const file of files) {
    const path = join(dir, file);
    if (file === 'node_modules' || file === '.git' || file === '.bun') continue;
    
    if (statSync(path).isDirectory()) {
      walk(path);
    } else if (path.endsWith('.ts') || path.endsWith('.tsx')) {
      try {
        const content = readFileSync(path, 'utf8');
        if (content.includes('color-diff-napi')) {
          const namedImportRegex = /import\s*{[\s\S]*?ColorDiff[\s\S]*?}\s+from\s+['"]color-diff-napi['"];?/g;
          if (namedImportRegex.test(content)) {
            const newContent = content.replace(namedImportRegex, () => {
               return `const _ColorDiffModule = require('color-diff-napi');\nconst ColorDiff = _ColorDiffModule.ColorDiff || _ColorDiffModule.default || _ColorDiffModule;`;
            });
            writeFileSync(path, newContent);
            console.log(`[✅ Sucesso] ColorDiff corrigido em: ${path}`);
          }
        }
      } catch (err) {}
    }
  }
}

console.log("==================================================");
console.log("CIRURGIA DE REPARAÇÃO V6: Persistência Máxima");
console.log("==================================================");

createStub(join('types', 'connectorText.ts'), `
export interface ConnectorTextBlock { type: 'text'; connector_text: string; }
export const isConnectorTextBlock = (block: any): block is ConnectorTextBlock => block?.type === 'text' && 'connector_text' in block;
`);

fixVerifyContent();
fixChromeSkill();
patchMainEntry();
walk('.');

console.log("==================================================");
console.log("Procedimento concluído!");
console.log("Execute novamente: bun run main.tsx");
console.log("==================================================");