export interface OffboardingContentBlock {
  id: string;
  label: string;
  text: string;
}

export interface OffboardingItem {
  id: string;
  title: string;
  done: boolean;
  /** Blocos de conteúdo expansíveis (templates, mensagens, etc) */
  contentBlocks?: OffboardingContentBlock[];
  /** Se o item tem uma anotação de data */
  hasDateAnnotation?: boolean;
  dateAnnotation?: string;
  order: number;
}

export function makeId(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const EMAIL_TEMPLATE = `Olá [NOME],

Primeiramente, muito obrigado pela confiança e por ter caminhado conosco esses últimos meses. Foi um prazer enorme contribuir com o crescimento da [EMPRESA].

Conforme conversamos, estamos finalizando nosso contrato de gestão de social media. Para garantir uma transição tranquila:

✅ Vamos liberar o acesso ao Google Drive com todos os arquivos (imagens, vídeos, copy, branding);
✅ Você receberá um relatório final com métricas e principais resultados;
✅ O acesso às contas (Instagram, Facebook, Meta Business) segue 100% seu — apenas removemos nosso acesso de gestão;
✅ Caso queira contratar pontualmente (campanhas sazonais, redesign), estamos à disposição.

Desejamos muito sucesso nessa próxima fase! 🚀

Abraço,
[SUA EQUIPE]`;

const MORNING_MESSAGE = `Bom dia, [NOME]! ☀️

Passando para confirmar que hoje é o último dia do nosso contrato. Ao longo do dia vou:

1️⃣ Liberar o acesso ao Drive com todos os arquivos
2️⃣ Enviar o relatório final de métricas
3️⃣ Remover nossos acessos de gestão das contas

Qualquer dúvida, é só chamar aqui! 💬`;

const AFTERNOON_MESSAGE = `Boa tarde, [NOME]! 🌤️

Atualizando: já liberei o Drive e o relatório está no seu email. Vou deixar o acesso às contas ativo até as 18h pra caso você precise de algum apoio na transição.

Sucesso sempre! Foi um prazer trabalhar com a [EMPRESA]. 💜`;

export const DEFAULT_OFFBOARDING_ITEMS: OffboardingItem[] = [
  {
    id: "off_demo1",
    title: "Comunicar formalmente o fim do contrato",
    done: false,
    hasDateAnnotation: true,
    dateAnnotation: "",
    order: 1,
    contentBlocks: [
      {
        id: "blk_email",
        label: "Email de offboarding",
        text: EMAIL_TEMPLATE,
      },
    ],
  },
  {
    id: "off_demo2",
    title: "Mensagem matinal (dia D)",
    done: false,
    order: 2,
    contentBlocks: [
      {
        id: "blk_morning",
        label: "Mensagem de bom dia",
        text: MORNING_MESSAGE,
      },
    ],
  },
  {
    id: "off_demo3",
    title: "Mensagem de tarde (atualização)",
    done: false,
    order: 3,
    contentBlocks: [
      {
        id: "blk_afternoon",
        label: "Mensagem de boa tarde",
        text: AFTERNOON_MESSAGE,
      },
    ],
  },
  {
    id: "off_demo4",
    title: "Liberar acesso ao Google Drive (todos os arquivos)",
    done: false,
    hasDateAnnotation: true,
    dateAnnotation: "",
    order: 4,
  },
  {
    id: "off_demo5",
    title: "Enviar relatório final de métricas (PDF)",
    done: false,
    order: 5,
  },
  {
    id: "off_demo6",
    title: "Remover acessos de gestão do Meta Business e Instagram",
    done: false,
    order: 6,
  },
  {
    id: "off_demo7",
    title: "Solicitar depoimento (caso o cliente tenha ficado satisfeito)",
    done: false,
    order: 7,
  },
  {
    id: "off_demo8",
    title: "Adicionar cliente à lista de ex-clientes (para reativação futura)",
    done: false,
    hasDateAnnotation: true,
    dateAnnotation: "",
    order: 8,
  },
];
