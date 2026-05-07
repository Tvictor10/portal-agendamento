"use client";

import { useState } from "react";

type Etapa =
  | "cpf"
  | "carteirinha"
  | "unidade"
  | "procedimento"
  | "dentista"
  | "resumo";

type Carteirinha = {
  id: number;
  numero: string;
  tipo: "clinico" | "ortodontia";
  descricao: string;
};

type Beneficiario = {
  nome: string;
  carteirinhas: Carteirinha[];
};

type Dentista = {
  id: number;
  nome: string;
  especialidade: string;
};

type ProcedimentoClinico =
  | "AUTORIZAÇÃO | RAIO X"
  | "CANAL"
  | "PERIODONTIA"
  | "RECONSTRUÇÃO"
  | "CIRURGIA"
  | "LIMPEZA | RESTAURAÇÃO"
  | "CONSULTA INICIAL"
  | "ODONTOPEDIATRIA";

const clinicas = ["CENTRO", "PARNAMIRIM", "GOIANINHA", "SANTA CRUZ"];

const procedimentosClinicos: ProcedimentoClinico[] = [
  "AUTORIZAÇÃO | RAIO X",
  "CANAL",
  "PERIODONTIA",
  "RECONSTRUÇÃO",
  "CIRURGIA",
  "LIMPEZA | RESTAURAÇÃO",
  "CONSULTA INICIAL",
  "ODONTOPEDIATRIA",
];

const dentistasClinicos: Dentista[] = [
  { id: 1, nome: "Dra. Ana Souza", especialidade: "Clínico Geral" },
  { id: 2, nome: "Dr. Carlos Lima", especialidade: "Clínico Geral" },
  { id: 3, nome: "Dra. Marina Alves", especialidade: "Clínico Geral" },
];

const dentistasOdontopediatria: Dentista[] = [
  { id: 20, nome: "Dra. Camila Rocha", especialidade: "Odontopediatria" },
];

const dentistaOrtodonticoDoPaciente: Dentista = {
  id: 10,
  nome: "Dra. Beatriz Costa",
  especialidade: "Ortodontia",
};

const mensagemEncaminhamento =
  "Para este tipo de atendimento é necessário o encaminhamento do dentista, caso não tenha, escolha a opção Autorização";

const whatsappUrl =
  "https://wa.me/5584999999999?text=Olá,%20gostaria%20de%20agendar%20um%20atendimento.";

