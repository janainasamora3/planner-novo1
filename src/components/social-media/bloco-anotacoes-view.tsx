"use client";

import { useMemo, useState } from "react";
import { useNotes } from "@/hooks/use-notes";
import { useToast } from "@/hooks/use-toast";
import type { Note, NoteStep } from "@/lib/notes";
import { NoteEditorDialog } from "./note-editor-dialog";

export function BlocoAnotacoesView() {
  const {
    notes,
    addNote,
    updateNote,
    removeNote,
    toggleStep,
    togglePinned,
    resetAll,
  } = useNotes();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const editingNote = useMemo(
    () => notes.find((n) => n.id === editingId) ?? null,
    [notes, editingId]
  );

  const filteredNotes = useMemo(() => {
    let list = [...notes];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.steps.some((s) => s.text.toLowerCase().includes(q))
      );
    }
    // Pinned primeiro, depois por updatedAt decrescente
    list.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    });
    return list;
  }, [notes, search]);

  function openNew() {
    setEditingId(null);
    setDialogOpen(true);
  }

  function openEdit(id: string) {
    setEditingId(id);
    setDialogOpen(true);
  }

  function handleSubmit(data: {
    title: string;
    content: string;
    steps: NoteStep[];
    emoji: string;
    color: string;
    pinned: boolean;
  }) {
    if (editingId) {
      updateNote(editingId, data);
      toast({ title: "Anotação atualizada", description: data.title });
    } else {
      addNote(data);
      toast({ title: "Anotação criada", description: data.title });
    }
    setEditingId(null);
  }

  function handleDelete(id: string) {
    const n = notes.find((x) => x.id === id);
    removeNote(id);
    toast({
      title: "Anotação excluída",
      description: n?.title,
      variant: "destructive",
    });
  }

  function handleReset() {
    if (confirm("Restaurar anotações de demonstração? Suas alterações serão perdidas.")) {
      resetAll();
      toast({ title: "Anotações restauradas" });
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">📝</span>
            <h2 className="text-base font-semibold text-foreground">Bloco de Anotações</h2>
          </div>
          <p className="text-xs text-foreground/65">
            {notes.length} {notes.length === 1 ? "anotação" : "anotações"} · Passo a passo de contato com clientes
          </p>
        </div>
        <button
          onClick={openNew}
          className="h-9 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Nova anotação
        </button>
      </div>

      {/* Busca */}
      <div className="relative mb-5 max-w-md">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/55"
        >
          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
          <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar anotação..."
          className="w-full h-9 pl-9 pr-3 rounded-lg bg-muted/30 border border-border text-foreground text-sm placeholder:text-foreground/55 focus:outline-none focus:border-blue-500/50"
        />
      </div>

      {/* Grid de notas (estilo masonry simples com columns) */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3 opacity-40">📝</div>
          <p className="text-foreground/65 text-sm">
            {notes.length === 0
              ? "Nenhuma anotação ainda. Crie a primeira com o botão \"Nova anotação\"."
              : "Nenhuma anotação encontrada com essa busca."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={() => openEdit(note.id)}
              onToggleStep={(stepId) => toggleStep(note.id, stepId)}
              onTogglePin={() => togglePinned(note.id)}
              onDelete={() => handleDelete(note.id)}
            />
          ))}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleReset}
          className="text-[11px] text-foreground/55 hover:text-foreground/60 px-2 py-1 transition-colors"
        >
          Restaurar demo
        </button>
      </div>

      <NoteEditorDialog
        key={`note-${dialogOpen}-${editingId ?? "new"}`}
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditingId(null);
        }}
        editingNote={editingNote}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </div>
  );
}

