import OpenAI from "openai";
import { StickerShape, StickerType, RectangleOrientation } from '../types';

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
        ? "em orientação de retrato (3:4)"
        : "em orientação de paisagem (4:3)";
    shapeDescription = `retangular ${orientationDesc}`;
  } else {
    shapeDescription = {
      [StickerShape.Round]: "perfeitamente redondo",
      [StickerShape.Square]: "perfeitamente quadrado",
    }[shape];
  }

  const typeDescription = {
    [StickerType.Vinyl]:
      "um adesivo de vinil de alta qualidade com acabamento fosco/semi-brilho, corte preciso e aparência plana.",
    [StickerType.Domed]:
      "um adesivo resinado (alto relevo) com cúpula transparente brilhante e bordas suavemente chanfradas.",
  }[type];

  return `
Você é um designer gráfico especialista em adesivos. Converta a imagem enviada em uma prévia profissional.

**REGRAS IMPORTANTES**
1. Limpe a imagem, remova o fundo, corrija perspectiva, melhore nitidez.
2. NÃO altere nenhum texto, logotipo ou marca.
3. Formato final: ${shapeDescription}
4. Tipo final: ${typeDescription}

**SAÍDA FINAL OBRIGATÓRIA**
Imagem composta por duas camadas:

1) FUNDO — um padrão diagonal repetindo:
   "GID Adesivos - 2025 © / Todos os Direitos Reservados"
   em tom cinza claro (marca d’água).

2) ADESIVO — a prévia limpa e correta, SEM marca d’água, sobre o fundo.

Gere uma única imagem final em alta resolução.
`;
};

export const generateStickerPreview = async (
  imageFile: File,
  shape: StickerShape,
  type: StickerType,
  orientation: RectangleOrientation
): Promise<string> => {

  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("A chave VITE_OPENAI_API_KEY não está configurada.");
  }

  const client = new OpenAI({ apiKey });

  const base64Data = await fileToBase64(imageFile);
  const prompt = createPrompt(shape, type, orientation);

  const result = await client.images.generate({
    model: "gpt-image-1",
    prompt: prompt,
    size: "1024x1024",
    // adiciona a imagem original no prompt
    // o gpt-image-1 entende texto + imagem juntos
    image: [
      {
        name: "input",
        data: base64Data,
      },
    ],
  });

  const b64 = result.data[0].b64_json;

  if (!b64) {
    throw new Error("OpenAI não gerou nenhuma imagem.");
  }

  return b64; // <- mantém o formato original do seu app
};
