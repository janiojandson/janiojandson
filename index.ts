import * as readline from 'readline';
import { spawn } from 'child_process';

const args = process.argv.slice(2);

// =====================================================================
// [MODO TRABALHADOR] - O Motor que Executa as Ferramentas
// =====================================================================
if (args[0] === '--worker') {
    
    globalThis.MACRO = { VERSION: '1.0.0-leaked' };
    process.env.FORCE_COLOR = '1';
    process.env.CLAUDE_CODE_DISABLE_TELEMETRY = 'true';
    process.env.ANTHROPIC_API_KEY = 'sk-ant-fake-key-bypass';
    
    // A SUA CHAVE GROQ
    const apiKey = process.env.GROQ_API_KEY;

    Object.defineProperty(process.stdout, 'isTTY', { value: false });
    Object.defineProperty(process.stdin, 'isTTY', { value: true });

    function triturarDescricoes(schema: any): any {
        if (!schema || typeof schema !== 'object') return schema;
        if (Array.isArray(schema)) return schema.map(triturarDescricoes);
        
        const cleaned: any = {};
        for (const [key, value] of Object.entries(schema)) {
            if (['description', 'title', 'examples', 'default'].includes(key)) continue;
            cleaned[key] = triturarDescricoes(value);
        }
        return cleaned;
    }

    let lastGroqCallTime = 0;

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input: any, init?: any) => {
        const url = typeof input === 'string' ? input : input?.url;
        
        if (url && (url.includes('api.anthropic.com') || url.includes('telemetry'))) {
            if (url.includes('/v1/messages')) {
                
                // Freio Anti-Pânico para recarregar tokens do Groq (12 segundos)
                const now = Date.now();
                const timeSinceLastCall = now - lastGroqCallTime;
                if (lastGroqCallTime > 0 && timeSinceLastCall < 12000) {
                    const waitTime = 12000 - timeSinceLastCall;
                    console.log(`\n   [⏳] IA a respirar durante ${Math.round(waitTime/1000)}s para não esgotar a cota...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }
                lastGroqCallTime = Date.now();

                const bodyStr = init?.body ? init.body.toString() : "{}";
                const claudeReq = JSON.parse(bodyStr);

                const openaiMessages: any[] = [];
                
                // 💻 DIRETRIZ WINDOWS MÁXIMA 💻
                openaiMessages.push({ 
                    role: "system", 
                    content: "You are a Windows PowerShell expert AI. RULE 1: ONLY use Windows CMD/PowerShell commands. RULE 2: Use ONE 'Bash' tool call to do everything at once. Do NOT use Glob." 
                });

                // 🐟 MEMÓRIA DE PEIXE: Guarda apenas o último passo (slice(-2)) para o pacote ser ultra-leve!
                const mensagensRecentes = claudeReq.messages.slice(-2);

                mensagensRecentes.forEach((m: any) => {
                    if (typeof m.content === 'string') {
                        openaiMessages.push({ role: m.role, content: m.content });
                    } else {
                        let textContent = "";
                        let toolCalls: any[] = [];

                        m.content.forEach((c: any) => {
                            if (c.type === 'text') textContent += c.text + "\n";
                            if (c.type === 'tool_use') {
                                toolCalls.push({
                                    id: c.id,
                                    type: "function",
                                    function: { name: c.name, arguments: JSON.stringify(c.input) }
                                });
                            }
                            if (c.type === 'tool_result') {
                                let resText = typeof c.content === 'string' ? c.content : JSON.stringify(c.content);
                                // Trunca erros para 300 caracteres (não precisamos ler o erro todo)
                                if (resText.length > 300) resText = resText.substring(0, 300) + "...[trunc]";
                                
                                openaiMessages.push({
                                    role: "tool",
                                    tool_call_id: c.tool_use_id,
                                    content: resText
                                });
                            }
                        });

                        if (m.role === 'assistant') {
                            let msg: any = { role: "assistant" };
                            if (textContent) msg.content = textContent.trim();
                            if (toolCalls.length > 0) msg.tool_calls = toolCalls;
                            if (msg.content || msg.tool_calls) openaiMessages.push(msg);
                        } else if (m.role === 'user') {
                            if (textContent.trim()) openaiMessages.push({ role: "user", content: textContent.trim() });
                        }
                    }
                });

                const openaiTools = claudeReq.tools ? claudeReq.tools.map((t: any) => ({
                    type: "function",
                    function: {
                        name: t.name,
                        description: t.description ? t.description.substring(0, 30) : "",
                        parameters: triturarDescricoes(t.input_schema)
                    }
                })) : undefined;

                const apiKey = process.env.GROQ_API_KEY;
                const groqUrl = `https://api.groq.com/openai/v1/chat/completions`;
                
                try {
                    const groqRes = await originalFetch(groqUrl, {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${apiKey}`
                        },
                        body: JSON.stringify({
                            model: "llama-3.1-8b-instant",
                            messages: openaiMessages,
                            tools: openaiTools,
                            temperature: 0.1 
                        })
                    });
                    
                    const groqData = await groqRes.json();
                    
                    const anthropicContent: any[] = [];
                    let stop_reason = "end_turn";
                    
                    if (groqData.choices && groqData.choices[0].message) {
                        const choiceMsg = groqData.choices[0].message;
                        
                        if (choiceMsg.content) {
                            anthropicContent.push({ type: "text", text: choiceMsg.content });
                        }
                        
                        if (choiceMsg.tool_calls) {
                            choiceMsg.tool_calls.forEach((tc: any) => {
                                console.log(`   [🛠️] O Cérebro ativou a ferramenta: ${tc.function.name}`);
                                anthropicContent.push({
                                    type: "tool_use",
                                    id: tc.id,
                                    name: tc.function.name,
                                    input: JSON.parse(tc.function.arguments)
                                });
                            });
                            stop_reason = "tool_use";
                        }
                    } else {
                        anthropicContent.push({ type: "text", text: "Erro na API do Groq: " + JSON.stringify(groqData) });
                    }

                    const fakeResponse = {
                        id: "msg_groq_" + Date.now(),
                        type: "message",
                        role: "assistant",
                        content: anthropicContent,
                        model: "llama-3.1-8b-instant",
                        stop_reason: stop_reason,
                        usage: { input_tokens: 10, output_tokens: 10 }
                    };

                    return new Response(JSON.stringify(fakeResponse), { status: 200, headers: { 'Content-Type': 'application/json' } });
                } catch (err) {
                    console.error("Erro no tradutor:", err);
                    return new Response(JSON.stringify({}), { status: 500 });
                }
            }
            return new Response(JSON.stringify({}), { status: 200 });
        }
        return originalFetch(input, init);
    };

    const comandoUsuario = args.slice(1).join(' ');
    process.argv = ['node', 'claude', '-p', '--dangerously-skip-permissions', comandoUsuario];
    import('./main.tsx').then(Motor => Motor.main()).catch(() => process.exit(1));

} 
// =====================================================================
// [MODO MESTRE] - O Terminal indestrutível que interage consigo
// =====================================================================
else {
    console.clear();
    console.log('\n================================================');
    console.log(' 🧠 TERMINAL CLAUDE (Llama 3.1 8B - MODO WINDOWS)');
    console.log('================================================');
    console.log(' [Dica] Otimizado para PowerShell. Resfriamento ativo ligado.');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const ask = () => {
        rl.question('\n[Você] > ', (comando) => {
            if (comando.toLowerCase() === 'sair' || comando.toLowerCase() === 'exit') {
                console.log('A desligar os servidores...');
                process.exit(0);
            }

            if (comando.trim() === '') return ask();

            console.log(' ⚙️  A processar o seu pedido...\n');

            const bunPath = process.execPath;
            const child = spawn(bunPath, ['run', 'index.ts', '--worker', comando], {
                stdio: 'inherit',
                shell: process.platform === 'win32'
            });

            child.on('close', (code) => {
                setTimeout(ask, 500);
            });
        });
    };

    ask();
}