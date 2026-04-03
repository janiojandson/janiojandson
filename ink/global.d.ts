// Cirurgia Admin Claude: Mock para definições globais da interface Ink
// Este arquivo permite que o TypeScript reconheça elementos JSX no terminal

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [tagName: string]: any;
    }
  }
}

// Garante que o arquivo seja tratado como um módulo
export {};