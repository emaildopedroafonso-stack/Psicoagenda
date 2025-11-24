import { GoogleGenAI } from "@google/genai";

export const generateFinancialInsight = async (
  month: string,
  totalExpected: number,
  totalReceived: number,
  pendingSessions: number,
  absentCount: number
): Promise<string> => {
  try {
    // Safety check for API key presence, although prompt says assume valid.
    if (!process.env.API_KEY) {
      return "Chave de API não configurada. Não é possível gerar insights.";
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
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