
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeDentalCase = async (symptoms: string, history: string[]) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `
        Eres un asistente experto para odontólogos. Analiza el siguiente caso clínico:
        SÍNTOMAS: ${symptoms}
        HISTORIAL PREVIO: ${history.join(", ")}
        
        Proporciona:
        1. Posibles diagnósticos diferenciales.
        2. Recomendaciones de pruebas adicionales (Radiografías, pruebas de vitalidad, etc.).
        3. Propuesta de plan de tratamiento preliminar.
        4. Advertencias o precauciones críticas.
        
        Responde en formato profesional médico con un tono tranquilizador y técnico.
      `,
      config: {
        temperature: 0.7,
        thinkingConfig: { thinkingBudget: 2000 }
      },
    });

    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Lo sentimos, el asistente de IA no está disponible en este momento. Por favor, verifique su conexión o intente más tarde.";
  }
};

export const getSmartSummary = async (patientData: any) => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Eres un odontólogo senior. Resume de forma concisa el estado clínico de este paciente para un cambio de turno entre especialistas. Destaca alergias, tratamientos pendientes y riesgos.
        DATOS DEL PACIENTE: ${JSON.stringify(patientData)}`,
        config: {
          temperature: 0.3,
          thinkingConfig: { thinkingBudget: 0 }
        },
      });
      return response.text;
    } catch (error) {
      return "No se pudo generar el resumen clínico inteligente.";
    }
}

export const summarizeHistoryForm = async (formData: any) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Eres un odontólogo senior redactando una nota de evolución. 
        A partir de los siguientes datos de una historia clínica estomatológica, genera un resumen clínico profesional de un párrafo (máximo 150 palabras).
        Enfócate en: hallazgos más relevantes, riesgos por antecedentes y estado de oclusión.
        
        DATOS: ${JSON.stringify(formData)}
      `,
      config: {
        temperature: 0.4,
        thinkingConfig: { thinkingBudget: 500 }
      },
    });
    return response.text;
  } catch (error) {
    return "Error al procesar el resumen automático de la ficha.";
  }
};
