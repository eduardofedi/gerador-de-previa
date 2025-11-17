import { StickerShape, StickerType, RectangleOrientation } from '../types';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error('Failed to read file as base64 string.'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

const createPrompt = (shape: StickerShape, type: StickerType, orientation: RectangleOrientation): string => {
  let shapeDescription: string;

  if (shape === StickerShape.Rectangle) {
    const orientationDesc =
      orientation === RectangleOrientation.Portrait
        ? 'em orientação de retrato (mais alto do que largo) com proporção 3:4'
        : 'em orientação de paisagem (mais largo do que alto) com proporção 4:3';

    shapeDescription = `retangular ${orientationDesc}`;
  } else {
    shapeDescription = {
      [StickerShape.Round]: 'perfeitamente redondo',
      [StickerShape.Square]: 'perfeitamente quadrado',
    }[shape];
  }

  const typeDescription = {
    [StickerType.Vinyl]:
      'um adesivo de vinil impresso de alta qualidade com acabamento fosco ou semi-brilho.',
    [StickerType.Domed]:
      'um adesivo resinado com cúpula transparente brilhante, com profundidade visível.',
  }[type];

  return `
Você é um designer especialista em adesivos. Gere uma prévia do adesivo seguindo:

Formato: ${shapeDescription}
Tipo: ${typeDescription}

A imagem final deve ter duas camadas:
1) Fundo com marca d’água repetida diagonalmente: "GID Adesivos - 2025 © / Todos os Direitos Reservados"
2) Adesivo limpo, recortado e sem marca d’água por cima.

Preserve completamente o logo enviado. Não altere textos ou elementos.
`.trim();
};

export const generateStickerPreview = async (
  imageFile: File,
  shape: StickerShape,
  type: StickerType,
  orientation: RectangleOrientation
): Promise<string> => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const base64 = await fileToBase64(imageFile);
  const prompt = createPrompt(shape, type, orientation);

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: prompt,
      size: "1024x1024",
      n: 1,
      additional_inputs: {
        image: base64,
      },
    }),
  });

  const data = await response.json();

  if (!data.data || !data.data[0]?.b64_json) {
    console.error("OpenAI Error:", data);
    throw new Error("OpenAI não retornou imagem.");
  }

  return data.data[0].b64_json;
};
