/**
 * Converte um arquivo de imagem em data URL redimensionado e comprimido.
 * Usa canvas para redimensionar mantendo proporção (maxSize = maior dimensão).
 * PNGs continuam PNG (preserva transparência); demais viram JPEG quality 0.82.
 *
 * Isso é importante porque localStorage tem limite ~5MB — imagens cruas
 * de câmera (3-5MB cada) estourariam a cota rapidamente.
 */
export async function fileToResizedDataURL(
  file: File,
  maxSize = 800,
  quality = 0.82
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Arquivo não é uma imagem");
  }

  const dataUrl = await readAsDataURL(file);
  const img = await loadImage(dataUrl);

  let { width, height } = img;
  if (width > height && width > maxSize) {
    height = Math.round((height * maxSize) / width);
    width = maxSize;
  } else if (height > maxSize) {
    width = Math.round((width * maxSize) / height);
    height = maxSize;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context indisponível");
  ctx.drawImage(img, 0, 0, width, height);

  const isPng = file.type === "image/png";
  return canvas.toDataURL(isPng ? "image/png" : "image/jpeg", quality);
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error("Falha ao ler arquivo"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Falha ao carregar imagem"));
    img.src = src;
  });
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}
