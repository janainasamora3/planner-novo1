export interface LinkItem {
  id: string;
  title: string;
  url: string;
}

export interface LinkCategory {
  id: string;
  name: string;
  emoji: string;
  /** Cor da categoria em hex (usada para badge e header). Gerada automaticamente se não informada. */
  color?: string;
  links: LinkItem[];
  order: number;
}

export function makeId(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Paleta de cores para categorias — usada quando nenhuma cor é informada. */
export const CATEGORY_COLOR_PALETTE: string[] = [
  "#2563eb", // azul
  "#16a34a", // verde
  "#9333ea", // roxo
  "#ea580c", // laranja
  "#db2777", // rosa
  "#0891b2", // ciano
  "#ca8a04", // amarelo
  "#dc2626", // vermelho
  "#7c3aed", // violeta
  "#0d9488", // teal
  "#65a30d", // lima
  "#9f1239", // vinho
];

/** Retorna uma cor da paleta baseada no índice (determinística). */
export function colorForIndex(index: number): string {
  return CATEGORY_COLOR_PALETTE[index % CATEGORY_COLOR_PALETTE.length];
}

export const DEFAULT_LINK_CATEGORIES: LinkCategory[] = [
  {
    id: "lnk_musicas",
    name: "Músicas",
    emoji: "🎵",
    order: 1,
    links: [
      { id: "l1", title: "Epidemic Sound", url: "https://www.epidemicsound.com" },
      { id: "l2", title: "Artlist", url: "https://artlist.io" },
      { id: "l3", title: "YouTube Audio Library", url: "https://studio.youtube.com/channel/audio" },
      { id: "l4", title: "Pixabay Music", url: "https://pixabay.com/music/" },
    ],
  },
  {
    id: "lnk_copy",
    name: "Copy",
    emoji: "✍️",
    order: 2,
    links: [
      { id: "l5", title: "ChatGPT", url: "https://chat.openai.com" },
      { id: "l6", title: "Claude AI", url: "https://claude.ai" },
      { id: "l7", title: "Headline analyzer (CoSchedule)", url: "https://coschedule.com/headline-analyzer" },
      { id: "l8", title: "Gerador de копирайт (Notion AI)", url: "https://www.notion.so/product/ai" },
    ],
  },
  {
    id: "lnk_ruido",
    name: "Limpar ruído",
    emoji: "🔊",
    order: 3,
    links: [
      { id: "l9", title: "Adobe Podcast Enhance", url: "https://podcast.adobe.com/enhance" },
      { id: "l10", title: "Vocal Remover", url: "https://vocalremover.org" },
      { id: "l11", title: "Noiserko (LALAL.AI)", url: "https://www.lalal.ai" },
    ],
  },
  {
    id: "lnk_assuntos",
    name: "Assuntos em alta",
    emoji: "📈",
    order: 4,
    links: [
      { id: "l12", title: "Google Trends", url: "https://trends.google.com" },
      { id: "l13", title: "Exploding Topics", url: "https://explodingtopics.com" },
      { id: "l14", title: "X Trending", url: "https://twitter.com/explore/tabs/trending" },
      { id: "l15", title: "TikTok Trend Discovery", url: "https://www.tiktok.com/discover" },
      { id: "l16", title: "AnswerThePublic", url: "https://answerthepublic.com" },
    ],
  },
  {
    id: "lnk_lousa",
    name: "Lousa",
    emoji: "📋",
    order: 5,
    links: [
      { id: "l17", title: "Miro", url: "https://miro.com" },
      { id: "l18", title: "FigJam", url: "https://www.figma.com/figjam" },
      { id: "l19", title: "Notion Whiteboard", url: "https://www.notion.so/product/whiteboards" },
      { id: "l20", title: "Excalidraw", url: "https://excalidraw.com" },
    ],
  },
  {
    id: "lnk_imagens",
    name: "Imagens",
    emoji: "🖼️",
    order: 6,
    links: [
      { id: "l21", title: "Unsplash", url: "https://unsplash.com" },
      { id: "l22", title: "Pexels", url: "https://www.pexels.com" },
      { id: "l23", title: "Pixabay Images", url: "https://pixabay.com/images" },
      { id: "l24", title: "Freepik", url: "https://www.freepik.com" },
      { id: "l25", title: "Pinterest", url: "https://www.pinterest.com" },
    ],
  },
  {
    id: "lnk_texturas",
    name: "Texturas",
    emoji: "🎨",
    order: 7,
    links: [
      { id: "l26", title: "Texture Haven", url: "https://texturehaven.com" },
      { id: "l27", title: "Lost and Taken", url: "https://lostandtaken.com" },
      { id: "l28", title: "Transparent Textures", url: "https://www.transparenttextures.com" },
    ],
  },
  {
    id: "lnk_videos",
    name: "Vídeos",
    emoji: "🎥",
    order: 8,
    links: [
      { id: "l29", title: "Pexels Videos", url: "https://www.pexels.com/videos" },
      { id: "l30", title: "Coverr", url: "https://coverr.co" },
      { id: "l31", title: "Mixkit", url: "https://mixkit.co" },
      { id: "l32", title: "Videvo", url: "https://www.videvo.net" },
    ],
  },
  {
    id: "lnk_mockups",
    name: "Mockups",
    emoji: "📦",
    order: 9,
    links: [
      { id: "l33", title: "Smartmockups", url: "https://smartmockups.com" },
      { id: "l34", title: "Mockup World", url: "https://www.mockupworld.co" },
      { id: "l35", title: "Freepik Mockups", url: "https://www.freepik.com/psd/mockup" },
      { id: "l36", title: "Artboard Studio", url: "https://artboard.studio" },
    ],
  },
  {
    id: "lnk_criativos",
    name: "Criativos",
    emoji: "✨",
    order: 10,
    links: [
      { id: "l37", title: "Canva", url: "https://www.canva.com" },
      { id: "l38", title: "Figma", url: "https://www.figma.com" },
      { id: "l39", title: "Adobe Express", url: "https://www.adobe.com/express" },
      { id: "l40", title: "Photopea", url: "https://www.photopea.com" },
      { id: "l41", title: "Remove.bg", url: "https://www.remove.bg" },
    ],
  },
  {
    id: "lnk_form",
    name: "Formulário",
    emoji: "📝",
    order: 11,
    links: [
      { id: "l42", title: "Google Forms", url: "https://forms.google.com" },
      { id: "l43", title: "Typeform", url: "https://www.typeform.com" },
      { id: "l44", title: "Tally", url: "https://tally.so" },
      { id: "l45", title: "Jotform", url: "https://www.jotform.com" },
      { id: "l46", title: "Microsoft Forms", url: "https://forms.office.com" },
      { id: "l47", title: "Paperform", url: "https://paperform.co" },
    ],
  },
];
