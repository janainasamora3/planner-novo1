/**
 * Utilidades de upload de arquivos.
 *
 * - `fileToDataURL`: lê o arquivo e retorna um data URL. Imagens são
 *   redimensionadas e comprimidas via canvas; PDFs são lidos diretamente
 *   como base64 (não faz sentido comprimir).
 * - `isAcceptedFile`: valida se o arquivo é PDF ou imagem.
 * - `formatBytes`: formata bytes em B/KB/MB legível.
 */

const ACCEPTED_MIME = ["application/pdf"];

/**
 * Converte um File em data URL.
 *
 * - Para imagens: redimensiona mantendo proporção (a maior dimensão vira
 *   `maxSize`) e re-codifica em JPEG com `quality`. PNGs com transparência
 *   viram JPEG (fundo preto) — aceitável para previews de anexo.
 * - Para PDFs: retorna o base64 cru via FileReader.readAsDataURL.
 * - Outros tipos: rejeita com erro.
 *
 * @param file Arquivo de origem.
 * @param maxSize Maior dimensão permitida para imagens (px). Default 1000.
 * @param quality Qualidade JPEG (0–1). Default 0.7.
 */
export async function fileToDataURL(
  file: File,
  maxSize = 1000,
  quality = 0.7,
): Promise<string> {
  if (!file.type.startsWith("image/") && !ACCEPTED_MIME.includes(file.type)) {
    throw new Error(
      `Tipo de arquivo não suportado: ${file.type || "desconhecido"}`,
    );
  }

  // PDFs não são imagens — lê direto como base64.
  if (file.type === "application/pdf") {
    return readAsDataURL(file);
  }

  // Imagem: lê, carrega, redimensiona via canvas, re-codifica.
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

  // Fundo branco para evitar bordas pretas ao converter PNG transparente em JPEG.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", quality);
}

/**
 * Verifica se o arquivo é aceito pelo uploader (PDF ou imagem/*).
 */
export function isAcceptedFile(file: File): boolean {
  return (
    file.type.startsWith("image/") || ACCEPTED_MIME.includes(file.type)
  );
}

/**
 * Formata bytes em string legível: B, KB ou MB.
 * Usa 1024 como base (binário) e 1 casa decimal a partir de KB.
 */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;

  const KB = 1024;
  const MB = KB * 1024;

  if (bytes < MB) {
    return `${(bytes / KB).toFixed(1)} KB`;
  }
  return `${(bytes / MB).toFixed(1)} MB`;
}

// --- helpers internos ---

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
