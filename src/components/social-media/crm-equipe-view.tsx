"use client";

import { useMemo, useState } from "react";
import { useTeam } from "@/hooks/use-team";
import { useToast } from "@/hooks/use-toast";
import type { TeamMember } from "@/lib/team";
import { TeamEditorDialog } from "./team-editor-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function CrmEquipeView() {
  const { team, addMember, updateMember, removeMember, resetAll } = useTeam();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const editingMember = useMemo(
    () => team.find((m) => m.id === editingId) ?? null,
    [team, editingId]
  );

  const filteredTeam = useMemo(() => {
    if (!search.trim()) return team;
    const q = search.toLowerCase();
    return team.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q) ||
        m.func.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
    );
  }, [team, search]);

  function openNew() {
    setEditingId(null);
    setDialogOpen(true);
  }

  function openEdit(id: string) {
    setEditingId(id);
    setDialogOpen(true);
  }

  function handleSubmit(data: Omit<TeamMember, "id" | "createdAt" | "updatedAt">) {
    if (editingId) {
      updateMember(editingId, data);
      toast({ title: "Membro atualizado", description: data.name });
    } else {
      addMember(data);
      toast({ title: "Membro criado", description: data.name });
    }
    setEditingId(null);
  }

  function handleDelete(id: string) {
    const m = team.find((x) => x.id === id);
    removeMember(id);
    toast({
      title: "Membro excluído",
      description: m?.name,
      variant: "destructive",
    });
  }

  function handleReset() {
    if (confirm("Restaurar equipe de demonstração? Suas alterações serão perdidas.")) {
      resetAll();
      toast({ title: "Equipe restaurada" });
    }
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">👥</span>
            <h2 className="text-base font-bold text-foreground">CRM Equipe</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            {team.length} {team.length === 1 ? "membro" : "membros"} · Pagamentos, contratos e contatos
          </p>
        </div>
        <Button onClick={openNew} className="bg-blue-600 hover:bg-blue-500 text-white">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Nova
        </Button>
      </div>

      {/* Busca */}
      <div className="relative mb-5 max-w-md">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        >
          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
          <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar membro..."
          className="pl-9"
        />
      </div>

      {/* Tabela */}
      {filteredTeam.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3 opacity-40">👥</div>
          <p className="text-muted-foreground text-sm">
            {team.length === 0
              ? 'Nenhum membro ainda. Crie o primeiro com o botão "Nova".'
              : "Nenhum membro encontrado com essa busca."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-foreground/70 dark:text-muted-foreground text-xs uppercase font-semibold">Nome</TableHead>
                  <TableHead className="text-foreground/70 dark:text-muted-foreground text-xs uppercase font-semibold">Cargo</TableHead>
                  <TableHead className="text-foreground/70 dark:text-muted-foreground text-xs uppercase font-semibold">Função</TableHead>
                  <TableHead className="text-foreground/70 dark:text-muted-foreground text-xs uppercase font-semibold">Email</TableHead>
                  <TableHead className="text-foreground/70 dark:text-muted-foreground text-xs uppercase font-semibold">WhatsApp</TableHead>
                  <TableHead className="text-foreground/70 dark:text-muted-foreground text-xs uppercase font-semibold">Aniversário</TableHead>
                  <TableHead className="text-foreground/70 dark:text-muted-foreground text-xs uppercase font-semibold">Contrato</TableHead>
                  <TableHead className="text-foreground/70 dark:text-muted-foreground text-xs uppercase font-semibold">Endereço</TableHead>
                  <TableHead className="text-foreground/70 dark:text-muted-foreground text-xs uppercase font-semibold text-right">Valor</TableHead>
                  <TableHead className="text-foreground/70 dark:text-muted-foreground text-xs uppercase font-semibold">Próx. pagamento</TableHead>
                  <TableHead className="text-foreground/70 dark:text-muted-foreground text-xs uppercase font-semibold">Contrato anexo</TableHead>
                  <TableHead className="text-foreground/70 dark:text-muted-foreground text-xs uppercase font-semibold text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeam.map((m) => (
                  <TeamRow
                    key={m.id}
                    member={m}
                    onEdit={() => openEdit(m.id)}
                    onDelete={() => handleDelete(m.id)}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Footer com "Nova página" */}
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors text-xs"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Nova página
        </button>
        <button
          onClick={handleReset}
          className="text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 transition-colors"
        >
          Restaurar demo
        </button>
      </div>

      <TeamEditorDialog
        key={`team-${dialogOpen}-${editingId ?? "new"}`}
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditingId(null);
        }}
        editingMember={editingMember}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </div>
  );
}

function TeamRow({
  member,
  onEdit,
  onDelete,
}: {
  member: TeamMember;
  onEdit: () => void;
  onDelete: () => void;
}) {
  function formatBRL(v: number): string {
    if (!v) return "—";
    return v.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    });
  }

  function formatDate(d?: string): string {
    if (!d) return "—";
    return new Date(d + "T00:00:00").toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function formatBirthday(d?: string): string {
    if (!d) return "—";
    return new Date(d + "T00:00:00").toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
  }

  function whatsappLink(num: string): string {
    const cleaned = num.replace(/[^\d]/g, "");
    return cleaned ? `https://wa.me/55${cleaned}` : "#";
  }

  return (
    <TableRow className="border-border hover:bg-muted/40">
      <TableCell>
        <button onClick={onEdit} className="flex items-center gap-2 text-left">
          <span
            className="h-8 w-8 rounded-full flex items-center justify-center text-base shrink-0 ring-1 ring-black/5 dark:ring-white/10 shadow-sm"
            style={{
              background: `linear-gradient(135deg, ${member.color} 0%, ${member.color}dd 100%)`,
              color: "#ffffff",
            }}
          >
            {member.emoji || member.name.slice(0, 2).toUpperCase()}
          </span>
          <span className="text-sm font-semibold text-foreground line-clamp-1">
            {member.name}
          </span>
        </button>
      </TableCell>
      <TableCell>
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border"
          style={{
            background: `${member.roleColor}1A`,
            color: member.roleColor,
            borderColor: `${member.roleColor}40`,
          }}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ background: member.roleColor }}
          />
          {member.role || "—"}
        </span>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground max-w-[180px]">
        <span className="line-clamp-2">{member.func || "—"}</span>
      </TableCell>
      <TableCell>
        {member.email ? (
          <a
            href={`mailto:${member.email}`}
            className="text-xs text-primary hover:underline line-clamp-1"
            title={member.email}
          >
            {member.email}
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        {member.whatsapp ? (
          <a
            href={whatsappLink(member.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline"
          >
            {member.whatsapp}
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {formatBirthday(member.birthday)}
      </TableCell>
      <TableCell>
        <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md bg-muted text-foreground">
          {member.contract || "—"}
        </span>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground max-w-[160px]">
        <span className="line-clamp-2">{member.address || "—"}</span>
      </TableCell>
      <TableCell className="text-right text-sm font-bold text-foreground">
        {formatBRL(member.value)}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {formatDate(member.nextPayment)}
      </TableCell>
      <TableCell>
        {member.contractFile && member.contractFileName ? (
          <a
            href={member.contractFile}
            download={member.contractFileName}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            title={member.contractFileName}
          >
            <span>📎</span>
            <span className="line-clamp-1 max-w-[100px]">{member.contractFileName}</span>
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={onEdit}
            className="h-7 w-7 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 flex items-center justify-center transition-colors"
            aria-label="Editar"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path
                d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className={cn(
              "h-7 w-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10",
              "flex items-center justify-center transition-colors"
            )}
            aria-label="Excluir"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
}
