import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Generate a product concept image using Gemini
 */
export async function generateProductImage(productIdea) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp-image',
  });

  const prompt = `Create a professional product concept visualization for the following idea:

${productIdea}

Style: Clean, modern, professional product photography style. High quality, well-lit, commercial product shot.`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error('No image generated');
    }

    const candidate = response.candidates[0];
    if (!candidate.content || !candidate.content.parts) {
      throw new Error('Invalid response structure');
    }

    // Find the inline data part
    const imagePart = candidate.content.parts.find(
      (part) => part.inlineData && part.inlineData.mimeType
    );

    if (!imagePart || !imagePart.inlineData) {
      throw new Error('No image data in response');
    }

    return imagePart.inlineData.data;
  } catch (error) {
    console.error('Error generating product image:', error);
    throw error;
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

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
  });

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
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

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
    throw error;
  }
}
