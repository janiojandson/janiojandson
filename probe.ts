import * as claude from './main.tsx';
console.log('==========================================');
console.log('🔍 PROBE INICIADO - Analisando main.tsx');
console.log('==========================================');

const exports = Object.keys(claude);
console.log('Funções exportadas:', exports);

let started = false;
for (const key of ['run', 'start', 'cli', 'main', 'default', 'init', 'bootstrap']) {
    if (typeof (claude as any)[key] === 'function') {
        console.log('[✅] Gatilho encontrado: ' + key + '() -> Disparando agora!');
        (claude as any)[key]();
        started = true;
        break;
    }
}

if (!started) console.log('[❌] Nenhum gatilho detectado nas exportações.');
