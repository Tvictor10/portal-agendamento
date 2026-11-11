
"use client";

import { useState } from "react";

export default function PortalLogoutButton() {
  const [saindo, setSaindo] = useState(false);
  const [erro, setErro] = useState("");

  async function sair() {
    if (saindo) return;

    setSaindo(true);
    setErro("");

    try {
      const resposta = await fetch("/api/portal/logout", {
        method: "POST",
        credentials: "same-origin",
      });

      const dados = await resposta.json();

      if (!resposta.ok || !dados.success) {
        setErro(
          dados.mensagem || "Não foi possível encerrar a sessão."
        );
        return;
      }

      window.location.replace("/portal/login");
    } catch {
      setErro("Erro de conexão ao encerrar a sessão.");
    } finally {
      setSaindo(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={sair}
        disabled={saindo}
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
      >
        {saindo ? "Saindo..." : "Sair"}
      </button>

      {erro && (
        <p role="alert" className="text-sm text-red-600">
          {erro}
        </p>
      )}
    </div>
  );
}
