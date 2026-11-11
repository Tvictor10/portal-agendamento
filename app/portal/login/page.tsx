
"use client";

import { useState, type FormEvent } from "react";

export default function PortalLoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function entrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMensagem("");
    setCarregando(true);

    try {
      const resposta = await fetch("/api/portal/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ login: email, senha }),
      });

      const dados = await resposta.json();

      if (!resposta.ok || !dados.success) {
        setMensagem(
          dados.mensagem || "Não foi possível realizar o login."
        );
        return;
      }

     window.location.assign(dados.destino);
    } catch {
      setMensagem("Erro de conexão. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-8 flex flex-col items-center text-center">
  <img
    src="/logo.png"
    alt="Dental Med"
    className="h-36 w-auto max-w-full object-contain"
  />

  <h1 className="mt-4 text-xl font-semibold text-blue-700">
    Portal de Agentes
  </h1>

  <p className="mt-1 text-sm text-slate-500">
    Acesso exclusivo para funcionários
  </p>
</div>

        <form onSubmit={entrar} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              login
            </label>
            <input
  id="email"
  type="text"
  required
  autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite seu Login"
              className="w-full rounded-lg border border-slate-300 p-3 text-slate-900"
            />
          </div>

          <div>
            <label
              htmlFor="senha"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Senha
            </label>
            <input
              id="senha"
              type={mostrarSenha ? "text" : "password"}
              required
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite sua senha"
              className="w-full rounded-lg border border-slate-300 p-3 text-slate-900"
            />
            <label className="mt-2 flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={mostrarSenha}
                onChange={(e) => setMostrarSenha(e.target.checked)}
              />
              Mostrar senha
            </label>
          </div>

          {mensagem && (
            <p
              role="status"
              className="rounded-lg bg-slate-100 p-3 text-sm text-slate-700"
            >
              {mensagem}
            </p>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full rounded-lg bg-blue-700 p-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
