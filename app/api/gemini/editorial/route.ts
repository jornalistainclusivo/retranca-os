import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, topic, text, imageDescription, imageBase64, imageMimeType } = body;

    let prompt = "";
    let systemInstruction = "Você é um assistente sênior de redação do 'Jornalista Inclusivo', especialista em acessibilidade digital (WCAG 2.2), linguagem simples (Plain Language), diversidade, SEO e inteligência artificial para jornalismo.";

    if (action === "generate_alt_text") {
      prompt = `Crie um texto alternativo (Alt Text) para leitor de tela seguindo estritamente o padrão WCAG 2.2 para a seguinte descrição de imagem/tema: "${imageDescription || topic}". Se uma imagem foi fornecida, baseie sua descrição na imagem.
Dê uma sugestão curta (até 120 caracteres) para atributo alt HTML e uma sugestão detalhada para descrição estendida se for um infográfico. Retorne em português de forma clara e objetiva.`;
    } else if (action === "generate_outline") {
      prompt = `Crie um roteiro/esboço de pauta jornalística inclusiva para o tema: "${topic}".
Inclua:
1. Resumo jornalístico (2 frases)
2. Objetivo da matéria
3. 3 sugestões de Palavras-Chave SEO
4. Persona do leitor
5. Chamada para ação (CTA)
6. 3 Perguntas/tópicos essenciais em Linguagem Simples`;
    } else if (action === "check_accessibility") {
      prompt = `Analise o seguinte texto/anotações de pauta sob a ótica de acessibilidade, inclusão e ausência de capacitismo:
"${text}"

Forneça:
1. Avaliação geral de tom e clareza (Linguagem Simples)
2. Eventuais termos capacitistas ou inadequados identificados e suas alternativas inclusivas
3. 2 Dicas rápidas de aprimoramento WCAG/editorial.`;
    } else if (action === "validate_inclusivity") {
      prompt = `Atue como um Validador de Texto Inclusivo. Analise o seguinte texto jornalístico sob a ótica da acessibilidade, linguagem simples (Plain Language), neurodiversidade e jornalismo antirracista/anti-capacitista:
"${text || topic}"

Forneça um relatório estruturado contendo:
1. Avaliação de Linguagem Simples (complexidade de leitura e estrutura).
2. Viés ou Termos Problemáticos (identificação de termos capacitistas, racistas, sexistas ou não inclusivos, com sugestões de substituição).
3. Legibilidade para Neurodiversidade (uso de metáforas, sarcasmo, formatação).
4. Sugestões de Melhoria (em formato de checklist).`;
    } else if (action === "generate_seo") {
      prompt = `Gere sugestões de SEO para a pauta intitulada "${topic}":
1. Título Otimizado (Meta Title com até 60 caracteres)
2. Meta Description (até 155 caracteres)
3. Palavra-chave principal
4. 2 Palavras-chave secundárias LSI`;
    } else {
      prompt = `Responda brevemente fornecendo conselho editorial e de acessibilidade para a pauta: "${topic || text}"`;
    }

    let contents: any = prompt;
    if (imageBase64 && imageMimeType) {
      contents = [
        prompt,
        {
          inlineData: {
            data: imageBase64,
            mimeType: imageMimeType,
          },
        },
      ];
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    return NextResponse.json({ result: response.text });
  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao comunicar com a inteligência artificial." },
      { status: 500 }
    );
  }
}
