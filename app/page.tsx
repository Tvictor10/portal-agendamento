"use client";

import { useState } from "react";
import StepCpf from "../components/StepCpf";
import StepCarteirinha from "../components/StepCarteirinha";
import StepUnidade from "../components/StepUnidade";
import StepProcedimento from "../components/StepProcedimento";
import StepDentista from "../components/StepDentista";
import StepResumo from "../components/StepResumo";

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
          <StepCpf
            cpf={cpf}
            erro={erro}
            loading={loading}
            onCpfChange={handleCPFChange}
            onSubmit={handleSubmit}
          />
        )}

        {etapa === "carteirinha" && beneficiario && (
          <StepCarteirinha
            beneficiario={beneficiario}
            onSelecionarCarteirinha={selecionarCarteirinha}
          />
        )}

        {etapa === "unidade" && (
          <StepUnidade
            carteirinhaDescricao={carteirinhaSelecionada?.descricao}
            clinicas={clinicas}
            onSelecionarUnidade={selecionarUnidade}
          />
        )}

        {etapa === "procedimento" && (
          <StepProcedimento
            clinicaSelecionada={clinicaSelecionada}
            procedimentos={procedimentosClinicos}
            procedimentoSelecionado={procedimentoClinico}
            onSelecionarProcedimento={selecionarProcedimento}
            whatsappUrl={whatsappUrl}
          />
        )}

        {etapa === "dentista" && (
          <StepDentista
            procedimentoClinico={procedimentoClinico}
            mostrarObservacaoEncaminhamento={mostrarObservacaoEncaminhamento}
            mensagemEncaminhamento={mensagemEncaminhamento}
            dentistas={listaDentistas}
            onSelecionarDentista={selecionarDentista}
          />
        )}

        {etapa === "resumo" && beneficiario && (
  <StepResumo
    beneficiario={beneficiario}
    carteirinhaSelecionada={
      carteirinhaSelecionada
    }
    clinicaSelecionada={clinicaSelecionada}
    procedimentoClinico={
      procedimentoClinico
    }
    dentistaSelecionado={
      dentistaSelecionado
    }
    ehOrtodontia={
      carteirinhaSelecionada?.tipo ===
      "ortodontia"
    }
  />
)}
      </div>
    </main>
  );
}