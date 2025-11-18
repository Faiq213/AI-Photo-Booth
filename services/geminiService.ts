import { GoogleGenAI, Modality } from "@google/genai";
import type { ImageData } from "../types.ts";

// Gracefully handle the case where process.env is not available
const API_KEY = (typeof process !== 'undefined' && process.env?.API_KEY) || '';

let ai: GoogleGenAI | null = null;

function getAi() {
  if (!API_KEY) {
    throw new Error("API_KEY is not configured. Please ensure you are running this in an environment where the API key is provided.");
  }
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
  }
  return ai;
}


const CRITICAL_INSTRUCTIONS = `
**CRITICAL INSTRUCTIONS - YOU MUST FOLLOW THESE RULES:**

1.  **PRESERVE THE PERSON'S FACE AND IDENTITY:** The most important rule is to **NEVER** alter, modify, or distort the person's face, neck, or skin. Their facial features, expression, and identity must be perfectly preserved.

2.  **HANDLE HEADWEAR (HATS):**
    *   Examine the second image (the suit photo). If it includes a hat, you **MUST** place that hat realistically onto the person's head.
    *   The hat should fit naturally, considering the person's hairstyle and head angle. It should cast realistic shadows.
    *   If the second image does **NOT** include a hat, then the person's original hair and head must remain completely untouched and perfectly preserved. Do not add a hat if one isn't provided.

3.  **PRESERVE BACKGROUND & HANDS:** The original background and any visible hands in the person's photo must remain completely unchanged. Do not add, remove, or alter any part of the background or hands.

4.  **SUIT PLACEMENT & POSE ADAPTATION:**
    *   Place the suit onto the person's body. The suit must begin **BELOW** the neck and collar line, never overlapping the chin or neck.
    *   **Crucially, you must adapt the suit to the person's exact pose.** This involves realistically draping, folding, and creasing the fabric to match the person's posture, arm position, and body shape. The suit should not look stiff or pasted on.

5.  **LIGHTING AND SHADOW CORRECTION:**
    *   **This is a critical step.** Analyze the lighting environment of the first image (the person's photo). Note the direction, color, and hardness of the light sources.
    *   You **MUST** re-render the lighting on the suit to perfectly match the person's photo. If the suit photo has different lighting, you must discard it and create new lighting that is consistent with the scene.
    *   Generate realistic shadows cast by the person onto the suit, and by the suit onto the person, to create a seamless and believable composite. The final image must have a single, unified lighting scheme.

**Final Output:** A high-quality image of the original person, with their face, hands, and background perfectly intact, wearing the new suit (and hat, if provided), correctly adapted to their pose and the scene's lighting. Any result that distorts the person's face is a failure.
`;

const CRITICAL_INSTRUCTIONS_SCENE = `
**CRITICAL INSTRUCTIONS - YOU MUST FOLLOW THESE RULES:**

1.  **PRIMARY SUBJECT'S IDENTITY:** This is the most important rule. You must use the person's entire head (face, hair, neck) from the **FIRST** provided image. Their facial features, expression, and complete identity must be perfectly preserved and seamlessly integrated into the new scene.

2.  **INCORPORATE ADDITIONAL IMAGES (if provided):** If more than one image is provided, treat them as context. You can incorporate elements, people, or objects from these additional images into the final scene as described by the user's prompt. For any additional people, also preserve their head and identity perfectly.

3.  **GENERATE NEW BODY AND SCENE:** Based on the user's text description, you must generate a completely new body, pose, clothing, and background for the primary subject. The generated elements must be photorealistic and match the user's prompt.

4.  **SEAMLESS INTEGRATION:** The primary person's head must be attached to the newly generated body in a natural and believable way. Pay close attention to the join at the neck and collar. All incorporated elements should blend seamlessly.

5.  **UNIFIED LIGHTING AND SHADOWS:** Analyze the lighting implied by the user's description (e.g., "at sunset," "in a neon-lit city"). You MUST render the lighting on all preserved heads and incorporated elements to perfectly match the new scene's environment. The final image must have a single, unified lighting scheme, with realistic shadows.

**Final Output:** A high-quality, photorealistic image where the primary person's head is seamlessly placed into a completely new scene. Elements from other images are incorporated as requested. The primary person's identity must be unmistakable.
`;


