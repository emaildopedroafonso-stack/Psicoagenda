import { GoogleGenAI } from "@google/genai";

// Helper function to safely read environment variables
const getEnv = (key: string) => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    // @ts-ignore
    return import.meta.env[key];
  }
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return undefined;
};

export const generateFinancialInsight = async (
  month: string,
  totalExpected: number,
  totalReceived: number,
  pendingSessions: number,
  absentCount: number
): Promise<string> => {
  try {
    // Chave obtida exclusivamente via variável de ambiente, conforme solicitado.
    // Tenta ler de várias fontes para garantir compatibilidade
    const apiKey = getEnv('API_KEY') || getEnv('VITE_API_KEY') || getEnv('REACT_APP_API_KEY');

    if (!apiKey) {
      console.warn("Gemini API Key missing.");
      return "Configure a API Key para receber insights inteligentes.";
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    const prompt = `
      Você é um assistente financeiro para um psicólogo. Analise os dados deste mês (${month}):
      - Faturamento Previsto: R$ ${totalExpected.toFixed(2)}
      - Recebido até agora: R$ ${totalReceived.toFixed(2)}
      - Sessões pendentes de pagamento: ${pendingSessions}
      - Faltas de pacientes: ${absentCount}

      Forneça um resumo curto (máximo 3 frases) com uma dica financeira ou de gestão de pacientes, em tom profissional e encorajador.
      Não use formatação markdown complexa, apenas texto corrido.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Não foi possível gerar o insight no momento.";
  } catch (error) {
    console.error("Erro ao chamar Gemini:", error);
    return "O assistente virtual está indisponível no momento.";
  }
};
