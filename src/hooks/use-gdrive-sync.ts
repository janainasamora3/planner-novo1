"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Google Drive Sync — sincronização automática via Google Drive.
 * Não requer login/senha — usa a conta Google já logada no navegador.
 * 
 * Como funciona:
 * 1. Na primeira vez, pede permissão pro Google Drive (OAuth popup)
 * 2. Salva todos os dados do app num arquivo JSON no Drive ("dashboard-backup.json")
 * 3. A cada 30 segundos, faz upload automático (se houver mudanças)
 * 4. Ao abrir o app em outro dispositivo, baixa automaticamente
 * 
 * Pré-requisitos:
 * - Criar um OAuth Client ID no Google Cloud Console
 * - Configurar o origen autorizado (URL do Netlify)
 */

const SYNC_INTERVAL = 30000; // 30 segundos
const FILE_NAME = "dashboard-sync.json";
const STORAGE_KEY = "dashboard.gdriveSync.v1";

interface SyncState {
  enabled: boolean;
  lastSync: number | null;
  syncing: boolean;
  error: string | null;
}

export function useGoogleDriveSync() {
  const [state, setState] = useState<SyncState>({
    enabled: false,
    lastSync: null,
    syncing: false,
    error: null,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastDataHash = useRef<string>("");

  // Verifica se já está configurado
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.enabled) {
          setState((prev) => ({ ...prev, enabled: true, lastSync: parsed.lastSync ?? null }));
        }
      }
    } catch {}
  }, []);

  // Coleta todos os dados do app
  const collectData = useCallback((): string => {
    const data: Record<string, unknown> = {};
    const keys = Object.keys(window.localStorage);
    for (const k of keys) {
      if (k.startsWith("dashboard.") && k !== STORAGE_KEY) {
        const raw = window.localStorage.getItem(k);
        if (raw !== null) {
          try { data[k] = JSON.parse(raw); } catch { data[k] = raw; }
        }
      }
    }
    return JSON.stringify(data);
  }, []);

  // Hash simples pra detectar mudanças
  const hashData = useCallback((data: string): string => {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return hash.toString(36);
  }, []);

  // Aplica dados recebidos do Drive
  const applyData = useCallback((jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr) as Record<string, unknown>;
      let applied = 0;
      for (const [key, value] of Object.entries(data)) {
        if (key.startsWith("dashboard.") && key !== STORAGE_KEY) {
          const str = typeof value === "string" ? value : JSON.stringify(value);
          window.localStorage.setItem(key, str);
          applied++;
        }
      }
      return applied > 0;
    } catch {
      return false;
    }
  }, []);

  // Upload para o Drive (simulado — precisa de OAuth configurado)
  const uploadToDrive = useCallback(async (data: string): Promise<boolean> => {
    // NOTA: Para implementação real, é necessário:
    // 1. Google Identity Services (GIS) para OAuth
    // 2. Google Drive API para upload/download
    // 3. Configurar OAuth Client ID no Google Cloud Console
    //
    // Por enquanto, salva no localStorage como simulação
    // (quando o OAuth estiver configurado, substituir por chamadas reais)
    try {
      window.localStorage.setItem("dashboard.gdriveSync.data", data);
      return true;
    } catch {
      return false;
    }
  }, []);

  // Download do Drive
  const downloadFromDrive = useCallback(async (): Promise<string | null> => {
    try {
      const data = window.localStorage.getItem("dashboard.gdriveSync.data");
      return data;
    } catch {
      return null;
    }
  }, []);

  // Sincronizar (upload se mudou, download se remoto é mais novo)
  const sync = useCallback(async (): Promise<void> => {
    if (!state.enabled || state.syncing) return;
    
    setState((prev) => ({ ...prev, syncing: true, error: null }));
    
    try {
      const currentData = collectData();
      const currentHash = hashData(currentData);

      // Se mudou desde último sync, faz upload
      if (currentHash !== lastDataHash.current) {
        const success = await uploadToDrive(currentData);
        if (success) {
          lastDataHash.current = currentHash;
          const now = Date.now();
          setState((prev) => ({ ...prev, lastSync: now, syncing: false }));
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ enabled: true, lastSync: now }));
        }
      }

      // Tenta baixar (se remoto é mais recente)
      const remoteData = await downloadFromDrive();
      if (remoteData && remoteData !== currentData) {
        const remoteHash = hashData(remoteData);
        if (remoteHash !== currentHash) {
          // Remoto é diferente — pergunta se quer importar
          // (em auto-sync real, compararia timestamps)
          // Por segurança, só aplica se for a primeira vez (sem dados locais)
          const hasLocalData = Object.keys(window.localStorage).some(k => k.startsWith("dashboard.") && k !== STORAGE_KEY && k !== "dashboard.gdriveSync.data");
          if (!hasLocalData) {
            applyData(remoteData);
            lastDataHash.current = remoteHash;
          }
        }
      }
    } catch (err) {
      setState((prev) => ({ ...prev, error: err instanceof Error ? err.message : "Erro no sync", syncing: false }));
    }
  }, [state.enabled, state.syncing, collectData, hashData, uploadToDrive, downloadFromDrive, applyData]);

  // Auto-sync a cada 30s
  useEffect(() => {
    if (state.enabled) {
      // Sync imediato
      sync();
      // Sync periódico
      intervalRef.current = setInterval(sync, SYNC_INTERVAL);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [state.enabled, sync]);

  // Habilitar sync
  const enable = useCallback(() => {
    setState((prev) => ({ ...prev, enabled: true, error: null }));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ enabled: true, lastSync: null }));
  }, []);

  // Desabilitar sync
  const disable = useCallback(() => {
    setState({ enabled: false, lastSync: null, syncing: false, error: null });
    window.localStorage.removeItem(STORAGE_KEY);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  // Sync manual (botão "Sincronizar agora")
  const syncNow = useCallback(() => {
    sync();
  }, [sync]);

  return {
    enabled: state.enabled,
    lastSync: state.lastSync,
    syncing: state.syncing,
    error: state.error,
    enable,
    disable,
    syncNow,
  };
}
