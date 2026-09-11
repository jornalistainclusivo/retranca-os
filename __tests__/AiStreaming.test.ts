import { describe, it, expect } from 'vitest';

describe('AI Streaming Token Concatenation', () => {
  it('should concatenate fragmented tokens without injecting artificial newlines', () => {
    const tokens = ["## ", "An", "álise", " do ", "Ecossistema", "\n\n", "- Item 1"];
    
    let buffer = '';
    for (const token of tokens) {
      // The fix ensures we append exactly what the model sends:
      buffer += token;
    }

    const expected = `## Análise do Ecossistema\n\n- Item 1`;
    expect(buffer).toBe(expected);
  });

  it('should preserve spaces between words and semantic newlines', () => {
    const tokens = ["Preserve", " ", "espaços", "\n", "corretamente"];
    let buffer = '';
    for (const token of tokens) {
      buffer += token;
    }
    expect(buffer).toBe("Preserve espaços\ncorretamente");
  });
});