export const generateSuitImage = async (
  personImage: ImageData,
  suitInput: ImageData | string
): Promise<string | null> => {
  const ai = getAi();
  const model = 'gemini-2.5-flash-image';
  
  const personImagePart = {
    inlineData: {
      data: personImage.base64,
      mimeType: personImage.mimeType,
    },
  };

  let suitImagePart = null;
  let promptText = '';

  if (typeof suitInput === 'string') {
    promptText = `Your task is to imagine and generate a suit based on the user's description and then expertly place it onto the person in the provided image. User's Description: "${suitInput}"\n\n${CRITICAL_INSTRUCTIONS}`;
  } else {
    suitImagePart = {
      inlineData: {
        data: suitInput.base64,
        mimeType: suitInput.mimeType,
      },
    };
    promptText = `Your task is to expertly replace the clothing of the person in the first image with the suit from the second image, creating a single, photorealistic output.\n\n${CRITICAL_INSTRUCTIONS}`;
  }
  
  const textPart = { text: promptText };
  const parts = [
    personImagePart,
    ...(suitImagePart ? [suitImagePart] : []),
    textPart,
  ];

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });
    
    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return part.inlineData.data;
        }
    }

    return null;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to generate image with Gemini API.");
  }
};


export const generateSceneImage = async (
  personImages: ImageData[],
  sceneDescription: string
): Promise<string | null> => {
  const ai = getAi();
  const model = 'gemini-2.5-flash-image';

  const imageParts = personImages.map(image => ({
    inlineData: {
      data: image.base64,
      mimeType: image.mimeType,
    },
  }));

  const promptText = `Your task is to create a new, photorealistic image. Use the person's head from the first image and place them into a scene based on the user's description. If other images are provided, use them as context or to include other subjects as described. User Scene Description: "${sceneDescription}"\n\n${CRITICAL_INSTRUCTIONS_SCENE}`;
  const textPart = { text: promptText };

  const parts = [...imageParts, textPart];

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });
    
    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return part.inlineData.data;
        }
    }

    return null;
  } catch (error) {
    console.error("Error calling Gemini API for scene generation:", error);
    throw new Error("Failed to generate scene with Gemini API.");
  }
};

export const generateLogoImage = async (
  description: string
): Promise<string | null> => {
  const ai = getAi();
  const model = 'imagen-4.0-generate-001';

  const prompt = `A professional, high-quality vector-style logo. The logo is for: "${description}". It should be simple, modern, and memorable, suitable for a brand. Centered on a clean, solid white background. No text unless specified in the description.`;
  
  try {
    const response = await ai.models.generateImages({
      model: model,
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      return response.generatedImages[0].image.imageBytes;
    }

    return null;
  } catch (error) {
    console.error("Error calling Gemini API for logo generation:", error);
    throw new Error("Failed to generate logo with Gemini API.");
  }
};

export const generateGenerativeSceneImage = async (
  description: string
): Promise<string | null> => {
  const ai = getAi();
  const model = 'imagen-4.0-generate-001';

  const prompt = `A photorealistic, high-resolution image of: "${description}". The image should be detailed, with cinematic lighting and a strong sense of atmosphere.`;
  
  try {
    const response = await ai.models.generateImages({
      model: model,
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '16:9',
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      return response.generatedImages[0].image.imageBytes;
    }

    return null;
  } catch (error) {
    console.error("Error calling Gemini API for generative scene:", error);
    throw new Error("Failed to generate scene with Gemini API.");
  }
};
