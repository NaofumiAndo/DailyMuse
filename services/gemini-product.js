import { GoogleGenAI, Modality } from '@google/genai';
import * as dotenv from 'dotenv';

dotenv.config();

const getFirstImageFromResponse = (response) => {
  const candidates = response.candidates;
  if (!candidates || candidates.length === 0) {
    throw new Error("No candidates in response");
  }
  for (const part of candidates[0].content.parts) {
    if (part.inlineData && part.inlineData.data) {
      return part.inlineData.data;
    }
  }
  throw new Error("No image generated.");
};

/**
 * Generate a product concept image using Gemini
 */
export async function generateProductImage(productIdea) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Create a professional product concept visualization for the following idea:

"${productIdea}"

Style Guidelines:
- Clean, modern, professional product photography style
- High quality, well-lit, commercial product shot
- Realistic and detailed
- Professional marketing presentation
- Square format (1:1 aspect ratio)`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
      config: {
        responseModalities: [Modality.IMAGE],
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    return getFirstImageFromResponse(response);
  } catch (error) {
    console.error('Error generating product image:', error);

    if (error?.message?.includes('API key')) {
      throw new Error("Invalid API key. Please check your Gemini API key configuration.");
    } else if (error?.message?.includes('quota') || error?.message?.includes('limit')) {
      throw new Error("API quota exceeded. Please check your billing or try again later.");
    } else if (error?.message?.includes('safety') || error?.message?.includes('blocked')) {
      throw new Error("Content was blocked by safety filters. Try modifying your product idea.");
    }

    throw new Error(error?.message || "Failed to generate product image. Please try again.");
  }
}

/**
 * Analyze product idea: generate pros, cons, and find similar products
 */
export async function analyzeProductIdea(productIdea) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Analyze the following product idea and provide a structured analysis:

Product Idea: ${productIdea}

Please provide your analysis in the following JSON format (respond ONLY with valid JSON, no other text):

{
  "pros": [
    "list of exactly 5 advantages",
    "MUST include comments about market demand",
    "MUST include comments about feasibility",
    "can include other relevant pros"
  ],
  "cons": [
    "list of exactly 5 disadvantages or challenges",
    "MUST include comments about market demand challenges",
    "MUST include comments about feasibility challenges",
    "can include other relevant cons"
  ],
  "similarProducts": [
    "name and brief description of 5 similar existing products or services that can be found online",
    "focus on real, known products that customers can actually find",
    "include product name and what makes it similar"
  ]
}

Important: Ensure the analysis is balanced, realistic, and includes both market demand and technical/operational feasibility perspectives.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt
    });

    // Extract text from response
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error("No response generated");
    }

    let text = '';
    for (const part of candidates[0].content.parts) {
      if (part.text) {
        text += part.text;
      }
    }

    // Extract JSON from response (remove markdown code blocks if present)
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '').trim();
    }

    const analysis = JSON.parse(jsonText);

    // Validate structure
    if (!Array.isArray(analysis.pros) || analysis.pros.length !== 5) {
      throw new Error('Invalid pros format - must be exactly 5 items');
    }
    if (!Array.isArray(analysis.cons) || analysis.cons.length !== 5) {
      throw new Error('Invalid cons format - must be exactly 5 items');
    }
    if (!Array.isArray(analysis.similarProducts) || analysis.similarProducts.length !== 5) {
      throw new Error('Invalid similar products format - must be exactly 5 items');
    }

    return analysis;
  } catch (error) {
    console.error('Error analyzing product idea:', error);

    if (error?.message?.includes('API key')) {
      throw new Error("Invalid API key. Please check your Gemini API key configuration.");
    } else if (error?.message?.includes('quota') || error?.message?.includes('limit')) {
      throw new Error("API quota exceeded. Please check your billing or try again later.");
    }

    throw new Error(error?.message || "Failed to analyze product idea. Please try again.");
  }
}
