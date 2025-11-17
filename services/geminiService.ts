import OpenAI from "openai";
import { StickerShape, StickerType, RectangleOrientation } from "../types";

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result.split(",")[1]);
      } else {
        reject(new Error("Failed to read file as base64 string."));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

const createPrompt = (
  shape: StickerShape,
  type: StickerType,
  orientation: RectangleOrientation
): string => {

  let shapeDescription: string;

  if (shape === StickerShape.Rectangle) {
    const orientationDesc =
      orientation === RectangleOrientation.Portrait
        ? "em orientação retrato (3:4)"
        : "em orientação paisagem (4:3)";
    shapeDescription = `formato retangular ${orientationDesc}`;
  } else {
    shapeDescription =
      {
        [StickerShape.Round]: "formato redondo perfeito",
        [StickerShape.Square]: "formato quadrado perfeito",
      }[shape] || "formato personalizado";
  }

  const typeDescription =
    {
      [StickerType.Vinyl]:
        "adesivo de vinil impresso com acabamento fosco ou semi-brilho",
      [StickerType.Domed]:
        "adesivo resinado (alto relevo) com cúpula de poliuretano transparente e brilhante",
    }[type] || "";

  return `
    Gere uma prévia realista de um adesivo em ${shapeDescription}.
    O adesivo deve ter: ${typeDescription}.

    Fundo: padrão diagonal repetitivo com a frase:
    'GID Adesivos - 2025 © / Todos os Direitos Reservados'
    O adesivo NÃO pode ter marca d'água por cima, apenas o fundo.

    A imagem enviada deve ser tratada, fundo removido e centralizada.
  `;
};

export const generateStickerPreview = async (
  imageFile: File,
  shape: StickerShape,
  type: StickerType,
  orientation: RectangleOrientation
): Promise<string> => {
  
  const client = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  });

  const base64 = await fileToBase64(imageFile);
  const prompt = createPrompt(shape, type, orientation);

  const result = await client.images.generate({
    model: "gpt-image-1",
    prompt: prompt,
    size: "1024x1024",
    image: base64, // usado como "referência"
  });

  const imageBase64 = result.data[0].b64_json;

  if (!imageBase64) {
    throw new Error("OpenAI não retornou imagem.");
  }

  return imageBase64;
};
