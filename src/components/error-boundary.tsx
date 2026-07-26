"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: { componentStack: string } | null;
}

/**
 * ErrorBoundary global — captura qualquer erro de renderização dos componentes.
 * Em vez de tela branca, mostra uma mensagem amigável com ações:
 *  - Limpar localStorage e recarregar (resolve a maioria dos erros de dados)
 *  - Recarregar sem limpar (tente primeiro)
 *  - Ver detalhes do erro (mostra o stack trace pro suporte)
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error("ErrorBoundary capturou erro:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleClearAndReload = () => {
    if (
      !confirm(
        "Limpar TODOS os dados do navegador e recarregar?\n\n" +
          "Isso vai apagar tarefas, livros, planejamento, etc. Não pode ser desfeito.\n\n" +
          "Se você fez backup antes (Botão Exportar backup), pode importar depois."
      )
    ) {
      return;
    }
    try {
      // Remove todas as chaves do app
      const keys = Object.keys(window.localStorage);
      keys.forEach((k) => {
        if (k.startsWith("dashboard.")) {
          window.localStorage.removeItem(k);
        }
      });
    } catch (e) {
      console.error("Erro ao limpar localStorage:", e);
    }
    window.location.reload();
  };

  handleClearTasksOnly = () => {
    if (
      !confirm(
        "Limpar somente TAREFAS e CATEGORIAS e recarregar?\n\n" +
          "Isso resolve erros ao criar/editar tarefa. Não afeta livros, planejamento, etc."
      )
    ) {
      return;
    }
    try {
      window.localStorage.removeItem("dashboard.tasks.v1");
      window.localStorage.removeItem("dashboard.taskCategories.v1");
    } catch (e) {
      console.error("Erro ao limpar tasks:", e);
    }
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { error, errorInfo } = this.state;
    const errorMsg = error?.message ?? "Erro desconhecido";
    const isTaskError =
      errorMsg.toLowerCase().includes("task") ||
      errorMsg.toLowerCase().includes("categoria") ||
      errorMsg.toLowerCase().includes("recurrence") ||
      errorInfo?.componentStack?.toLowerCase().includes("calendar-tasks") ||
      errorInfo?.componentStack?.toLowerCase().includes("task-editor") ||
      errorInfo?.componentStack?.toLowerCase().includes("use-tasks");

    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0a0a0a",
          color: "#fafafa",
          padding: "24px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            maxWidth: "560px",
            width: "100%",
            background: "#18181b",
            border: "1px solid #27272a",
            borderRadius: "12px",
            padding: "32px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div style={{ fontSize: "48px", marginBottom: "8px" }}>⚠️</div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 8px 0" }}>
              Algo deu errado
            </h1>
            <p style={{ color: "#a1a1aa", fontSize: "14px", margin: 0 }}>
              O dashboard encontrou um erro. Mas calma — seus dados provavelmente estão
              intactos. Tente as opções abaixo, da mais simples pra mais drástica.
            </p>
          </div>

          <div
            style={{
              background: "#27272a",
              border: "1px solid #3f3f46",
              borderRadius: "8px",
              padding: "12px",
              marginBottom: "20px",
              fontSize: "12px",
              color: "#fbbf24",
              fontFamily: "monospace",
              wordBreak: "break-word",
              maxHeight: "120px",
              overflowY: "auto",
            }}
          >
            <strong>Erro:</strong> {errorMsg}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button
              onClick={this.handleReload}
              style={{
                padding: "12px 16px",
                background: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              🔄 Recarregar página (tente primeiro)
            </button>

            {isTaskError && (
              <button
                onClick={this.handleClearTasksOnly}
                style={{
                  padding: "12px 16px",
                  background: "#ca8a04",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                🧹 Limpar só tarefas + recarregar (mantém livros, planejamento, etc.)
              </button>
            )}

            <button
              onClick={this.handleClearAndReload}
              style={{
                padding: "12px 16px",
                background: "#dc2626",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              🗑️ Limpar TUDO e recarregar (último recurso)
            </button>

            <details style={{ marginTop: "8px" }}>
              <summary
                style={{
                  cursor: "pointer",
                  color: "#a1a1aa",
                  fontSize: "12px",
                  padding: "8px",
                }}
              >
                Ver detalhes técnicos do erro
              </summary>
              <pre
                style={{
                  background: "#0a0a0a",
                  padding: "12px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  color: "#a1a1aa",
                  overflowX: "auto",
                  maxHeight: "200px",
                  whiteSpace: "pre-wrap",
                }}
              >
                {error?.stack ?? errorMsg}
                {"\n\nComponent stack:\n"}
                {errorInfo?.componentStack ?? "N/A"}
              </pre>
            </details>

            <p
              style={{
                fontSize: "11px",
                color: "#71717a",
                textAlign: "center",
                marginTop: "16px",
                marginBottom: 0,
              }}
            >
              Se nada funcionar, faça um novo deploy do backup no Netlify.
            </p>
          </div>
        </div>
      </div>
    );
  }
}
