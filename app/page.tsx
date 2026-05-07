"use client";

import { useState } from "react";

type Beneficiario = {
  nome: string;
  plano: string;
};

export default function Home() {
  const [cpf, setCpf] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const [beneficiario, setBeneficiario] =
    useState<Beneficiario | null>(null);

  const [tipoAtendimento, setTipoAtendimento] = useState("");

  const [clinicaSelecionada, setClinicaSelecionada] = useState("");

  function formatCPF(value: string) {
    value = value.replace(/\D/g, "");

    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");

    return value;
  }

  function validarCPF(cpf: string) {
    const cpfLimpo = cpf.replace(/\D/g, "");

    return cpfLimpo.length === 11;
  }

  function handleCPFChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatCPF(e.target.value);

    setCpf(formatted);

    if (erro) {
      setErro("");
    }
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
          reject("Entre em contato com a clínica");
          return;
        }

        resolve({
          nome: "João Silva",
          plano: "Clínico",
        });
      }, 1500);
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

                {erro && (
                  <p className="text-red-500 text-sm mt-2">
                    {erro}
                  </p>
                )}
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
                onClick={() => {
                  setTipoAtendimento("clínico");
                  setClinicaSelecionada("");
                }}
                className={`w-full py-4 rounded-xl font-semibold transition text-white ${
                  tipoAtendimento === "clínico"
                    ? "bg-blue-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                Atendimento Clínico
              </button>

              <button
                onClick={() => {
                  setTipoAtendimento("ortodontia");
                  setClinicaSelecionada("");
                }}
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
                  {[
                    "Clínica Centro",
                    "Clínica Zona Norte",
                    "Clínica Parnamirim",
                    "Clínica Mossoró",
                  ].map((clinica) => (
                    <button
                      key={clinica}
                      onClick={() => setClinicaSelecionada(clinica)}
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
                </div>

                <button
                  className="w-full mt-6 bg-green-600 hover:bg-green-700 transition text-white font-semibold py-3 rounded-xl"
                >
                  Continuar Agendamento
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}