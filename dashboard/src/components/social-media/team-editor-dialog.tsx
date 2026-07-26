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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PRESET_EMOJIS } from "@/lib/presets";
import { fileToDataURL, formatBytes } from "@/lib/file-upload";
import {
  CONTRACT_TYPES,
  ROLE_PRESETS,
  type TeamMember,
} from "@/lib/team";
import { cn } from "@/lib/utils";

interface TeamEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingMember?: TeamMember | null;
  onSubmit: (data: Omit<TeamMember, "id" | "createdAt" | "updatedAt">) => void;
  onDelete?: (id: string) => void;
}

export function TeamEditorDialog({
  open,
  onOpenChange,
  editingMember,
  onSubmit,
  onDelete,
}: TeamEditorDialogProps) {
  const isEditing = !!editingMember;
  const [name, setName] = useState(editingMember?.name ?? "");
  const [emoji, setEmoji] = useState(editingMember?.emoji ?? "");
  const [color, setColor] = useState(editingMember?.color ?? "#7c3aed");
  const [role, setRole] = useState(editingMember?.role ?? "");
  const [func, setFunc] = useState(editingMember?.func ?? "");
  const [roleColor, setRoleColor] = useState(editingMember?.roleColor ?? "#7c3aed");
  const [email, setEmail] = useState(editingMember?.email ?? "");
  const [whatsapp, setWhatsapp] = useState(editingMember?.whatsapp ?? "");
  const [birthday, setBirthday] = useState(editingMember?.birthday ?? "");
  const [contract, setContract] = useState(editingMember?.contract ?? "PJ");
  const [address, setAddress] = useState(editingMember?.address ?? "");
  const [value, setValue] = useState<string>(
    editingMember?.value !== undefined ? String(editingMember.value) : ""
  );
  const [nextPayment, setNextPayment] = useState(editingMember?.nextPayment ?? "");
  const [contractFile, setContractFile] = useState<string | undefined>(
    editingMember?.contractFile
  );
  const [contractFileName, setContractFileName] = useState<string | undefined>(
    editingMember?.contractFileName
  );

  function handleRolePreset(presetLabel: string, presetColor: string) {
    setRole(presetLabel);
    setRoleColor(presetColor);
    // Sync member color with roleColor if user hasn't customized
    setColor(presetColor);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert("Arquivo muito grande. Máximo 3MB.");
      return;
    }
    try {
      const dataUrl = await fileToDataURL(file);
      setContractFile(dataUrl);
      setContractFileName(file.name);
    } catch (err) {
      console.error(err);
      alert("Erro ao ler arquivo.");
    }
  }

  function clearFile() {
    setContractFile(undefined);
    setContractFileName(undefined);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const numValue = value.trim() ? Number(value.replace(/[^\d]/g, "")) : 0;
    onSubmit({
      name: name.trim(),
      emoji: emoji.trim(),
      color,
      role: role.trim(),
      func: func.trim(),
      roleColor,
      email: email.trim(),
      whatsapp: whatsapp.trim(),
      birthday,
      contract,
      address: address.trim(),
      value: Number.isFinite(numValue) ? numValue : 0,
      nextPayment,
      contractFile,
      contractFileName,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card text-card-foreground border-border max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isEditing ? "Editar membro" : "Novo membro"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cargo presets */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs uppercase tracking-wide">
              Cargo (presets)
            </Label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 rounded-md border border-border bg-background/50">
              {ROLE_PRESETS.map((preset) => {
                const isActive = role === preset.label;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleRolePreset(preset.label, preset.color)}
                    className={cn(
                      "flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-medium border transition-all",
                      isActive
                        ? "text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                    style={{
                      background: isActive ? preset.color : "transparent",
                      borderColor: isActive ? preset.color : "var(--border)",
                    }}
                  >
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ background: preset.color }}
                    />
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nome */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs uppercase tracking-wide">
              Nome
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Marina Costa"
              autoFocus
              required
            />
          </div>

          {/* Cargo + Função */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                Cargo
              </Label>
              <Input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Ex: Social Media operacional"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                Função
              </Label>
              <Input
                value={func}
                onChange={(e) => setFunc(e.target.value)}
                placeholder="O que faz"
              />
            </div>
          </div>

          {/* Emoji + Cor do cargo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                Emoji
              </Label>
              <Input
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                placeholder="🎨"
                maxLength={4}
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {PRESET_EMOJIS.slice(0, 16).map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className="h-7 w-7 rounded-md bg-muted hover:bg-accent text-base flex items-center justify-center transition-colors"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                Cor do cargo
              </Label>
              <ColorPicker value={roleColor} onChange={setRoleColor} />
              <Label className="text-muted-foreground text-xs uppercase tracking-wide mt-3 block">
                Cor do avatar
              </Label>
              <ColorPicker value={color} onChange={setColor} />
            </div>
          </div>

          {/* Email + WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                Email
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contato@agencia.com"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                WhatsApp
              </Label>
              <Input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="11987654321"
                inputMode="numeric"
              />
            </div>
          </div>

          {/* Aniversário + Contrato */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                Aniversário
              </Label>
              <Input
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                Tipo de contrato
              </Label>
              <Select value={contract} onValueChange={setContract}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {CONTRACT_TYPES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs uppercase tracking-wide">
              Endereço
            </Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Cidade, Estado"
            />
          </div>

          {/* Valor + Próx. pagamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                Valor (R$)
              </Label>
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="2800"
                inputMode="numeric"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                Próx. pagamento
              </Label>
              <Input
                type="date"
                value={nextPayment}
                onChange={(e) => setNextPayment(e.target.value)}
              />
            </div>
          </div>

          {/* Contrato anexo */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs uppercase tracking-wide">
              Contrato anexo (PDF/imagem, máx 3MB)
            </Label>
            {contractFile && contractFileName ? (
              <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/50 px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base">📎</span>
                  <div className="min-w-0">
                    <p className="text-xs text-foreground truncate">{contractFileName}</p>
                    <p className="text-[10px] text-muted-foreground">Anexado</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {contractFile.startsWith("data:image") && (
                    <a
                      href={contractFile}
                      download={contractFileName}
                      className="text-[11px] text-primary hover:underline"
                    >
                      Ver
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={clearFile}
                    className="text-[11px] text-destructive hover:underline"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border bg-background/50 px-3 py-5 cursor-pointer hover:border-primary/50 transition-colors">
                <span className="text-muted-foreground text-xs">
                  Clique para anexar o contrato
                </span>
                <span className="text-[10px] text-muted-foreground/70">PDF, PNG, JPG</span>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}
            {contractFileName && (
              <p className="text-[10px] text-muted-foreground">
                {formatBytes(Math.ceil((contractFile?.length ?? 0) * 0.75))}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 flex-wrap">
            {isEditing && onDelete && editingMember && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  if (confirm(`Excluir membro "${editingMember.name}"?`)) {
                    onDelete(editingMember.id);
                    onOpenChange(false);
                  }
                }}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                Excluir
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary text-primary-foreground">
              {isEditing ? "Salvar" : "Criar membro"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
