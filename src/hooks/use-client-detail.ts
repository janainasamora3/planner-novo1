"use client";

import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import {
  buildDefaultDetail,
  buildDefaultSections,
  BRIEFING_TEMPLATE,
  DEFAULT_PLANNING,
  makeId,
  SECTIONED_CARDS,
  type ClientDetail,
  type ClientStage,
  type ContentEntry,
  type PlanningCard,
  type StageFile,
} from "@/lib/client-detail";

const KEY = "dashboard.crm.clientDetail.v1";
const EVENT = "dashboard:client-detail-change";

let cache: ClientDetail[] | null = null;
const listeners = new Set<() => void>();

/**
 * Migra um ClientDetail isolado.
 *
 * - Renomeia stages antigos para os labels novos.
 * - Garante que o array `planning` tenha os 27 cards default (Briefing +
 *   26 outros). Para clientes já salvos com menos cards, adiciona os
 *   que faltam no final.
 * - Garante que o card "Briefing" tenha o template preenchido — se
 *   estiver vazio, injeta BRIEFING_TEMPLATE. Se já tem conteúdo
 *   customizado, preserva.
 */
function migrateOne(detail: ClientDetail): ClientDetail {
  const OLD_TO_NEW: Record<string, string> = {
    "Briefing": "Pagamento",
    "Pesquisa de mercado": "Organização",
    "Identidade visual": "Onboarding",
    "Planejamento editorial": "Reunião de Briefing",
    "Aprovação do cliente": "Planejamento",
    "Setup de redes": "Reunião Apresentação",
    "Calendário de posts": "Reestruturação",
    "Primeira publicação": "Criação de conteúdo",
    "Métricas": "Reunião Métricas",
  };

  const stages = Array.isArray(detail.stages) ? detail.stages : [];
  const migratedStages = stages.map((s) => {
    const newLabel = OLD_TO_NEW[s.label];
    return newLabel ? { ...s, label: newLabel, files: s.files ?? [] } : { ...s, files: s.files ?? [] };
  });

  const existingPlanning = Array.isArray(detail.planning) ? detail.planning : [];
  const planning = ensurePlanningCards(existingPlanning);

  return {
    ...detail,
    stages: migratedStages,
    planning,
    instagram: Array.isArray(detail.instagram) ? detail.instagram : [],
    linkedin: Array.isArray(detail.linkedin) ? detail.linkedin : [],
    youtube: Array.isArray(detail.youtube) ? detail.youtube : [],
  };
}

/**
 * Garante que o array `planning` tenha pelo menos 27 cards (os default).
 * - Adiciona defaults que faltam (baseado no título), com IDs novos.
 * - Garante que o card "Briefing" tenha o template preenchido.
 * - Garante que cards especiais (Briefing, Tom de voz) tenham `sections`
 *   populado com os defaults (preservando conteúdo customizado do usuário).
 * - Preserva cards customizados adicionados pelo usuário.
 */
function ensurePlanningCards(existing: PlanningCard[]): PlanningCard[] {
  const result: PlanningCard[] = [...existing];

  // 1) Para cada card especial (Briefing, Tom de voz), garante sections.
  for (const card of result) {
    const info = SECTIONED_CARDS[card.title.trim().toLowerCase()];
    if (!info) continue;
    const currentSections = card.sections ?? {};
    const mergedSections: Record<string, string> = {};
    for (const section of info.sections) {
      mergedSections[section.id] =
        currentSections[section.id] ?? section.defaultContent;
    }
    card.sections = mergedSections;
  }

  // 2) Briefing: injeta template se vazio (mantém para compat retroativa)
  const briefingIdx = result.findIndex(
    (p) => p.title.trim().toLowerCase() === "briefing"
  );
  if (briefingIdx !== -1) {
    const current = result[briefingIdx];
    if (!current.content || current.content.trim() === "") {
      result[briefingIdx] = {
        ...current,
        content: BRIEFING_TEMPLATE,
      };
    }
  }

  // 3) Adiciona defaults que faltam (baseado no título).
  const existingTitles = new Set(
    result.map((p) => p.title.trim().toLowerCase())
  );
  for (const def of DEFAULT_PLANNING) {
    const titleKey = def.title.trim().toLowerCase();
    if (!existingTitles.has(titleKey)) {
      // Para cards especiais, popular sections com defaults.
      const info = SECTIONED_CARDS[titleKey];
      const newCard: PlanningCard = { ...def, id: makeId("plan") };
      if (info) {
        newCard.sections = buildDefaultSections(info.sections);
      }
      result.push(newCard);
      existingTitles.add(titleKey);
    }
  }

  return result;
}

