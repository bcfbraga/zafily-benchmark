import sharp from "sharp";

const MAX_DIMENSION = 1600;
const WEBP_QUALITY = 82;

export interface PreparedImage {
  buffer: Buffer;
  contentType: string;
  ext: string;
}

function extFromMime(mimeType: string): string {
  return mimeType.split("/")[1].replace("jpeg", "jpg");
}

/**
 * Redimensiona e converte para WebP antes de subir para o Storage. Sem isso um
 * PNG de câmera/print entra com 1-2 MB e é servido nesse tamanho pra sempre.
 *
 * Se o sharp falhar por qualquer motivo, devolve o arquivo original — uma falha
 * de compressão nunca deve impedir o usuário de subir a imagem.
 */
export async function prepareImage(original: Buffer, mimeType: string): Promise<PreparedImage> {
  try {
    const compressed = await sharp(original)
      .rotate() // aplica a orientação do EXIF antes de descartá-la
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    if (compressed.length < original.length) {
      return { buffer: compressed, contentType: "image/webp", ext: "webp" };
    }
  } catch {
    // cai no retorno abaixo
  }

  return { buffer: original, contentType: mimeType, ext: extFromMime(mimeType) };
}