export default function Home() {
  const [etapa, setEtapa] = useState<Etapa>("cpf");

  const [cpf, setCpf] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const [beneficiario, setBeneficiario] = useState<Beneficiario | null>(null);
  const [carteirinhaSelecionada, setCarteirinhaSelecionada] =
    useState<Carteirinha | null>(null);
  const [clinicaSelecionada, setClinicaSelecionada] = useState("");
  const [procedimentoClinico, setProcedimentoClinico] =
    useState<ProcedimentoClinico | null>(null);
  const [dentistaSelecionado, setDentistaSelecionado] =
    useState<Dentista | null>(null);

  function formatCPF(value: string) {
    value = value.replace(/\D/g, "");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    return value;
  }

  function validarCPF(cpf: string) {
    return cpf.replace(/\D/g, "").length === 11;
  }

  function handleCPFChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCpf(formatCPF(e.target.value));
    if (erro) setErro("");
  }

  async function consultarBeneficiario() {
    return new Promise<Beneficiario>((resolve, reject) => {
      setTimeout(() => {
        const cpfLimpo = cpf.replace(/\D/g, "");

        if (cpfLimpo === "11111111111") {
          reject("Beneficiário não encontrado");
          return;
        }

        if (cpfLimpo === "99999999999") {
          reject("Não foi possível continuar. Entre em contato com nossa equipe.");
          return;
        }

        resolve({
          nome: "João Silva",
          carteirinhas: [
            {
              id: 1,
              numero: "CLI-123456",
              tipo: "clinico",
              descricao: "Carteirinha Clínica",
            },
            {
              id: 2,
              numero: "ORT-987654",
              tipo: "ortodontia",
              descricao: "Carteirinha Ortodôntica",
            },
          ],
        });
      }, 1200);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (!validarCPF(cpf)) {
      setErro("Digite um CPF válido");
      return;
    }

    try {
      setLoading(true);
      const dados = await consultarBeneficiario();
      setBeneficiario(dados);
      setEtapa("carteirinha");
    } catch (err: any) {
      setErro(err);
    } finally {
      setLoading(false);
    }
  }

  function selecionarCarteirinha(carteirinha: Carteirinha) {
    setCarteirinhaSelecionada(carteirinha);
    setClinicaSelecionada("");
    setProcedimentoClinico(null);
    setDentistaSelecionado(null);

    if (carteirinha.tipo === "ortodontia") {
      setDentistaSelecionado(dentistaOrtodonticoDoPaciente);
    }

    setEtapa("unidade");
  }

  function selecionarUnidade(clinica: string) {
    setClinicaSelecionada(clinica);

    if (carteirinhaSelecionada?.tipo === "clinico") {
      setProcedimentoClinico(null);
      setDentistaSelecionado(null);
      setEtapa("procedimento");
      return;
    }

    if (carteirinhaSelecionada?.tipo === "ortodontia") {
      setDentistaSelecionado(dentistaOrtodonticoDoPaciente);
      setEtapa("resumo");
    }
  }

  function selecionarProcedimento(procedimento: ProcedimentoClinico) {
    setProcedimentoClinico(procedimento);
    setDentistaSelecionado(null);

    if (procedimento === "AUTORIZAÇÃO | RAIO X") {
      return;
    }

    setEtapa("dentista");
  }

  function selecionarDentista(dentista: Dentista) {
    setDentistaSelecionado(dentista);
    setEtapa("resumo");
  }

  function voltar() {
    if (etapa === "carteirinha") {
      setEtapa("cpf");
      return;
    }

    if (etapa === "unidade") {
      setEtapa("carteirinha");
      return;
    }

    if (etapa === "procedimento") {
      setEtapa("unidade");
      return;
    }

    if (etapa === "dentista") {
      setEtapa("procedimento");
      return;
    }

    if (etapa === "resumo") {
      if (carteirinhaSelecionada?.tipo === "ortodontia") {
        setEtapa("unidade");
      } else {
        setEtapa("dentista");
      }
    }
  }

  const procedimentosComEncaminhamento = [
    "CANAL",
    "PERIODONTIA",
    "RECONSTRUÇÃO",
    "CIRURGIA",
  ];

  const mostrarObservacaoEncaminhamento =
    procedimentoClinico !== null &&
    procedimentosComEncaminhamento.includes(procedimentoClinico);

  const listaDentistas =
    procedimentoClinico === "ODONTOPEDIATRIA"
      ? dentistasOdontopediatria
      : dentistasClinicos;

  return (
    <main className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl p-8 border border-slate-100">
        {etapa !== "cpf" && (
          <button
            onClick={voltar}
            className="mb-6 text-sm font-semibold text-slate-500 hover:text-slate-800"
          >
            ← Voltar
          </button>
        )}

        {etapa === "cpf" && (
          <>
            <h1 className="text-3xl font-bold text-center text-slate-800">
              Portal de Agendamento
            </h1>

            <p className="text-slate-500 text-center mt-2">
              Informe seu CPF para continuar
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <input
                type="text"
                value={cpf}
                onChange={handleCPFChange}
                maxLength={14}
                placeholder="000.000.000-00"
                disabled={loading}
                className={`w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 ${
                  erro
                    ? "border-red-500 focus:ring-red-500"
                    : "border-slate-300 focus:ring-cyan-500"
                }`}
              />

              {erro && <p className="text-red-500 text-sm">{erro}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 transition text-white font-semibold py-3 rounded-xl disabled:opacity-50 shadow-lg"
              >
                {loading ? "Consultando..." : "Continuar"}
              </button>
            </form>
          </>
        )}

        {etapa === "carteirinha" && beneficiario && (
          <>
            <h1 className="text-2xl font-bold text-slate-800">
              Olá, {beneficiario.nome}
            </h1>

            <p className="text-slate-500 mt-2">
              Selecione a carteirinha para agendamento
            </p>

            <div className="mt-8 space-y-3">
              {beneficiario.carteirinhas.map((carteirinha) => (
                <button
                  key={carteirinha.id}
                  onClick={() => selecionarCarteirinha(carteirinha)}
                  className="w-full rounded-xl p-4 text-left border border-slate-200 hover:border-cyan-400 hover:bg-cyan-50 hover:shadow-md transition"
                >
                  <p className="font-semibold text-slate-800">
                    {carteirinha.descricao}
                  </p>
                  <p className="text-sm text-slate-500">
                    Nº {carteirinha.numero}
                  </p>
                </button>
              ))}
            </div>
          </>
        )}

        {etapa === "unidade" && (
          <>
            <h1 className="text-2xl font-bold text-slate-800">
              Escolha a unidade
            </h1>

            <p className="text-slate-500 mt-2">
              Carteirinha: {carteirinhaSelecionada?.descricao}
            </p>

            <div className="mt-8 space-y-3">
              {clinicas.map((clinica) => (
                <button
                  key={clinica}
                  onClick={() => selecionarUnidade(clinica)}
                  className="w-full rounded-xl p-4 text-left border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 hover:shadow-md transition"
                >
                  {clinica}
                </button>
              ))}
            </div>
          </>
        )}

        {etapa === "procedimento" && (
          <>
            <h1 className="text-2xl font-bold text-slate-800">
              Escolha o procedimento
            </h1>

            <p className="text-slate-500 mt-2">
              Unidade: {clinicaSelecionada}
            </p>

            <div className="mt-8 space-y-3">
              {procedimentosClinicos.map((procedimento) => (
                <button
                  key={procedimento}
                  onClick={() => selecionarProcedimento(procedimento)}
                  className={`w-full rounded-xl p-4 text-left border transition ${
                    procedimentoClinico === procedimento
                      ? "border-orange-500 bg-orange-100 shadow-md"
                      : "border-slate-200 hover:border-orange-400 hover:bg-orange-50 hover:shadow-md"
                  }`}
                >
                  {procedimento}
                </button>
              ))}
            </div>

            {procedimentoClinico === "AUTORIZAÇÃO | RAIO X" && (
              <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm">
                <p className="text-sm text-green-700">
                  Este tipo de atendimento é agendado apenas por nossa equipe.
                </p>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center mt-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 rounded-xl shadow-lg"
                >
                  Falar no WhatsApp
                </a>
              </div>
            )}
          </>
        )}

        {etapa === "dentista" && (
          <>
            <h1 className="text-2xl font-bold text-slate-800">
              Escolha o dentista
            </h1>

            <p className="text-slate-500 mt-2">
              Procedimento: {procedimentoClinico}
            </p>

            {mostrarObservacaoEncaminhamento && (
              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
                <p className="text-sm text-amber-800">
                  {mensagemEncaminhamento}
                </p>
              </div>
            )}

            <div className="mt-8 space-y-3">
              {listaDentistas.map((dentista) => (
                <button
                  key={dentista.id}
                  onClick={() => selecionarDentista(dentista)}
                  className="w-full rounded-xl p-4 text-left border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 hover:shadow-md transition"
                >
                  <p className="font-semibold text-slate-800">{dentista.nome}</p>
                  <p className="text-sm text-slate-500">
                    {dentista.especialidade}
                  </p>
                </button>
              ))}
            </div>
          </>
        )}

        {etapa === "resumo" && beneficiario && (
          <>
            <h1 className="text-2xl font-bold text-slate-800">
              Resumo do agendamento
            </h1>

            {carteirinhaSelecionada?.tipo === "ortodontia" && (
              <div className="mt-6 bg-purple-50 border border-purple-200 rounded-xl p-4 shadow-sm">
                <p className="text-sm text-purple-700">
                  Para ortodontia, os horários serão exibidos com base no
                  dentista que já acompanha seu tratamento.
                </p>
              </div>
            )}

            <div className="mt-6 bg-slate-100 rounded-xl p-4 border border-slate-200 space-y-2 text-sm text-slate-600">
              <p>
                <strong>Paciente:</strong> {beneficiario.nome}
              </p>

              <p>
                <strong>Carteirinha:</strong>{" "}
                {carteirinhaSelecionada?.descricao} -{" "}
                {carteirinhaSelecionada?.numero}
              </p>

              <p>
                <strong>Unidade:</strong> {clinicaSelecionada}
              </p>

              {procedimentoClinico && (
                <p>
                  <strong>Procedimento:</strong> {procedimentoClinico}
                </p>
              )}

              <p>
                <strong>Dentista:</strong> {dentistaSelecionado?.nome}
              </p>
            </div>

            <button className="w-full mt-6 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 transition text-white font-semibold py-3 rounded-xl shadow-lg">
              Continuar para horários
            </button>
          </>
        )}
      </div>
    </main>
  );
}