function migrate(input: ClientDetail[]): ClientDetail[] {
  return input.map(migrateOne);
}

function read(): ClientDetail[] {
  if (cache !== null) return cache;
  if (typeof window === "undefined") {
    cache = [];
    return cache;
  }
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as ClientDetail[]) : [];
    cache = Array.isArray(parsed) ? migrate(parsed) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: ClientDetail[]) {
  cache = next;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch (e) {
    console.error("Falha ao salvar detalhes do cliente:", e);
  }
}

function subscribe(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

function useEffectOnce(fn: () => void) {
  const ref = useRef(false);
  useEffect(() => {
    if (ref.current) return;
    ref.current = true;
    fn();
  }, [fn]);
}

type Platform = "instagram" | "linkedin" | "youtube";

// Constante imutável para getServerSnapshot (evita loop infinito)
const EMPTY_DETAILS: ClientDetail[] = [];

export function useClientDetail(clientId: string | null) {
  const allDetails = useSyncExternalStore(subscribe, read, () => EMPTY_DETAILS);

  useEffectOnce(() => {
    if (typeof window === "undefined") return;
    const current = read();
    const migrated = migrate(current);
    if (JSON.stringify(current) !== JSON.stringify(migrated)) {
      write(migrated);
    }
  });

  const detail: ClientDetail | null = useMemo(() => {
    if (!clientId) return null;
    const found = allDetails.find((d) => d.clientId === clientId);
    return found ?? null;
  }, [allDetails, clientId]);

  const getOrCreate = useCallback((id: string): ClientDetail => {
    const list = read();
    const existing = list.find((d) => d.clientId === id);
    if (existing) return migrateOne(existing);
    const fresh = buildDefaultDetail(id);
    write([...list, fresh]);
    return fresh;
  }, []);

  const updateProfile = useCallback(
    (clientId: string, patch: Partial<Pick<ClientDetail, "drive" | "logosLink">>) => {
      const list = read();
      const existing = list.find((d) => d.clientId === clientId);
      const next: ClientDetail = existing
        ? { ...existing, ...patch, updatedAt: Date.now() }
        : { ...buildDefaultDetail(clientId), ...patch, updatedAt: Date.now() };
      write(
        existing
          ? list.map((d) => (d.clientId === clientId ? next : d))
          : [...list, next]
      );
    },
    []
  );

  const toggleStage = useCallback((clientId: string, stageId: string) => {
    const list = read();
    const existing = list.find((d) => d.clientId === clientId);
    if (!existing) return;
    const next: ClientDetail = {
      ...existing,
      stages: existing.stages.map((s) =>
        s.id === stageId ? { ...s, done: !s.done } : s
      ),
      updatedAt: Date.now(),
    };
    write(list.map((d) => (d.clientId === clientId ? next : d)));
  }, []);

  const updateStageContent = useCallback(
    (clientId: string, stageId: string, content: string) => {
      const list = read();
      const existing = list.find((d) => d.clientId === clientId);
      if (!existing) return;
      const next: ClientDetail = {
        ...existing,
        stages: existing.stages.map((s) =>
          s.id === stageId ? { ...s, content } : s
        ),
        updatedAt: Date.now(),
      };
      write(list.map((d) => (d.clientId === clientId ? next : d)));
    },
    []
  );

  const updatePlanningCard = useCallback(
    (clientId: string, cardId: string, patch: Partial<Omit<PlanningCard, "id">>) => {
      const list = read();
      const existing = list.find((d) => d.clientId === clientId);
      if (!existing) return;
      const next: ClientDetail = {
        ...existing,
        planning: existing.planning.map((p) =>
          p.id === cardId ? { ...p, ...patch } : p
        ),
        updatedAt: Date.now(),
      };
      write(list.map((d) => (d.clientId === clientId ? next : d)));
    },
    []
  );

  const addPlanningCard = useCallback((clientId: string, card: Omit<PlanningCard, "id">) => {
    const list = read();
    const existing = list.find((d) => d.clientId === clientId);
    if (!existing) return;
    const newCard: PlanningCard = { ...card, id: makeId("plan") };
    const next: ClientDetail = {
      ...existing,
      planning: [...existing.planning, newCard],
      updatedAt: Date.now(),
    };
    write(list.map((d) => (d.clientId === clientId ? next : d)));
    return newCard;
  }, []);

  const removePlanningCard = useCallback((clientId: string, cardId: string) => {
    const list = read();
    const existing = list.find((d) => d.clientId === clientId);
    if (!existing) return;
    const next: ClientDetail = {
      ...existing,
      planning: existing.planning.filter((p) => p.id !== cardId),
      updatedAt: Date.now(),
    };
    write(list.map((d) => (d.clientId === clientId ? next : d)));
  }, []);

  /** Reordena um card de planejamento movendo-o para uma nova posição. */
  const reorderPlanningCard = useCallback(
    (clientId: string, fromId: string, toId: string) => {
      const list = read();
      const existing = list.find((d) => d.clientId === clientId);
      if (!existing) return;
      const cards = [...existing.planning];
      const fromIdx = cards.findIndex((c) => c.id === fromId);
      const toIdx = cards.findIndex((c) => c.id === toId);
      if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;
      const [moved] = cards.splice(fromIdx, 1);
      cards.splice(toIdx, 0, moved);
      const next: ClientDetail = {
        ...existing,
        planning: cards,
        updatedAt: Date.now(),
      };
      write(list.map((d) => (d.clientId === clientId ? next : d)));
    },
    []
  );

  const addContentEntry = useCallback(
    (clientId: string, platform: Platform, entry: Omit<ContentEntry, "id">) => {
      const list = read();
      const existing = list.find((d) => d.clientId === clientId);
      if (!existing) return;
      const newEntry: ContentEntry = { ...entry, id: makeId("content") };
      const next: ClientDetail = {
        ...existing,
        [platform]: [...existing[platform], newEntry],
        updatedAt: Date.now(),
      } as ClientDetail;
      write(list.map((d) => (d.clientId === clientId ? next : d)));
      return newEntry;
    },
    []
  );

  const updateContentEntry = useCallback(
    (clientId: string, platform: Platform, entryId: string, patch: Partial<Omit<ContentEntry, "id">>) => {
      const list = read();
      const existing = list.find((d) => d.clientId === clientId);
      if (!existing) return;
      const next: ClientDetail = {
        ...existing,
        [platform]: existing[platform].map((e) =>
          e.id === entryId ? { ...e, ...patch } : e
        ),
        updatedAt: Date.now(),
      } as ClientDetail;
      write(list.map((d) => (d.clientId === clientId ? next : d)));
    },
    []
  );

  const removeContentEntry = useCallback(
    (clientId: string, platform: Platform, entryId: string) => {
      const list = read();
      const existing = list.find((d) => d.clientId === clientId);
      if (!existing) return;
      const next: ClientDetail = {
        ...existing,
        [platform]: existing[platform].filter((e) => e.id !== entryId),
        updatedAt: Date.now(),
      } as ClientDetail;
      write(list.map((d) => (d.clientId === clientId ? next : d)));
    },
    []
  );

  const addStageFile = useCallback(
    (clientId: string, stageId: string, file: StageFile) => {
      const list = read();
      const existing = list.find((d) => d.clientId === clientId);
      if (!existing) return;
      const next: ClientDetail = {
        ...existing,
        stages: existing.stages.map((s) =>
          s.id === stageId
            ? { ...s, files: [...(s.files ?? []), file] }
            : s
        ),
        updatedAt: Date.now(),
      };
      write(list.map((d) => (d.clientId === clientId ? next : d)));
    },
    []
  );

  const removeStageFile = useCallback(
    (clientId: string, stageId: string, fileId: string) => {
      const list = read();
      const existing = list.find((d) => d.clientId === clientId);
      if (!existing) return;
      const next: ClientDetail = {
        ...existing,
        stages: existing.stages.map((s) =>
          s.id === stageId
            ? { ...s, files: (s.files ?? []).filter((f) => f.id !== fileId) }
            : s
        ),
        updatedAt: Date.now(),
      };
      write(list.map((d) => (d.clientId === clientId ? next : d)));
    },
    []
  );

  /**
   * Adiciona uma nova etapa (stage) ao final da lista do cliente.
   * Retorna a nova etapa criada (com ID gerado, order = última+1).
   */
  const addStage = useCallback((clientId: string, label: string): ClientStage | null => {
    const list = read();
    const existing = list.find((d) => d.clientId === clientId);
    if (!existing) return null;
    const nextOrder =
      existing.stages.length > 0
        ? Math.max(...existing.stages.map((s) => s.order)) + 1
        : 1;
    const newStage: ClientStage = {
      id: makeId("stage"),
      label: label.trim() || "Nova etapa",
      done: false,
      order: nextOrder,
      content: "",
      files: [],
    };
    const next: ClientDetail = {
      ...existing,
      stages: [...existing.stages, newStage],
      updatedAt: Date.now(),
    };
    write(list.map((d) => (d.clientId === clientId ? next : d)));
    return newStage;
  }, []);

  /**
   * Remove uma etapa (stage). Reordena as restantes para não ter gaps.
   */
  const removeStage = useCallback((clientId: string, stageId: string) => {
    const list = read();
    const existing = list.find((d) => d.clientId === clientId);
    if (!existing) return;
    const filtered = existing.stages
      .filter((s) => s.id !== stageId)
      .sort((a, b) => a.order - b.order)
      .map((s, i) => ({ ...s, order: i + 1 }));
    const next: ClientDetail = {
      ...existing,
      stages: filtered,
      updatedAt: Date.now(),
    };
    write(list.map((d) => (d.clientId === clientId ? next : d)));
  }, []);

  /**
   * Atualiza uma etapa (stage) — pode renomear (label) e/ou reordenar (order).
   * Se reordenar, troca o `order` da etapa alvo com a vizinha.
   */
  const updateStage = useCallback(
    (
      clientId: string,
      stageId: string,
      patch: Partial<Pick<ClientStage, "label" | "order">>
    ) => {
      const list = read();
      const existing = list.find((d) => d.clientId === clientId);
      if (!existing) return;

      let newStages = [...existing.stages];

      if (patch.order !== undefined) {
        const current = newStages.find((s) => s.id === stageId);
        if (current && current.order !== patch.order) {
          const target = newStages.find((s) => s.order === patch.order);
          if (target) {
            newStages = newStages.map((s) => {
              if (s.id === stageId) return { ...s, order: patch.order as number };
              if (s.id === target.id) return { ...s, order: current.order };
              return s;
            });
          }
        }
      }

      if (patch.label !== undefined) {
        newStages = newStages.map((s) =>
          s.id === stageId ? { ...s, label: patch.label as string } : s
        );
      }

      const next: ClientDetail = {
        ...existing,
        stages: newStages,
        updatedAt: Date.now(),
      };
      write(list.map((d) => (d.clientId === clientId ? next : d)));
    },
    []
  );

  // ============ Métricas ============

  const addMetric = useCallback(
    (clientId: string, metric: Omit<import("@/lib/client-detail").MetricEntry, "id" | "createdAt">) => {
      const all = read();
      const d = all.find((x) => x.clientId === clientId);
      if (!d) return;
      const newMetric: import("@/lib/client-detail").MetricEntry = {
        ...metric,
        id: makeId("metric"),
        createdAt: Date.now(),
      };
      d.metrics = [...(d.metrics ?? []), newMetric];
      d.updatedAt = Date.now();
      write(all.map((x) => (x.clientId === clientId ? d : x)));
    },
    []
  );

  const removeMetric = useCallback((clientId: string, metricId: string) => {
    const all = read();
    const d = all.find((x) => x.clientId === clientId);
    if (!d?.metrics) return;
    d.metrics = d.metrics.filter((m) => m.id !== metricId);
    d.updatedAt = Date.now();
    write(all.map((x) => (x.clientId === clientId ? d : x)));
  }, []);

  // ============ Documentos ============

  const addDocument = useCallback(
    (clientId: string, doc: Omit<import("@/lib/client-detail").Attachment, "id" | "createdAt">) => {
      const all = read();
      const d = all.find((x) => x.clientId === clientId);
      if (!d) return;
      const newDoc: import("@/lib/client-detail").Attachment = {
        ...doc,
        id: makeId("doc"),
        createdAt: Date.now(),
      };
      d.documents = [...(d.documents ?? []), newDoc];
      d.updatedAt = Date.now();
      write(all.map((x) => (x.clientId === clientId ? d : x)));
    },
    []
  );

  const removeDocument = useCallback((clientId: string, docId: string) => {
    const all = read();
    const d = all.find((x) => x.clientId === clientId);
    if (!d?.documents) return;
    d.documents = d.documents.filter((doc) => doc.id !== docId);
    d.updatedAt = Date.now();
    write(all.map((x) => (x.clientId === clientId ? d : x)));
  }, []);

  // ============ Timeline ============

  const addTimelineEntry = useCallback(
    (clientId: string, entry: Omit<import("@/lib/client-detail").TimelineEntry, "id" | "createdAt">) => {
      const all = read();
      const d = all.find((x) => x.clientId === clientId);
      if (!d) return;
      const newEntry: import("@/lib/client-detail").TimelineEntry = {
        ...entry,
        id: makeId("tl"),
        createdAt: Date.now(),
      };
      d.timeline = [...(d.timeline ?? []), newEntry].sort((a, b) =>
        a.date < b.date ? 1 : -1
      );
      d.updatedAt = Date.now();
      write(all.map((x) => (x.clientId === clientId ? d : x)));
    },
    []
  );

  const removeTimelineEntry = useCallback((clientId: string, entryId: string) => {
    const all = read();
    const d = all.find((x) => x.clientId === clientId);
    if (!d?.timeline) return;
    d.timeline = d.timeline.filter((t) => t.id !== entryId);
    d.updatedAt = Date.now();
    write(all.map((x) => (x.clientId === clientId ? d : x)));
  }, []);

  return {
    detail,
    getOrCreate,
    updateProfile,
    toggleStage,
    updateStageContent,
    addStageFile,
    removeStageFile,
    addStage,
    removeStage,
    updateStage,
    updatePlanningCard,
    addPlanningCard,
    removePlanningCard,
    reorderPlanningCard,
    addContentEntry,
    updateContentEntry,
    removeContentEntry,
    addMetric,
    removeMetric,
    addDocument,
    removeDocument,
    addTimelineEntry,
    removeTimelineEntry,
  };
}

/**
 * Hook que retorna TODOS os ClientDetails armazenados.
 * Usado para contar posts (ContentEntry) de todos os clientes de uma vez,
 * sem precisar instanciar useClientDetail para cada cliente individualmente.
 */
export function useAllClientDetails() {
  const allDetails = useSyncExternalStore(subscribe, read, () => EMPTY_DETAILS);

  useEffectOnce(() => {
    if (typeof window === "undefined") return;
    const current = read();
    const migrated = migrate(current);
    if (JSON.stringify(current) !== JSON.stringify(migrated)) {
      write(migrated);
    }
  });

  return allDetails;
}
