// Cirurgia Admin Claude: Neutralizando integração privada do Chrome
export const claudeInChromeSkill = {
  name: 'claude_in_chrome',
  description: 'Integration with Claude in Chrome (Disabled)',
  async call() {
    return {
      data: 'Claude in Chrome is not available in this build.',
      isError: true
    }
  }
}

// Adicionado por Admin Claude para satisfazer dependências do main.tsx
export const registerClaudeInChromeSkill = { name: 'claude_in_chrome', call: async () => ({ content: 'Chrome integration mocked', isError: false }) };
