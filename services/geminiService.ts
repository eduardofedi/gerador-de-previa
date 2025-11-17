import { StickerShape, StickerType, RectangleOrientation } from '../types';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error('Failed to read file as base64.'));
      }
    };
    reader.onerror = reject;
  });
};

const createPrompt = (
  shape: StickerShape,
  type: StickerType,
  orientation: RectangleOrientation
): string => {
  let shapeDescription: string;

  if (shape === StickerShape.Rectangle) {
    shapeDescription =
      orientation === RectangleOrientation.Portrait
        ? 'retangular em retrato (3:4)'
        : 'retangular em paisagem (4:3)';
  } else {
    shapeDescription = {
      [StickerShape.Round]: 'perfeitamente redondo',
      [StickerShape.Square]: 'perfeitamente quadrado',
    }[shape];
  }

  const typeDescription = {
    [StickerType.Vinyl]:
      'um adesivo de vinil de alta qualidade, fosco/semi-brilho, corte preciso',
    [StickerType.Domed]:
      'um adesivo resinado (alto relevo) com cúpula brilhante e bordas suaves',
  }[type];

  return `
Converta a imagem enviada em uma prévia profissional de adesivo.

Regras:
- NÃO altere nenhum texto, logotipo ou identidade.
- Formato: ${shapeDescription}
- Tipo: ${typeDescription}

A saída final deve ter duas camadas:

1) Fundo: padrão diagonal repetindo
   "GID Adesivos - 2025 © / Todos os Direitos Reservados"
   em cinza claro.

2) Adesivo: limpo, nítido, sem marca d’água.

Gere uma imagem final em alta resolução.`;
};

export const generateStickerPreview = async (
  imageFile: File,
  shape: StickerShape,
  type: StickerType,
  orientation: RectangleOrientation
): Promise<string> => {

  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Falta a variável VITE_OPENAI_API_KEY");
  }

  const base64Image = await fileToBase64(imageFile);
  const prompt = createPrompt(shape, type, orientation);

  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: prompt,
      image: base64Image
    }),
  });

  const data = await response.json();

  if (!data?.data?.[0]?.b64_json) {
    console.log("OpenAI Error:", data);
    throw new Error("OpenAI não retornou imagem.");
  }

  return data.data[0].b64_json;
};
