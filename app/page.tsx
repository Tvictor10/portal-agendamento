"use client";

import { useState } from "react";

type Beneficiario = {
  nome: string;
  plano: string;
};

type Dentista = {
  id: number;
  nome: string;
  especialidade: string;
};

const clinicas = ["CENTRO", "PARNAMIRIM", "GOIANINHA", "SANTA CRUZ"];

const dentistasClinicos: Dentista[] = [
  { id: 1, nome: "Dra. Ana Souza", especialidade: "Clínico Geral" },
  { id: 2, nome: "Dr. Carlos Lima", especialidade: "Clínico Geral" },
  { id: 3, nome: "Dra. Marina Alves", especialidade: "Clínico Geral" },
];

const dentistasOrtodontia: Dentista[] = [
  { id: 4, nome: "Dra. Beatriz Costa", especialidade: "Ortodontia" },
  { id: 5, nome: "Dr. Rafael Mendes", especialidade: "Ortodontia" },
];

export default function Home() {
  const [cpf, setCpf] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const [beneficiario, setBeneficiario] = useState<Beneficiario | null>(null);
  const [tipoAtendimento, setTipoAtendimento] = useState("");
  const [clinicaSelecionada, setClinicaSelecionada] = useState("");
  const [dentistaSelecionado, setDentistaSelecionado] = useState<Dentista | null>(
    null
  );

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
          plano: "Clínico",
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
    } catch (err: any) {
      setErro(err);
    } finally {
      setLoading(false);
    }
  }

  function selecionarTipo(tipo: string) {
    setTipoAtendimento(tipo);
    setClinicaSelecionada("");
    setDentistaSelecionado(null);
  }

  function selecionarClinica(clinica: string) {
    setClinicaSelecionada(clinica);
    setDentistaSelecionado(null);
  }

  const dentistas =
    tipoAtendimento === "ortodontia" ? dentistasOrtodontia : dentistasClinicos;

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-8">
        {!beneficiario ? (
          <>
            <h1 className="text-3xl font-bold text-center text-slate-800">
              Portal de Agendamento
            </h1>

            <p className="text-slate-500 text-center mt-2">
              Informe seu CPF para continuar
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
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
                      : "border-slate-300 focus:ring-blue-500"
                  }`}
                />

                {erro && <p className="text-red-500 text-sm mt-2">{erro}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 transition text-white font-semibold py-3 rounded-xl disabled:opacity-50"
              >
                {loading ? "Consultando..." : "Continuar"}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-slate-800">
              Olá, {beneficiario.nome}
            </h1>

            <p className="text-slate-500 mt-2">
              Escolha o tipo de atendimento
            </p>

            <div className="mt-8 space-y-4">
              <button
                onClick={() => selecionarTipo("clínico")}
                className={`w-full py-4 rounded-xl font-semibold transition text-white ${
                  tipoAtendimento === "clínico"
                    ? "bg-blue-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                Atendimento Clínico
              </button>

              <button
                onClick={() => selecionarTipo("ortodontia")}
                className={`w-full py-4 rounded-xl font-semibold transition text-white ${
                  tipoAtendimento === "ortodontia"
                    ? "bg-purple-700"
                    : "bg-purple-600 hover:bg-purple-700"
                }`}
              >
                Atendimento Ortodôntico
              </button>
            </div>

            {tipoAtendimento && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-slate-700 mb-4">
                  Escolha a clínica
                </h2>

                <div className="space-y-3">
                  {clinicas.map((clinica) => (
                    <button
                      key={clinica}
                      onClick={() => selecionarClinica(clinica)}
                      className={`w-full rounded-xl p-4 text-left border transition ${
                        clinicaSelecionada === clinica
                          ? "border-blue-600 bg-blue-50"
                          : "border-slate-300 hover:border-blue-500 hover:bg-blue-50"
                      }`}
                    >
                      {clinica}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {clinicaSelecionada && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-slate-700 mb-4">
                  Escolha o dentista
                </h2>

                <div className="space-y-3">
                  {dentistas.map((dentista) => (
                    <button
                      key={dentista.id}
                      onClick={() => setDentistaSelecionado(dentista)}
                      className={`w-full rounded-xl p-4 text-left border transition ${
                        dentistaSelecionado?.id === dentista.id
                          ? "border-green-600 bg-green-50"
                          : "border-slate-300 hover:border-green-500 hover:bg-green-50"
                      }`}
                    >
                      <p className="font-semibold text-slate-800">
                        {dentista.nome}
                      </p>
                      <p className="text-sm text-slate-500">
                        {dentista.especialidade}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {dentistaSelecionado && (
              <div className="mt-8 bg-slate-100 rounded-xl p-4">
                <h3 className="font-semibold text-slate-800">
                  Resumo do agendamento
                </h3>

                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <p>
                    <strong>Paciente:</strong> {beneficiario.nome}
                  </p>

                  <p>
                    <strong>Tipo:</strong> {tipoAtendimento}
                  </p>

                  <p>
                    <strong>Clínica:</strong> {clinicaSelecionada}
                  </p>

                  <p>
                    <strong>Dentista:</strong> {dentistaSelecionado.nome}
                  </p>
                </div>

                <button className="w-full mt-6 bg-green-600 hover:bg-green-700 transition text-white font-semibold py-3 rounded-xl">
                  Continuar para horários
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}