function NoteCard({
  note,
  onEdit,
  onToggleStep,
  onTogglePin,
  onDelete,
}: {
  note: Note;
  onEdit: () => void;
  onToggleStep: (stepId: string) => void;
  onTogglePin: () => void;
  onDelete: () => void;
}) {
  const doneCount = note.steps.filter((s) => s.done).length;
  const progress = note.steps.length > 0 ? (doneCount / note.steps.length) * 100 : 0;

  return (
    <div
      className="group relative rounded-xl bg-card border border-border overflow-hidden hover:border-foreground/25 transition-all hover:-translate-y-0.5 flex flex-col"
      style={{ borderTop: `3px solid ${note.color}` }}
    >
      {/* Header com emoji, título e ações */}
      <div className="p-3 pb-2 flex items-start gap-2">
        <div
          className="h-9 w-9 rounded-md flex items-center justify-center text-lg shrink-0"
          style={{
            background: `linear-gradient(135deg, ${note.color} 0%, #0a0a0a 100%)`,
            color: "#ffffff",
          }}
        >
          {note.emoji || "📝"}
        </div>
        <button
          onClick={onEdit}
          className="flex-1 min-w-0 text-left"
        >
          <h3 className="text-sm font-semibold text-foreground/90 line-clamp-2 leading-snug">
            {note.title}
          </h3>
        </button>
        {/* Ações rápidas */}
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onTogglePin}
            className={`h-6 w-6 rounded text-xs flex items-center justify-center transition-colors ${
              note.pinned
                ? "text-amber-400 hover:bg-amber-500/10"
                : "text-foreground/55 hover:text-foreground/60 hover:bg-accent"
            }`}
            title={note.pinned ? "Desafixar" : "Fixar no topo"}
          >
            📌
          </button>
          <button
            onClick={onDelete}
            className="h-6 w-6 rounded text-foreground/55 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-colors"
            title="Excluir"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Badge pinned */}
      {note.pinned && (
        <div className="absolute top-0 right-0 bg-amber-500/20 text-amber-300 text-[9px] font-medium px-1.5 py-0.5 rounded-bl-md">
          FIXADA
        </div>
      )}

      {/* Conteúdo */}
      {note.content && (
        <div className="px-3 pb-2">
          <p className="text-xs text-foreground/50 line-clamp-3 whitespace-pre-wrap leading-relaxed">
            {note.content}
          </p>
        </div>
      )}

      {/* Progresso */}
      {note.steps.length > 0 && (
        <div className="px-3 pb-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-foreground/65 uppercase tracking-wide">
              {doneCount}/{note.steps.length} passos
            </span>
            <span className="text-[10px] text-foreground/55">{Math.round(progress)}%</span>
          </div>
          <div className="h-1 rounded-full bg-accent overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progress}%`, background: note.color }}
            />
          </div>
        </div>
      )}

      {/* Checklist de passos (até 5 visíveis, resto com +N) */}
      {note.steps.length > 0 && (
        <div className="px-3 py-2 space-y-1 flex-1">
          {note.steps.slice(0, 5).map((step, i) => (
            <button
              key={step.id}
              onClick={() => onToggleStep(step.id)}
              className="w-full flex items-center gap-1.5 text-left group/step"
            >
              <span
                className={`h-3.5 w-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                  step.done
                    ? "bg-emerald-500/30 border-emerald-500/60 text-emerald-300"
                    : "border-border group-hover/step:border-foreground/40"
                }`}
              >
                {step.done && (
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </span>
              <span
                className={`text-[11px] leading-tight ${
                  step.done ? "text-foreground/55 line-through" : "text-foreground/70"
                }`}
              >
                {step.text}
              </span>
            </button>
          ))}
          {note.steps.length > 5 && (
            <p className="text-[10px] text-foreground/55 italic pl-5">
              + {note.steps.length - 5} passos...
            </p>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="px-3 py-2 border-t border-border flex items-center justify-between">
        <span className="text-[10px] text-foreground/55">
          {new Date(note.updatedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
        </span>
        <button
          onClick={onEdit}
          className="text-[10px] text-foreground/65 hover:text-blue-400 transition-colors"
        >
          Editar →
        </button>
      </div>
    </div>
  );
}
