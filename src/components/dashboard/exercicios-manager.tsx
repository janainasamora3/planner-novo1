"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { FontScaleControl } from "@/components/font-scale-control";
import { ThemeToggle } from "@/components/theme-toggle";
import type { PageCard } from "@/lib/pages";

interface ExerciciosManagerProps {
  page: PageCard;
  onClose: () => void;
}

// =================== Tipos ===================
interface WorkoutVideo {
  id: string;
  title: string;
  url: string; // URL original do YouTube
  videoId: string; // ID extraído para embed/thumbnail
  category?: string | null;
  dayOfWeek?: number | null; // 0=Dom, 1=Seg, ..., 6=Sáb
  duration?: string; // ex: "15 min"
  notes?: string;
  createdAt: number;
}

interface WorkoutCategory {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

interface DaySchedule {
  id: string;
  dayOfWeek: number; // 0-6
  title: string; // ex: "Normal 06:00 às 08:00"
  extras: string; // texto livre com aulas extras
}

// =================== Utilidades YouTube ===================
function parseYouTubeId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  // Padrões:
  //  https://www.youtube.com/watch?v=VIDEO_ID
  //  https://youtu.be/VIDEO_ID
  //  https://www.youtube.com/shorts/VIDEO_ID
  //  https://www.youtube.com/embed/VIDEO_ID
  //  https://m.youtube.com/watch?v=VIDEO_ID
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/|m\.youtube\.com\/watch\?v=)([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = trimmed.match(p);
    if (m && m[1]) return m[1];
  }
  // Se colou só o ID direto (11 chars)
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;
  return null;
}

function youtubeThumb(videoId: string, quality: "hq" | "mq" | "max" = "hq"): string {
  const q = quality === "max" ? "maxresdefault" : quality === "mq" ? "mqdefault" : "hqdefault";
  return `https://img.youtube.com/vi/${videoId}/${q}.jpg`;
}

function youtubeEmbed(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
}

// =================== Hook de localStorage ===================
const VIDEOS_KEY = "dashboard.exercicios.videos.v1";
const CATS_KEY = "dashboard.exercicios.categories.v1";
const SCHEDULE_KEY = "dashboard.exercicios.schedule.v1";
const EVENT = "dashboard:exercicios-change";

const DEFAULT_CATEGORIES: WorkoutCategory[] = [
  { id: "cat_musc", name: "Musculação", emoji: "💪", color: "#dc2626" },
  { id: "cat_cardio", name: "Cardio", emoji: "🏃", color: "#ea580c" },
  { id: "cat_hiit", name: "HIIT", emoji: "🔥", color: "#d97706" },
  { id: "cat_yoga", name: "Yoga / Alongamento", emoji: "🧘", color: "#7c3aed" },
  { id: "cat_danca", name: "Dança", emoji: "💃", color: "#db2777" },
  { id: "cat_luta", name: "Lutas", emoji: "🥊", color: "#0891b2" },
];

