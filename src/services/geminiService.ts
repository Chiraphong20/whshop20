import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateProductDescription = async (productName: string, category: string): Promise<string> => {
  if (!apiKey) return "Please configure API_KEY to use AI features.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Write a short, catchy, marketing description (in Thai) for a product named "${productName}" in the category "${category}". Keep it under 2 sentences.`,
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Could not generate description.";
  }
};

export const generatePostCaption = async (productNames: string[]): Promise<string> => {
  if (!apiKey) return "Please configure API_KEY to use AI features.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Write a promotional social media post caption (in Thai) announcing the arrival of these new products: ${productNames.join(', ')}. Use emojis and make it exciting.`,
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Could not generate caption.";
  }
};
