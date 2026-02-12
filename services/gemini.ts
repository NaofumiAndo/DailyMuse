import { GoogleGenAI, Modality } from "@google/genai";
import { DailyComicTemplate } from '../types';

const getFirstImageFromResponse = (response: any): string => {
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
}

export const generateTitleImage = async (title: string, number: string, characterDescription: string): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("API key not configured. Please set your GEMINI_API_KEY environment variable.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const charInstruction = characterDescription
    ? `Feature this character in the illustration: ${characterDescription}`
    : "";

  const prompt = `Output a colored square concept image with the following text in the middle as a title: "${title}".
-Surround the text with decorations so that it expresses the content in the title.
-Be sure to include the given number above the title: "${number}"
-Create an image in a detailed anime aesthetic: smooth cel-shaded coloring, and clean linework or atmosphere typical of anime scenes.
${charInstruction}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: prompt,
      config: {
        responseModalities: [Modality.IMAGE],
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      }
    });

    return getFirstImageFromResponse(response);
  } catch (error: any) {
    console.error("Title Generation Error:", error);

    // Provide more helpful error messages
    if (error?.message?.includes('API key')) {
      throw new Error("Invalid API key. Please check your Gemini API key configuration.");
    } else if (error?.message?.includes('quota') || error?.message?.includes('limit')) {
      throw new Error("API quota exceeded. Please check your billing or try again later.");
    } else if (error?.message?.includes('safety') || error?.message?.includes('blocked')) {
      throw new Error("Content was blocked by safety filters. Try modifying your prompt.");
    }

    throw new Error(error?.message || "Failed to generate title image. Please try again.");
  }
};

export const generateComic = async (
  concept: string,
  characterDescription: string
): Promise<{ imageData: string; fullPrompt: string }> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("API key not configured. Please set your GEMINI_API_KEY environment variable.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const charInstruction = characterDescription
    ? `Main Character Appearance: ${characterDescription}. Ensure this character is the main figure.`
    : "";

  const prompt = `Prompt for 4-Panel Comic Generation
You are tasked with creating a colored 4-panel comic for a presentation to your boss. Follow the structured steps below carefully to ensure the comic is accurate, polished, and visually clear.

Step 1: Generate the Comic Based on the Rules
Use the content provided to create a comic that visually explains the concept across four equally sized square panels.
Rules:
• Output a square image (aspect ratio 1:1).
• Use white (RGB 255, 255, 255) as the background color.
• Visually represent all the content provided by your boss.
• Show the exact sentences in the content provided from your boss as text (Speech bubble or narration) in the image.
• One sentence represents one panel. Number each panels on the top left corner from 1 to 4 in order of the sentence.
• Ensure the text and illustrations are scaled appropriately to fit neatly within each panel.
• Use "CC Wild Words" as the default font.
Illustration Guidelines:
• Include illustrations that make the message easy to understand.
• Create an image in a detailed japanese style anime aesthetic: expressive eyes, smooth cel-shaded coloring, and clean linework. Emphasize emotion and character presence, with a sense of motion or atmosphere typical of anime scenes.
• ${charInstruction}
• Use various angles to describe the character.

Step2:Once the image is generated, review and revise the image from a 3rd party perspective against the following checkpoints:
	• The output image is square-shaped (1:1 ratio).
	• No spelling mistakes.
  • No grammar mistakes.
  • It is a sentence written by a native english speaker.

Content from Your Boss:
"${concept}"`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: prompt,
      config: {
        responseModalities: [Modality.IMAGE],
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      }
    });

    const imageData = getFirstImageFromResponse(response);

    return {
      imageData,
      fullPrompt: prompt
    };
  } catch (error: any) {
    console.error("Comic Generation Error:", error);

    // Provide more helpful error messages
    if (error?.message?.includes('API key')) {
      throw new Error("Invalid API key. Please check your Gemini API key configuration.");
    } else if (error?.message?.includes('quota') || error?.message?.includes('limit')) {
      throw new Error("API quota exceeded. Please check your billing or try again later.");
    } else if (error?.message?.includes('safety') || error?.message?.includes('blocked')) {
      throw new Error("Content was blocked by safety filters. Try modifying your prompt.");
    }

    throw new Error(error?.message || "Failed to generate comic. Please try again.");
  }
};

export const editExistingImage = async (
  currentImageBase64: string,
  editInstructions: string
): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("API key not configured. Please set your GEMINI_API_KEY environment variable.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Extract base64 data (remove data:image/jpeg;base64, prefix if present)
  const base64Data = currentImageBase64.replace(/^data:image\/\w+;base64,/, '');

  const prompt = `You are an expert image editor. The user has a 4-panel comic image and wants you to make specific edits to fix issues.

EDIT INSTRUCTIONS:
${editInstructions}

Your task:
1. Analyze the current 4-panel comic image carefully
2. Apply ONLY the specific edits requested in the instructions above
3. Keep everything else exactly the same - same layout, same characters, same style, same panels
4. Generate a new version of the image with ONLY those specific changes applied

Important:
- Do NOT redesign or recreate the entire image
- Do NOT change the overall concept or layout
- ONLY fix the specific issues mentioned in the instructions
- Maintain the exact same 1:1 square aspect ratio
- Keep the same anime art style and visual quality`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Data
              }
            }
          ]
        }
      ],
      config: {
        responseModalities: [Modality.IMAGE],
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      }
    });

    return getFirstImageFromResponse(response);
  } catch (error: any) {
    console.error("Image Edit Error:", error);

    if (error?.message?.includes('API key')) {
      throw new Error("Invalid API key. Please check your Gemini API key configuration.");
    } else if (error?.message?.includes('quota') || error?.message?.includes('limit')) {
      throw new Error("API quota exceeded. Please check your billing or try again later.");
    } else if (error?.message?.includes('safety') || error?.message?.includes('blocked')) {
      throw new Error("Content was blocked by safety filters. Try modifying your instructions.");
    }

    throw new Error(error?.message || "Failed to edit image. Please try again.");
  }
};

export const generateDailyComic = async (
  template: DailyComicTemplate
): Promise<{ imageData: string; fullPrompt: string }> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("API key not configured. Please set your GEMINI_API_KEY environment variable.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const panelCount = template.panels.length;

  // Build panel descriptions dynamically
  const panelDescriptions = template.panels.map((panel, index) => {
    const dialogueText = panel.dialogues.length > 0
      ? panel.dialogues.map(d => `${d.character}: "${d.text}"`).join('\n    ')
      : 'No dialogue';

    return `Panel ${index + 1}:
  - Framing: ${panel.framing}
  - Situation: ${panel.situation}
  - ${template.characterAName}: ${panel.characterAExplanation}
  - ${template.characterBName}: ${panel.characterBExplanation}
  - Background: ${panel.background}
  - Dialogues:
    ${dialogueText}`;
  }).join('\n\n');

  const prompt = `Task: Generate a comic strip with EXACTLY ${panelCount} panels featuring ONLY two characters.

CRITICAL REQUIREMENTS:
1. The output image MUST contain EXACTLY ${panelCount} panels - no more, no less. Each panel should be clearly separated and numbered from 1 to ${panelCount}.
2. ONLY show ${template.characterAName} and ${template.characterBName} in the comic. Do NOT add any other characters, people, or anthropomorphic figures unless explicitly mentioned in the background description.

Character References (see attached images):
- Image 1: ${template.characterAName} (Character A) - Use this EXACT appearance for ${template.characterAName}. This is the ONLY design for this character.
- Image 2: ${template.characterBName} (Character B) - Use this EXACT appearance for ${template.characterBName}. This is the ONLY design for this character.

CHARACTER RESTRICTION: The comic must feature ONLY these two characters (${template.characterAName} and ${template.characterBName}). No other characters should appear unless specifically mentioned in a panel's background field.

Panel Layout Requirements:
- Total panels: EXACTLY ${panelCount}
- Arrange panels in a grid layout within the square image
- Number each panel clearly (1, 2, 3${panelCount > 3 ? `, ... ${panelCount}` : ''})
- All ${panelCount} panels must be visible and complete

Panels:
${panelDescriptions}

Technical Constraints:
${template.technicalConstraints}

Art Style Details:
${template.artStyleDetails}

FINAL REMINDER:
- Output MUST have EXACTLY ${panelCount} panels
- ONLY ${template.characterAName} and ${template.characterBName} should appear (no other characters)`;

  // Extract base64 data from both character reference images
  const charARefBase64 = template.characterARefImage.replace(/^data:image\/\w+;base64,/, '');
  const charBRefBase64 = template.characterBRefImage.replace(/^data:image\/\w+;base64,/, '');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: charARefBase64
              }
            },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: charBRefBase64
              }
            }
          ]
        }
      ],
      config: {
        responseModalities: [Modality.IMAGE],
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      }
    });

    const imageData = getFirstImageFromResponse(response);

    return {
      imageData,
      fullPrompt: prompt
    };
  } catch (error: any) {
    console.error("Daily Comic Generation Error:", error);

    if (error?.message?.includes('API key')) {
      throw new Error("Invalid API key. Please check your Gemini API key configuration.");
    } else if (error?.message?.includes('quota') || error?.message?.includes('limit')) {
      throw new Error("API quota exceeded. Please check your billing or try again later.");
    } else if (error?.message?.includes('safety') || error?.message?.includes('blocked')) {
      throw new Error("Content was blocked by safety filters. Try modifying your prompt.");
    }

    throw new Error(error?.message || "Failed to generate daily comic. Please try again.");
  }
};

export const refinePromptWithFeedback = async (
  currentPrompt: string,
  feedback: string
): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("API key not configured. Please set your GEMINI_API_KEY environment variable.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const refinementPrompt = `You are helping a comic creator refine their 4-panel comic concept prompt.

Current Prompt:
"${currentPrompt}"

Creator's Feedback:
"${feedback}"

Based on the feedback, generate an improved version of the prompt that addresses the creator's concerns and suggestions. Keep the same overall structure and intent, but incorporate the feedback to make it clearer, more specific, or better aligned with their vision.

Return ONLY the refined prompt text, nothing else. Do not include explanations or meta-commentary.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: refinementPrompt
    });

    const refinedPrompt = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!refinedPrompt) {
      throw new Error("No refined prompt generated");
    }

    return refinedPrompt;
  } catch (error: any) {
    console.error("Prompt Refinement Error:", error);

    if (error?.message?.includes('API key')) {
      throw new Error("Invalid API key. Please check your Gemini API key configuration.");
    } else if (error?.message?.includes('quota') || error?.message?.includes('limit')) {
      throw new Error("API quota exceeded. Please check your billing or try again later.");
    }

    throw new Error(error?.message || "Failed to refine prompt. Please try again.");
  }
};