const DAYS_OF_WEEK = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const DAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function makeId(p: string) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`; }

function useExerciciosStore<T>(key: string, defaultValue: T) {
  const [data, setData] = useState<T>(defaultValue);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) setData(JSON.parse(raw) as T);
    } catch {}
    setLoaded(true);
    const handler = () => {
      try {
        const raw = window.localStorage.getItem(key);
        if (raw) setData(JSON.parse(raw) as T);
      } catch {}
    };
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, [key]);

  const save = useCallback((next: T) => {
    setData(next);
    try { window.localStorage.setItem(key, JSON.stringify(next)); window.dispatchEvent(new CustomEvent(EVENT)); } catch {}
  }, [key]);

  return { data, save, loaded };
}

// =================== Componente principal ===================
export function ExerciciosManager({ page, onClose }: ExerciciosManagerProps) {
  const [view, setView] = useState<"treinos" | "agenda">("treinos");

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-md text-foreground/70 hover:text-foreground hover:bg-accent transition-colors" aria-label="Voltar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center text-xl shrink-0 ring-1 ring-black/5 dark:ring-white/10 shadow-sm" style={{ background: `linear-gradient(135deg, ${page.color ?? "#7c2d12"} 0%, #0a0a0a 100%)`, color: "#fff" }}>{page.emoji || "🏃"}</div>
            <div><h1 className="text-base font-bold text-foreground leading-tight">{page.title}</h1><p className="text-[11px] text-muted-foreground">Treinos & Agenda</p></div>
          </div>
        </div>
        <div className="flex items-center gap-2"><FontScaleControl /><ThemeToggle className="text-foreground/70 hover:text-foreground" /></div>
      </header>

      {/* Submenu */}
      <nav className="border-b border-border bg-card px-4 sm:px-6 shrink-0">
        <div className="flex items-center gap-1">
          <button onClick={() => setView("treinos")} className={cn("px-3 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5", view === "treinos" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>🎬 Treinos (YouTube)</button>
          <button onClick={() => setView("agenda")} className={cn("px-3 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5", view === "agenda" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>📅 Agenda Semanal</button>
        </div>
      </nav>

      <div className="flex-1 overflow-y-auto bg-background">
        {view === "treinos" && <TreinosView />}
        {view === "agenda" && <AgendaView />}
      </div>
    </div>
  );
}

// =================== Treinos (YouTube cards) ===================
function TreinosView() {
  const { data: videos, save: saveVideos, loaded } = useExerciciosStore<WorkoutVideo[]>(VIDEOS_KEY, []);
  const { data: categories, save: saveCategories } = useExerciciosStore<WorkoutCategory[]>(CATS_KEY, DEFAULT_CATEGORIES);
  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [showCatManager, setShowCatManager] = useState(false);
  const [filterCat, setFilterCat] = useState<string | "all">("all");
  const [filterDay, setFilterDay] = useState<number | "all">("all");
  const [search, setSearch] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [fUrl, setFUrl] = useState("");
  const [fTitle, setFTitle] = useState("");
  const [fCategory, setFCategory] = useState<string>("");
  const [fDay, setFDay] = useState<number | "">("");
  const [fDuration, setFDuration] = useState("");
  const [fNotes, setFNotes] = useState("");

  function resetForm() {
    setFUrl(""); setFTitle(""); setFCategory(""); setFDay(""); setFDuration(""); setFNotes("");
  }

  // Auto-fill título quando colar URL (se vazio)
  useEffect(() => {
    if (fUrl && !fTitle) {
      // só sugere algo para o usuário saber que reconheceu
      const id = parseYouTubeId(fUrl);
      if (id) {
        setFTitle(`Treino ${id.slice(0, 4)}`);
      }
    }
  }, [fUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleAdd() {
    const videoId = parseYouTubeId(fUrl);
    if (!videoId) {
      toast({ title: "URL do YouTube inválida", description: "Cole um link como https://youtube.com/watch?v=...", variant: "destructive" });
      return;
    }
    if (!fTitle.trim()) {
      toast({ title: "Título obrigatório", variant: "destructive" });
      return;
    }
    saveVideos([...videos, {
      id: makeId("vid"),
      title: fTitle.trim(),
      url: fUrl.trim(),
      videoId,
      category: fCategory || null,
      dayOfWeek: fDay === "" ? null : Number(fDay),
      duration: fDuration.trim() || undefined,
      notes: fNotes.trim() || undefined,
      createdAt: Date.now(),
    }]);
    resetForm();
    setShowForm(false);
    toast({ title: "Treino adicionado!" });
  }

  function handleDelete(id: string, title: string) {
    if (!confirm(`Excluir "${title}"?`)) return;
    saveVideos(videos.filter((v) => v.id !== id));
    toast({ title: "Treino excluído", variant: "destructive" });
  }

  const playingVideo = videos.find((v) => v.id === playingId) ?? null;
  const editingVideo = videos.find((v) => v.id === editingId) ?? null;

  const catName = (id: string | null | undefined) => {
    if (!id) return null;
    return categories.find((c) => c.id === id) ?? null;
  };

  const filtered = videos
    .filter((v) => filterCat === "all" || v.category === filterCat)
    .filter((v) => filterDay === "all" || v.dayOfWeek === filterDay)
    .filter((v) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return v.title.toLowerCase().includes(q) || (v.notes ?? "").toLowerCase().includes(q);
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-base font-bold flex items-center gap-2">🎬 Treinos no YouTube</h2>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowCatManager(true)} className="text-xs h-8">🏷️ Categorias</Button>
          <Button size="sm" onClick={() => { resetForm(); setShowForm(!showForm); }} className="bg-emerald-600 hover:bg-emerald-500 text-white border-0 h-8">
            {showForm ? "✕ Fechar" : "+ Adicionar treino"}
          </Button>
        </div>
      </div>

      {/* Busca */}
      <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Buscar treino por nome ou nota..." className="h-9 text-sm bg-muted/20 border-border" />

      {/* Filtros */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] uppercase text-muted-foreground font-bold mr-1">Categoria:</span>
          <button onClick={() => setFilterCat("all")} className={cn("px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all", filterCat === "all" ? "bg-foreground text-background border-foreground" : "bg-card text-muted-foreground border-border hover:border-foreground/30")}>
            Todas ({videos.length})
          </button>
          {categories.map((c) => {
            const count = videos.filter((v) => v.category === c.id).length;
            const active = filterCat === c.id;
            return (
              <button key={c.id} onClick={() => setFilterCat(active ? "all" : c.id)} className={cn("px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all flex items-center gap-1", active ? "text-white border-transparent" : "bg-card text-muted-foreground border-border hover:border-foreground/30")} style={active ? { background: c.color, borderColor: c.color } : undefined}>
                <span>{c.emoji}</span> {c.name} ({count})
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] uppercase text-muted-foreground font-bold mr-1">Dia:</span>
          <button onClick={() => setFilterDay("all")} className={cn("px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all", filterDay === "all" ? "bg-foreground text-background border-foreground" : "bg-card text-muted-foreground border-border hover:border-foreground/30")}>Todos</button>
          {DAYS_OF_WEEK.map((d, idx) => {
            const count = videos.filter((v) => v.dayOfWeek === idx).length;
            if (count === 0 && filterDay !== idx) return null;
            return (
              <button key={idx} onClick={() => setFilterDay(filterDay === idx ? "all" : idx)} className={cn("px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all", filterDay === idx ? "bg-blue-600 text-white border-blue-600" : "bg-card text-muted-foreground border-border hover:border-foreground/30")}>
                {DAYS_SHORT[idx]} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Form adicionar */}
      {showForm && (
        <div className="p-4 rounded-xl bg-muted/20 border border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-muted-foreground">Novo treino</span>
            <button onClick={() => { setShowForm(false); resetForm(); }} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
          </div>
          <div className="space-y-2">
            <div>
              <label className="text-[10px] uppercase text-muted-foreground font-bold">URL do YouTube *</label>
              <Input value={fUrl} onChange={(e) => setFUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className="h-9 text-sm bg-background border-border mt-0.5" />
              {fUrl && parseYouTubeId(fUrl) && (
                <div className="flex items-center gap-2 mt-1.5">
                  <img src={youtubeThumb(parseYouTubeId(fUrl)!, "mq")} alt="preview" className="h-14 w-24 rounded object-cover border border-border" />
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400">✓ Vídeo reconhecido (ID: {parseYouTubeId(fUrl)})</div>
                </div>
              )}
              {fUrl && !parseYouTubeId(fUrl) && (
                <div className="text-[10px] text-destructive mt-1">URL inválida. Formatos aceitos: youtube.com/watch?v=, youtu.be/, /shorts/</div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase text-muted-foreground font-bold">Título *</label>
                <Input value={fTitle} onChange={(e) => setFTitle(e.target.value)} placeholder="Ex: Treino de pernas 20min" className="h-9 text-sm bg-background border-border mt-0.5" />
              </div>
              <div>
                <label className="text-[10px] uppercase text-muted-foreground font-bold">Duração</label>
                <Input value={fDuration} onChange={(e) => setFDuration(e.target.value)} placeholder="Ex: 15 min" className="h-9 text-sm bg-background border-border mt-0.5" />
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase text-muted-foreground font-bold">Categoria</label>
              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                <button onClick={() => setFCategory("")} className={cn("px-2 py-0.5 rounded-full text-[10px] border", !fCategory ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground/30")}>Sem categoria</button>
                {categories.map((c) => (
                  <button key={c.id} onClick={() => setFCategory(c.id)} className={cn("px-2 py-0.5 rounded-full text-[10px] border flex items-center gap-1", fCategory === c.id ? "text-white border-transparent" : "border-border text-muted-foreground hover:border-foreground/30")} style={fCategory === c.id ? { background: c.color, borderColor: c.color } : undefined}>
                    {c.emoji} {c.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase text-muted-foreground font-bold">Dia da semana sugerido</label>
              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                <button onClick={() => setFDay("")} className={cn("px-2 py-0.5 rounded-full text-[10px] border", fDay === "" ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground/30")}>Qualquer dia</button>
                {DAYS_OF_WEEK.map((d, idx) => (
                  <button key={idx} onClick={() => setFDay(idx)} className={cn("px-2 py-0.5 rounded-full text-[10px] border", fDay === idx ? "bg-blue-600 text-white border-blue-600" : "border-border text-muted-foreground hover:border-foreground/30")}>{DAYS_SHORT[idx]}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase text-muted-foreground font-bold">Notas (opcional)</label>
              <textarea value={fNotes} onChange={(e) => setFNotes(e.target.value)} placeholder="Ex: Aquecer 5min antes, foco em glúteos..." rows={2} className="w-full bg-background border border-border rounded-md p-2 text-sm resize-y mt-0.5" />
            </div>
          </div>
          <Button size="sm" onClick={handleAdd} disabled={!fTitle.trim() || !parseYouTubeId(fUrl)} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white border-0">+ Salvar treino</Button>
        </div>
      )}

      {/* Grid de cards */}
      {loaded && filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((v) => {
            const cat = catName(v.category);
            return (
              <div key={v.id} className="rounded-xl border border-border bg-card overflow-hidden hover:border-foreground/30 hover:shadow-md transition-all group flex flex-col">
                {/* Thumbnail YouTube */}
                <div className="relative aspect-video bg-muted/30 cursor-pointer overflow-hidden" onClick={() => setPlayingId(v.id)}>
                  <img
                    src={youtubeThumb(v.videoId, "hq")}
                    alt={v.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      // fallback se maxres/hq falhar
                      const img = e.currentTarget;
                      if (img.src.includes("hqdefault")) {
                        img.src = youtubeThumb(v.videoId, "mq");
                      } else {
                        img.style.display = "none";
                      }
                    }}
                  />
                  {/* Play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                    <div className="h-12 w-12 rounded-full bg-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  </div>
                  {/* Duração */}
                  {v.duration && (
                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-white text-[10px] font-bold">{v.duration}</span>
                  )}
                  {/* Categoria badge */}
                  {cat && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-md flex items-center gap-1" style={{ background: cat.color }}>
                      {cat.emoji} {cat.name}
                    </span>
                  )}
                  {/* Dia da semana */}
                  {v.dayOfWeek !== null && v.dayOfWeek !== undefined && (
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold shadow-md">{DAYS_SHORT[v.dayOfWeek]}</span>
                  )}
                  {/* Editar + Excluir */}
                  <div className="absolute bottom-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); setEditingId(v.id); }} className="h-6 w-6 rounded-full bg-black/60 text-white hover:bg-blue-600 flex items-center justify-center text-[10px]">✏️</button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(v.id, v.title); }} className="h-6 w-6 rounded-full bg-black/60 text-white hover:bg-destructive flex items-center justify-center text-[10px]">🗑️</button>
                  </div>
                </div>
                {/* Conteúdo */}
                <div className="p-3 space-y-1 flex-1 flex flex-col">
                  <h3 className="text-sm font-bold line-clamp-2 leading-snug">{v.title}</h3>
                  {v.notes && <p className="text-[11px] text-muted-foreground line-clamp-2 whitespace-pre-line flex-1">{v.notes}</p>}
                  <a href={v.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline mt-1 truncate inline-flex items-center gap-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Abrir no YouTube
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      ) : loaded ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-3 opacity-40">🎬</div>
          <p className="text-sm text-muted-foreground">{videos.length === 0 ? "Nenhum treino ainda. Clique em \"Adicionar treino\"." : "Nenhum treino encontrado com esse filtro."}</p>
        </div>
      ) : null}

      {/* Player modal */}
      {playingVideo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setPlayingId(null)}>
          <div className="bg-card border border-border rounded-xl max-w-3xl w-full overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 border-b border-border">
              <h3 className="text-sm font-bold line-clamp-1">{playingVideo.title}</h3>
              <button onClick={() => setPlayingId(null)} className="text-muted-foreground hover:text-foreground shrink-0 ml-2">✕</button>
            </div>
            <div className="aspect-video bg-black">
              <iframe
                src={youtubeEmbed(playingVideo.videoId)}
                title={playingVideo.title}
                className="h-full w-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            {playingVideo.notes && (
              <div className="p-3 border-t border-border">
                <label className="text-[10px] uppercase text-muted-foreground font-bold">Notas</label>
                <p className="text-sm text-foreground/80 mt-1 whitespace-pre-wrap">{playingVideo.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Editor modal */}
      {editingVideo && (
        <VideoEditorModal
          video={editingVideo}
          categories={categories}
          onClose={() => setEditingId(null)}
          onSave={(updated) => {
            saveVideos(videos.map((v) => v.id === updated.id ? updated : v));
            toast({ title: "Treino atualizado!" });
            setEditingId(null);
          }}
        />
      )}

      {/* Gerenciar categorias */}
      {showCatManager && (
        <CategoryManagerModal
          categories={categories}
          videos={videos}
          onClose={() => setShowCatManager(false)}
          onSave={(next) => { saveCategories(next); toast({ title: "Categorias atualizadas!" }); }}
        />
      )}

      <div className="h-8" />
    </div>
  );
}

// =================== Editor de vídeo (modal) ===================
function VideoEditorModal({
  video,
  categories,
  onClose,
  onSave,
}: {
  video: WorkoutVideo;
  categories: WorkoutCategory[];
  onClose: () => void;
  onSave: (v: WorkoutVideo) => void;
}) {
  const [url, setUrl] = useState(video.url);
  const [title, setTitle] = useState(video.title);
  const [category, setCategory] = useState<string>(video.category ?? "");
  const [dayOfWeek, setDayOfWeek] = useState<number | "">(video.dayOfWeek ?? "");
  const [duration, setDuration] = useState(video.duration ?? "");
  const [notes, setNotes] = useState(video.notes ?? "");
  const { toast } = useToast();

  const newVideoId = parseYouTubeId(url);

  function handleSave() {
    if (!newVideoId) { toast({ title: "URL inválida", variant: "destructive" }); return; }
    if (!title.trim()) { toast({ title: "Título obrigatório", variant: "destructive" }); return; }
    onSave({
      ...video,
      url: url.trim(),
      videoId: newVideoId,
      title: title.trim(),
      category: category || null,
      dayOfWeek: dayOfWeek === "" ? null : Number(dayOfWeek),
      duration: duration.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold">✏️ Editar treino</h3>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
          </div>

          {/* Preview */}
          {newVideoId && (
            <div className="aspect-video rounded-lg overflow-hidden border border-border bg-muted/30">
              <img src={youtubeThumb(newVideoId, "hq")} alt="preview" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.src = youtubeThumb(newVideoId, "mq"); }} />
            </div>
          )}

          <div className="space-y-2">
            <div>
              <label className="text-[10px] uppercase text-muted-foreground font-bold">URL do YouTube</label>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} className="h-9 text-sm bg-background border-border mt-0.5" />
              {url && !newVideoId && <p className="text-[10px] text-destructive mt-1">URL inválida</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase text-muted-foreground font-bold">Título</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-9 text-sm bg-background border-border mt-0.5" />
              </div>
              <div>
                <label className="text-[10px] uppercase text-muted-foreground font-bold">Duração</label>
                <Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Ex: 15 min" className="h-9 text-sm bg-background border-border mt-0.5" />
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase text-muted-foreground font-bold">Categoria</label>
              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                <button onClick={() => setCategory("")} className={cn("px-2 py-0.5 rounded-full text-[10px] border", !category ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground/30")}>Sem categoria</button>
                {categories.map((c) => (
                  <button key={c.id} onClick={() => setCategory(c.id)} className={cn("px-2 py-0.5 rounded-full text-[10px] border flex items-center gap-1", category === c.id ? "text-white border-transparent" : "border-border text-muted-foreground hover:border-foreground/30")} style={category === c.id ? { background: c.color, borderColor: c.color } : undefined}>
                    {c.emoji} {c.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase text-muted-foreground font-bold">Dia da semana</label>
              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                <button onClick={() => setDayOfWeek("")} className={cn("px-2 py-0.5 rounded-full text-[10px] border", dayOfWeek === "" ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground/30")}>Qualquer dia</button>
                {DAYS_OF_WEEK.map((d, idx) => (
                  <button key={idx} onClick={() => setDayOfWeek(idx)} className={cn("px-2 py-0.5 rounded-full text-[10px] border", dayOfWeek === idx ? "bg-blue-600 text-white border-blue-600" : "border-border text-muted-foreground hover:border-foreground/30")}>{DAYS_SHORT[idx]}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase text-muted-foreground font-bold">Notas</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full bg-background border border-border rounded-md p-2 text-sm resize-y mt-0.5" />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="ghost" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button onClick={handleSave} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white border-0">💾 Salvar</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =================== Gerenciador de Categorias ===================
const CAT_PALETTE = ["#dc2626", "#ea580c", "#d97706", "#16a34a", "#0891b2", "#7c3aed", "#db2777", "#2563eb", "#65a30d", "#9333ea", "#0d9488", "#ca8a04"];

function CategoryManagerModal({
  categories,
  videos,
  onClose,
  onSave,
}: {
  categories: WorkoutCategory[];
  videos: WorkoutVideo[];
  onClose: () => void;
  onSave: (c: WorkoutCategory[]) => void;
}) {
  const [list, setList] = useState<WorkoutCategory[]>(categories);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🏷️");
  const [color, setColor] = useState(CAT_PALETTE[0]);

  function addCategory() {
    if (!name.trim()) return;
    setList([...list, { id: makeId("cat"), name: name.trim(), emoji: emoji || "🏷️", color }]);
    setName(""); setEmoji("🏷️"); setColor(CAT_PALETTE[0]);
  }

  function removeCategory(id: string) {
    const count = videos.filter((v) => v.category === id).length;
    if (count > 0) {
      if (!confirm(`Existem ${count} treino(s) usando esta categoria. Eles ficarão sem categoria. Continuar?`)) return;
    } else {
      if (!confirm("Excluir esta categoria?")) return;
    }
    setList(list.filter((c) => c.id !== id));
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl max-w-md w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold flex items-center gap-2">🏷️ Categorias de Treino</h3>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
          </div>

          <div className="space-y-1.5">
            {list.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Nenhuma categoria ainda.</p>}
            {list.map((c) => {
              const count = videos.filter((v) => v.category === c.id).length;
              return (
                <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 border border-border group">
                  <span className="h-7 w-7 rounded-md flex items-center justify-center text-sm shrink-0" style={{ background: c.color }}>{c.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate">{c.name}</div>
                    <div className="text-[9px] text-muted-foreground">{count} treino{count !== 1 ? "s" : ""}</div>
                  </div>
                  <button onClick={() => removeCategory(c.id)} className="text-muted-foreground hover:text-destructive text-xs opacity-0 group-hover:opacity-100">🗑️</button>
                </div>
              );
            })}
          </div>

          <div className="border-t border-border pt-3 space-y-2">
            <div className="text-[10px] uppercase text-muted-foreground font-bold">Nova categoria</div>
            <div className="flex items-center gap-2">
              <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} className="w-12 h-9 text-center text-lg bg-background border-border" />
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome (ex: Funcional)" className="flex-1 h-9 text-sm bg-background border-border" onKeyDown={(e) => { if (e.key === "Enter") addCategory(); }} />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {CAT_PALETTE.map((c) => (
                <button key={c} onClick={() => setColor(c)} className={cn("h-6 w-6 rounded-md border-2 transition-all", color === c ? "border-foreground scale-110" : "border-transparent")} style={{ background: c }} />
              ))}
            </div>
            <Button size="sm" onClick={addCategory} disabled={!name.trim()} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white border-0">+ Adicionar categoria</Button>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="ghost" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button onClick={() => { onSave(list); onClose(); }} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white border-0">💾 Salvar</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =================== Agenda Semanal ===================
function AgendaView() {
  const { data: schedule, save: saveSchedule, loaded } = useExerciciosStore<DaySchedule[]>(SCHEDULE_KEY, []);
  const { toast } = useToast();
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editExtras, setEditExtras] = useState("");

  function getDay(dayOfWeek: number): DaySchedule | undefined {
    return schedule.find((s) => s.dayOfWeek === dayOfWeek);
  }

  function saveDay(dayOfWeek: number) {
    const existing = getDay(dayOfWeek);
    if (existing) {
      saveSchedule(schedule.map((s) => s.id === existing.id ? { ...s, title: editTitle.trim(), extras: editExtras.trim() } : s));
    } else {
      saveSchedule([...schedule, { id: makeId("day"), dayOfWeek, title: editTitle.trim(), extras: editExtras.trim() }]);
    }
    toast({ title: "Agenda salva!" });
    setEditingDay(null);
  }

  function clearDay(dayOfWeek: number) {
    const existing = getDay(dayOfWeek);
    if (!existing) return;
    if (!confirm("Limpar este dia?")) return;
    saveSchedule(schedule.filter((s) => s.id !== existing.id));
    toast({ title: "Dia limpo", variant: "destructive" });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold flex items-center gap-2">📅 Agenda Semanal de Treinos</h2>
      </div>

      <p className="text-xs text-muted-foreground -mt-2">Toque em qualquer dia para editar o treino principal e aulas extras (estilo Aulas Academia).</p>

      {loaded && (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6, 0].map((dayIdx) => {
            const day = getDay(dayIdx);
            const isEditing = editingDay === dayIdx;
            const isToday = new Date().getDay() === dayIdx;
            return (
              <div key={dayIdx} className={cn("rounded-xl border overflow-hidden transition-all", isToday ? "border-blue-500 dark:border-blue-400 bg-blue-50/40 dark:bg-blue-950/20" : "border-border bg-card")}>
                {/* Header do dia */}
                <div className="flex items-center justify-between px-3 py-2.5 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{DAYS_OF_WEEK[dayIdx]}</span>
                    {isToday && <span className="px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[9px] font-bold">HOJE</span>}
                    {day && <span className="text-[10px] text-muted-foreground">✓ preenchido</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    {day && !isEditing && (
                      <button onClick={() => clearDay(dayIdx)} className="text-[10px] text-muted-foreground hover:text-destructive px-1.5 py-0.5">🗑️ Limpar</button>
                    )}
                    <button
                      onClick={() => {
                        if (isEditing) { setEditingDay(null); }
                        else { setEditingDay(dayIdx); setEditTitle(day?.title ?? ""); setEditExtras(day?.extras ?? ""); }
                      }}
                      className="text-[10px] px-2 py-0.5 rounded-md border border-border hover:border-foreground/30 hover:bg-muted/40 transition-colors"
                    >
                      {isEditing ? "✕ Fechar" : day ? "✏️ Editar" : "+ Preencher"}
                    </button>
                  </div>
                </div>

                {/* Conteúdo */}
                {isEditing ? (
                  <div className="p-3 space-y-2 bg-muted/10">
                    <div>
                      <label className="text-[10px] uppercase text-muted-foreground font-bold">Treino principal / horário</label>
                      <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Ex: Normal 06:00 às 08:00" className="h-9 text-sm bg-background border-border mt-0.5" />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-muted-foreground font-bold">Aulas extras / observações</label>
                      <textarea value={editExtras} onChange={(e) => setEditExtras(e.target.value)} rows={3} placeholder="Ex: Ir para unidade 3 Metrô Tatuapé às 17:00 - Fazer Muai Thai às 17:30" className="w-full bg-background border border-border rounded-md p-2 text-sm resize-y mt-0.5" />
                      <p className="text-[9px] text-muted-foreground mt-1">💡 Dica: use uma linha por aula extra para melhor leitura.</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditingDay(null)} className="flex-1">Cancelar</Button>
                      <Button size="sm" onClick={() => saveDay(dayIdx)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white border-0">💾 Salvar</Button>
                    </div>
                  </div>
                ) : day ? (
                  <div className="p-3 space-y-1.5">
                    {day.title && <div className="text-sm font-semibold text-foreground flex items-center gap-1.5"><span className="text-emerald-600 dark:text-emerald-400">●</span> {day.title}</div>}
                    {day.extras && (
                      <div className="text-xs text-foreground/80 whitespace-pre-line pl-4 border-l-2 border-muted">{day.extras}</div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 text-xs text-muted-foreground italic">Sem treino programado.</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="p-3 rounded-lg bg-muted/20 border border-border">
        <p className="text-[11px] text-muted-foreground">
          💡 <strong>Dica:</strong> Use a aba <strong>🎬 Treinos (YouTube)</strong> para salvar links de vídeos de treino. Aqui você pode descrever sua rotina semanal de academia (aulas, horários, etc).
        </p>
      </div>

      <div className="h-8" />
    </div>
  );
}
