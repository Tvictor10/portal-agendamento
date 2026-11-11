
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";

type Agente = {
  id: string;
  usuario: string;
  nome: string;
  perfil: string;
  ativo: boolean;
  criado_em: string;
};

export default function GerenciarAgentesPage() {
  const [agentes, setAgentes] = useState<Agente[]>([]);

  const [nome, setNome] = useState("");
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const [agenteEditando, setAgenteEditando] = useState<Agente | null>(null);
  const [nomeEdicao, setNomeEdicao] = useState("");
  const [loginEdicao, setLoginEdicao] = useState("");
  const [senhaEdicao, setSenhaEdicao] = useState("");
  const [mostrarSenhaEdicao, setMostrarSenhaEdicao] = useState(false);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [erroEdicao, setErroEdicao] = useState("");
  const [mensagemEdicao, setMensagemEdicao] = useState("");

  const carregarAgentes = useCallback(async () => {
    setCarregando(true);

    try {
      const resposta = await fetch("/api/portal/agentes", {
        cache: "no-store",
      });

      if (resposta.status === 401 || resposta.status === 403) {
        window.location.assign("/portal/login");
        return;
      }

      const dados = await resposta.json();

      if (!resposta.ok || !dados.success) {
        throw new Error(
          dados.mensagem || "Não foi possível carregar os funcionários."
        );
      }

      setAgentes(dados.agentes ?? []);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao consultar funcionários."
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregarAgentes();
  }, [carregarAgentes]);

  async function cadastrarAgente(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMensagem("");
    setErro("");
    setSalvando(true);

    try {
      const resposta = await fetch("/api/portal/agentes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: nome.trim(),
          login: login.trim().toLowerCase(),
          senha,
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok || !dados.success) {
        throw new Error(
          dados.mensagem || "Não foi possível cadastrar o agente."
        );
      }

      setMensagem("Agente cadastrado com sucesso!");
      setNome("");
      setLogin("");
      setSenha("");
      setMostrarSenha(false);

      await carregarAgentes();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao cadastrar funcionário."
      );
    } finally {
      setSalvando(false);
    }
  }

  function abrirEdicao(agente: Agente) {
    setAgenteEditando(agente);
    setNomeEdicao(agente.nome);
    setLoginEdicao(agente.usuario);
    setSenhaEdicao("");
    setMostrarSenhaEdicao(false);
    setErroEdicao("");
    setMensagemEdicao("");
  }

  function fecharEdicao() {
    setAgenteEditando(null);
    setSenhaEdicao("");
    setErroEdicao("");
    setMensagemEdicao("");
  }

  async function atualizarAgente(
    alteracoes: Record<string, string | boolean>
  ) {
    if (!agenteEditando) return false;

    setSalvandoEdicao(true);
    setErroEdicao("");
    setMensagemEdicao("");

    try {
      const resposta = await fetch(
        `/api/portal/agentes/${encodeURIComponent(agenteEditando.id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(alteracoes),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok || !dados.success) {
        throw new Error(
          dados.mensagem || "Não foi possível atualizar o funcionário."
        );
      }

      setMensagemEdicao("Alteração realizada com sucesso!");
      await carregarAgentes();
      return true;
    } catch (error) {
      setErroEdicao(
        error instanceof Error
          ? error.message
          : "Erro ao atualizar funcionário."
      );
      return false;
    } finally {
      setSalvandoEdicao(false);
    }
  }

  async function salvarDados(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!agenteEditando) return;

    const alteracoes: Record<string, string> = {};

    const novoNome = nomeEdicao.trim();
    const novoLogin = loginEdicao.trim().toLowerCase();

    if (!novoNome) {
      setErroEdicao("Informe o nome completo.");
      return;
    }

    if (novoNome !== agenteEditando.nome) {
      alteracoes.nome = novoNome;
    }

    if (
      agenteEditando.perfil !== "admin" &&
      novoLogin !== agenteEditando.usuario
    ) {
      alteracoes.login = novoLogin;
    }

    if (Object.keys(alteracoes).length === 0) {
      setMensagemEdicao("Nenhuma alteração foi realizada.");
      setErroEdicao("");
      return;
    }

    const sucesso = await atualizarAgente(alteracoes);

    if (sucesso) {
      setAgenteEditando({
        ...agenteEditando,
        nome: novoNome,
        usuario:
          agenteEditando.perfil === "admin"
            ? agenteEditando.usuario
            : novoLogin,
      });
    }
  }

  async function redefinirSenha(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (senhaEdicao.length < 8) {
      setErroEdicao("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }

    const sucesso = await atualizarAgente({
      senha: senhaEdicao,
    });

    if (sucesso) {
      setSenhaEdicao("");
      setMostrarSenhaEdicao(false);
    }
  }

  async function alternarSituacao() {
    if (!agenteEditando || agenteEditando.perfil === "admin") {
      return;
    }

    const novaSituacao = !agenteEditando.ativo;

    const confirmado = window.confirm(
      novaSituacao
        ? `Deseja ativar o acesso de ${agenteEditando.nome}?`
        : `Deseja desativar o acesso de ${agenteEditando.nome}?`
    );

    if (!confirmado) return;

    const sucesso = await atualizarAgente({
      ativo: novaSituacao,
    });

    if (sucesso) {
      setAgenteEditando({
        ...agenteEditando,
        ativo: novaSituacao,
      });
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Image
                src="/logo.png"
                alt="Dental Med"
                width={120}
                height={80}
                className="h-16 w-auto object-contain"
              />

              <div>
                <h1 className="text-2xl font-bold text-blue-700">
                  Gerenciar agentes
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Cadastro e gerenciamento de funcionários
                </p>
              </div>
            </div>

            <Link
              href="/portal/admin"
              className="rounded-lg border border-blue-200 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
            >
              Voltar ao painel
            </Link>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800">
              Novo agente
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              O funcionário utilizará login e senha para acessar o portal.
            </p>

            <form onSubmit={cadastrarAgente} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="nome"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Nome completo
                </label>

                <input
                  id="nome"
                  type="text"
                  required
                  value={nome}
                  onChange={(event) => setNome(event.target.value)}
                  placeholder="Ex.: Maria Silva"
                  className="w-full rounded-lg border border-slate-300 p-3 text-slate-900"
                />
              </div>

              <div>
                <label
                  htmlFor="login"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Login
                </label>

                <input
                  id="login"
                  type="text"
                  required
                  minLength={3}
                  maxLength={40}
                  autoComplete="off"
                  value={login}
                  onChange={(event) => setLogin(event.target.value)}
                  placeholder="Ex.: maria.silva"
                  className="w-full rounded-lg border border-slate-300 p-3 text-slate-900"
                />

                <p className="mt-1 text-xs text-slate-500">
                  Utilize letras minúsculas, números, ponto, hífen ou _.
                </p>
              </div>

              <div>
                <label
                  htmlFor="senha"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Senha inicial
                </label>

                <input
                  id="senha"
                  type={mostrarSenha ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={senha}
                  onChange={(event) => setSenha(event.target.value)}
                  placeholder="Mínimo de 8 caracteres"
                  className="w-full rounded-lg border border-slate-300 p-3 text-slate-900"
                />

                <label className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={mostrarSenha}
                    onChange={(event) =>
                      setMostrarSenha(event.target.checked)
                    }
                  />
                  Mostrar senha
                </label>
              </div>

              {mensagem && (
                <p
                  role="status"
                  className="rounded-lg bg-green-50 p-3 text-sm text-green-700"
                >
                  {mensagem}
                </p>
              )}

              {erro && (
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
                >
                  {erro}
                </p>
              )}

              <button
                type="submit"
                disabled={salvando}
                className="w-full rounded-lg bg-blue-700 p-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
              >
                {salvando ? "Cadastrando..." : "Cadastrar agente"}
              </button>
            </form>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Funcionários cadastrados
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {agentes.length} funcionário(s)
                </p>
              </div>

              <button
                type="button"
                onClick={() => void carregarAgentes()}
                disabled={carregando}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Atualizar
              </button>
            </div>

            {carregando ? (
              <p className="mt-6 text-sm text-slate-500">
                Carregando funcionários...
              </p>
            ) : agentes.length === 0 ? (
              <p className="mt-6 text-sm text-slate-500">
                Nenhum funcionário encontrado.
              </p>
            ) : (
              <div className="mt-5 space-y-3">
                {agentes.map((agente) => (
                  <div
                    key={agente.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-800">
                          {agente.nome}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          Login: {agente.usuario}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          agente.ativo
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {agente.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </div>

                    <p className="mt-3 text-xs text-slate-500">
                      Perfil:{" "}
                      {agente.perfil === "admin"
                        ? "Administrador"
                        : "Agente"}
                    </p>

                    <button
                      type="button"
                      onClick={() => abrirEdicao(agente)}
                      className="mt-4 rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                    >
                      Gerenciar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {agenteEditando && (
          <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-blue-700">
                  Gerenciar funcionário
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {agenteEditando.nome}
                </p>
              </div>

              <button
                type="button"
                onClick={fecharEdicao}
                disabled={salvandoEdicao}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Fechar
              </button>
            </div>

            {mensagemEdicao && (
              <p
                role="status"
                className="mt-5 rounded-lg bg-green-50 p-3 text-sm text-green-700"
              >
                {mensagemEdicao}
              </p>
            )}

            {erroEdicao && (
              <p
                role="alert"
                className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700"
              >
                {erroEdicao}
              </p>
            )}

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <form
                onSubmit={salvarDados}
                className="space-y-4 rounded-xl border border-slate-200 p-5"
              >
                <h3 className="font-bold text-slate-800">
                  Dados do funcionário
                </h3>

                <div>
                  <label
                    htmlFor="nome-edicao"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Nome completo
                  </label>

                  <input
                    id="nome-edicao"
                    type="text"
                    required
                    value={nomeEdicao}
                    onChange={(event) =>
                      setNomeEdicao(event.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 p-3 text-slate-900"
                  />
                </div>

                <div>
                  <label
                    htmlFor="login-edicao"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Login
                  </label>

                  <input
                    id="login-edicao"
                    type="text"
                    required
                    minLength={3}
                    maxLength={40}
                    value={loginEdicao}
                    disabled={agenteEditando.perfil === "admin"}
                    onChange={(event) =>
                      setLoginEdicao(event.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 p-3 text-slate-900 disabled:bg-slate-100"
                  />

                  {agenteEditando.perfil === "admin" && (
                    <p className="mt-2 text-xs text-slate-500">
                      O login do administrador não será alterado nesta tela.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={salvandoEdicao}
                  className="w-full rounded-lg bg-blue-700 p-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
                >
                  {salvandoEdicao
                    ? "Salvando..."
                    : "Salvar alterações"}
                </button>
              </form>

              <div className="space-y-6">
                <form
                  onSubmit={redefinirSenha}
                  className="space-y-4 rounded-xl border border-slate-200 p-5"
                >
                  <h3 className="font-bold text-slate-800">
                    Redefinir senha
                  </h3>

                  <p className="text-sm text-slate-500">
                    Defina uma nova senha para este funcionário.
                  </p>

                  <input
                    type={mostrarSenhaEdicao ? "text" : "password"}
                    minLength={8}
                    required
                    autoComplete="new-password"
                    value={senhaEdicao}
                    onChange={(event) =>
                      setSenhaEdicao(event.target.value)
                    }
                    placeholder="Nova senha (mínimo de 8 caracteres)"
                    className="w-full rounded-lg border border-slate-300 p-3 text-slate-900"
                  />

                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={mostrarSenhaEdicao}
                      onChange={(event) =>
                        setMostrarSenhaEdicao(event.target.checked)
                      }
                    />
                    Mostrar senha
                  </label>

                  <button
                    type="submit"
                    disabled={salvandoEdicao}
                    className="w-full rounded-lg border border-blue-300 p-3 font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-60"
                  >
                    {salvandoEdicao
                      ? "Salvando..."
                      : "Alterar senha"}
                  </button>
                </form>

                <div className="rounded-xl border border-slate-200 p-5">
                  <h3 className="font-bold text-slate-800">
                    Situação do acesso
                  </h3>

                  <p className="mt-2 text-sm text-slate-600">
                    Situação atual:{" "}
                    <strong>
                      {agenteEditando.ativo ? "Ativo" : "Inativo"}
                    </strong>
                  </p>

                  {agenteEditando.perfil === "admin" ? (
                    <p className="mt-3 text-sm text-slate-500">
                      A desativação do administrador não está
                      disponível nesta tela.
                    </p>
                  ) : (
                    <button
                      type="button"
                      disabled={salvandoEdicao}
                      onClick={() => void alternarSituacao()}
                      className={`mt-4 w-full rounded-lg p-3 font-semibold disabled:opacity-60 ${
                        agenteEditando.ativo
                          ? "border border-red-300 text-red-700 hover:bg-red-50"
                          : "bg-green-700 text-white hover:bg-green-800"
                      }`}
                    >
                      {agenteEditando.ativo
                        ? "Desativar funcionário"
                        : "Ativar funcionário"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
