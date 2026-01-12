import { GoogleGenAI, Type } from "@google/genai";
import { VehicleData } from "../types";

export const analyzeVehicleImage = async (base64Image: string): Promise<VehicleData | null> => {
  try {
    // Fix: Initializing GoogleGenAI with the API key directly from process.env as required by SDK guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image,
            },
          },
          {
            text: "Aja como perito veicular especializado em vistoria e instalação de rastreadores. Extraia rigorosamente os seguintes dados da imagem: Placa (padrão Mercosul AAA0A00 ou antigo AAA-0000), Marca do veículo, Modelo do veículo e IMEI/Número de Serial se visível no rastreador ou equipamento. Retorne APENAS o JSON."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            placa: { type: Type.STRING, description: "A placa do veículo detectada." },
            marca: { type: Type.STRING, description: "Marca do fabricante (ex: Fiat, VW, Ford)." },
            modelo: { type: Type.STRING, description: "Modelo específico (ex: Strada, Gol, Ranger)." },
            imei: { 
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Lista de IMEIs ou Seriais detectados (números de 15 dígitos ou seriais alfanuméricos)."
            },
          },
          required: ["placa", "marca", "modelo", "imei"]
        },
      },
    });

    if (response.text) {
      const parsed = JSON.parse(response.text.trim());
      return {
        placa: parsed.placa || "",
        marca: parsed.marca || "",
        modelo: parsed.modelo || "",
        imei: parsed.imei || []
      };
    }
    return null;
  } catch (error) {
    console.error("AI Service Error:", error);
    return null;
  }
};