import { GoogleGenAI, Modality } from "@google/genai";
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

export const generateStoryIllustration = async (narration, characterRefBase64 = null, artStyle = null) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("API key not configured. Please set your GEMINI_API_KEY environment variable.");
  }

  const ai = new GoogleGenAI({ apiKey });

  let characterInstruction = "";
  let styleInstruction = "";
  let contents = [];

  // Build style instruction
  if (artStyle && artStyle.trim()) {
    styleInstruction = `\n\nArt Style: ${artStyle}`;
  } else {
    styleInstruction = `\n\nStyle Guidelines:
- Detailed anime/manga aesthetic
- Expressive characters and atmosphere
- Cinematic composition
- Rich colors and clean linework`;
  }

  if (characterRefBase64) {
    // Extract base64 data
    const base64Data = characterRefBase64.includes(',')
      ? characterRefBase64.split(',')[1]
      : characterRefBase64;

    // Determine mime type
    const mimeType = characterRefBase64.match(/data:(image\/[a-zA-Z]*);/)?.[1] || 'image/jpeg';

    characterInstruction = "Use the character shown in the reference image as the main character in this scene. Maintain consistent appearance, clothing style, and features.";

    contents = [
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      },
      narration + "\n\n" + characterInstruction + styleInstruction
    ];
  } else {
    contents = narration;
  }

  const prompt = characterRefBase64
    ? contents
    : `Create an illustration for this story scene:

"${narration}"
${styleInstruction}
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
    console.error("Story Illustration Generation Error:", error);

    if (error?.message?.includes('API key')) {
      throw new Error("Invalid API key. Please check your Gemini API key configuration.");
    } else if (error?.message?.includes('quota') || error?.message?.includes('limit')) {
      throw new Error("API quota exceeded. Please check your billing or try again later.");
    } else if (error?.message?.includes('safety') || error?.message?.includes('blocked')) {
      throw new Error("Content was blocked by safety filters. Try modifying your narration.");
    }

    throw new Error(error?.message || "Failed to generate illustration. Please try again.");
  }
};
