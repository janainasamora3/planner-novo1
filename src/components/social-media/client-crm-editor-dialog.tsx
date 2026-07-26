"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ColorPicker } from "@/components/ui/color-picker";
import { PRESET_EMOJIS, PRESET_COLORS_EXTENDED } from "@/lib/presets";
import {
  FREQUENCY_LABELS,
  FREQUENCY_OPTIONS,
  NICHE_OPTIONS,
  STATUS_COLORS,
  STATUS_LABELS,
  type Client,
  type ClientStatus,
} from "@/lib/clients-crm";
import { ServiceTypeManager } from "./service-type-manager";
import { cn, readableTextColor } from "@/lib/utils";

interface ClientCrmEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingClient?: Client | null;
  onSubmit: (data: Omit<Client, "id" | "createdAt" | "updatedAt">) => void;
  onDelete?: (id: string) => void;
}

const STATUS_OPTIONS: ClientStatus[] = ["ativo", "pausado", "inativo", "lead"];

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ClientCrmEditorDialog({
  open,
  onOpenChange,
  editingClient,
  onSubmit,
  onDelete,
}: ClientCrmEditorDialogProps) {
  const isEditing = !!editingClient;

  const [name, setName] = useState(editingClient?.name ?? "");
  const [handle, setHandle] = useState(editingClient?.handle ?? "");
  const [status, setStatus] = useState<ClientStatus>(editingClient?.status ?? "ativo");
  const [emoji, setEmoji] = useState(editingClient?.emoji ?? "");
  const [color, setColor] = useState(editingClient?.color ?? "#1e3a8a");
  const [startDate, setStartDate] = useState(editingClient?.startDate ?? "");
  const [endDate, setEndDate] = useState(editingClient?.endDate ?? "");
  const [value, setValue] = useState<string>(
    editingClient?.value !== undefined ? String(editingClient.value) : ""
  );
  const [responsible, setResponsible] = useState(editingClient?.responsible ?? "");
  const [email, setEmail] = useState(editingClient?.email ?? "");
  const [whatsapp, setWhatsapp] = useState(editingClient?.whatsapp ?? "");
  const [niche, setNiche] = useState(editingClient?.niche ?? "");
  const [serviceTypeIds, setServiceTypeIds] = useState<string[]>(
    editingClient?.serviceTypeIds ?? []
  );
  const [postFrequency, setPostFrequency] = useState(editingClient?.postFrequency ?? "");
  const [notes, setNotes] = useState(editingClient?.notes ?? "");
  const [contractFile, setContractFile] = useState<string | undefined>(editingClient?.contractFile);
  const [contractFileName, setContractFileName] = useState<string | undefined>(editingClient?.contractFileName);
  const [terminationContractFile, setTerminationContractFile] = useState<string | undefined>(
    editingClient?.terminationContractFile
  );
  const [terminationContractFileName, setTerminationContractFileName] = useState<string | undefined>(
    editingClient?.terminationContractFileName
  );

  async function handleContractUpload(e: React.ChangeEvent<HTMLInputElement>, kind: "contract" | "termination") {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      alert("Arquivo muito grande. Limite: 4MB.");
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      if (kind === "contract") {
        setContractFile(dataUrl);
        setContractFileName(file.name);
      } else {
        setTerminationContractFile(dataUrl);
        setTerminationContractFileName(file.name);
      }
    } catch {
      alert("Erro ao ler arquivo.");
    }
  }

  function clearContract(kind: "contract" | "termination") {
    if (kind === "contract") {
      setContractFile(undefined);
      setContractFileName(undefined);
    } else {
      setTerminationContractFile(undefined);
      setTerminationContractFileName(undefined);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    let h = handle.trim();
    if (h && !h.startsWith("@")) h = "@" + h;
    onSubmit({
      name: name.trim(),
      handle: h,
      status,
      emoji: emoji.trim(),
      color,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      value: value ? Number(value) : undefined,
      responsible: responsible.trim() || undefined,
      email: email.trim() || undefined,
      whatsapp: whatsapp.trim() || undefined,
      niche: niche || undefined,
      serviceTypeIds,
      postFrequency: postFrequency || undefined,
      notes: notes.trim() || undefined,
      contractFile,
      contractFileName,
      terminationContractFile,
      terminationContractFileName,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background text-foreground max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar cliente" : "Novo cliente"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name + handle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Nome *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Café Aurora"
                autoFocus
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">@ Handle</Label>
              <Input
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="@cafeaurora"
              />
            </div>
          </div>

          {/* Status — 4 colored badges */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Status</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={cn(
                    "h-9 rounded-md text-xs font-medium border-2 transition-all",
                    status === s
                      ? ""
                      : "bg-background text-muted-foreground border-border hover:border-foreground/30"
                  )}
                  style={
                    status === s
                      ? {
                          background: STATUS_COLORS[s],
                          borderColor: STATUS_COLORS[s],
                          color: "#ffffff",
                        }
                      : undefined
                  }
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Emoji + color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Ícone</Label>
              <Input
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                placeholder="☕"
                maxLength={4}
              />
              <div className="flex flex-wrap gap-1 pt-1">
                {PRESET_EMOJIS.slice(0, 16).map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className="h-7 w-7 rounded-md bg-muted hover:bg-accent text-sm flex items-center justify-center"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Cor</Label>
              <ColorPicker value={color} onChange={setColor} />
            </div>
          </div>

          {/* Período */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Início</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Fim</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Valor + Responsável */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Valor (R$ / mês)</Label>
              <Input
                type="number"
                min={0}
                step={100}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="3500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Responsável</Label>
              <Input
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                placeholder="Marina"
              />
            </div>
          </div>

          {/* Email + WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">E-mail</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contato@cliente.com"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">WhatsApp</Label>
              <Input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="(11) 98765-4321"
              />
            </div>
          </div>

          {/* Nicho + Frequência */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Nicho</Label>
              <select
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground"
              >
                <option value="">Selecione...</option>
                {NICHE_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Frequência de posts</Label>
              <select
                value={postFrequency}
                onChange={(e) => setPostFrequency(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground"
              >
                <option value="">Selecione...</option>
                {FREQUENCY_OPTIONS.map((f) => (
                  <option key={f} value={f}>{FREQUENCY_LABELS[f]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Serviços */}
          <ServiceTypeManager
            selectedIds={serviceTypeIds}
            onChange={setServiceTypeIds}
          />

          {/* Contrato + Rescisão */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Contrato (PDF/imagem)</Label>
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer px-2 h-9 rounded-md border border-dashed border-border hover:border-primary/40">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {contractFileName ? "Trocar" : "Enviar"}
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleContractUpload(e, "contract")}
                    className="hidden"
                  />
                </label>
                {contractFileName && (
                  <>
                    <span className="text-xs text-foreground truncate flex-1" title={contractFileName}>
                      📎 {contractFileName}
                    </span>
                    <button
                      type="button"
                      onClick={() => clearContract("contract")}
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      ✕
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Rescisão (opcional)</Label>
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer px-2 h-9 rounded-md border border-dashed border-border hover:border-primary/40">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {terminationContractFileName ? "Trocar" : "Enviar"}
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleContractUpload(e, "termination")}
                    className="hidden"
                  />
                </label>
                {terminationContractFileName && (
                  <>
                    <span className="text-xs text-foreground truncate flex-1" title={terminationContractFileName}>
                      📎 {terminationContractFileName}
                    </span>
                    <button
                      type="button"
                      onClick={() => clearContract("termination")}
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      ✕
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Notas</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anotações livres sobre o cliente..."
              rows={3}
              className="resize-none"
            />
          </div>

          <DialogFooter className="gap-2">
            {isEditing && onDelete && editingClient && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  if (confirm(`Excluir "${editingClient.name}"?`)) {
                    onDelete(editingClient.id);
                    onOpenChange(false);
                  }
                }}
                className="text-destructive hover:text-destructive"
              >
                Excluir
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white border-0">
              {isEditing ? "Salvar" : "Criar cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
