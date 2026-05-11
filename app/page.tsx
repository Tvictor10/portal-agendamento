"use client";

import { useState } from "react";
import StepCpf from "../components/StepCpf";
import StepCarteirinha from "../components/StepCarteirinha";
import StepUnidade from "../components/StepUnidade";
import StepProcedimento from "../components/StepProcedimento";
import StepDentista from "../components/StepDentista";
import StepDatas from "../components/StepDatas";
import StepHorarios from "../components/StepHorarios";
import StepResumo from "../components/StepResumo";
import StepConfirmacao from "../components/StepConfirmacao";
import StepAgendamentoExistente from "../components/StepAgendamentoExistente";

type Etapa =
  | "cpf"
  | "carteirinha"
  | "unidade"
  | "procedimento"
  | "dentista"
  | "datas"
  | "horarios"
  | "resumo"
  | "confirmacao"
  | "agendamento-existente"
  | "inicio-ortodontico";

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

type Clinica = {
  id: number;
  nome: string;
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

const mensagemEncaminhamento =
  "Para este tipo de atendimento é necessário o encaminhamento do dentista, caso não tenha, escolha a opção Autorização";

const whatsappUrl =
  "https://wa.me/5584999999999?text=Olá,%20gostaria%20de%20agendar%20um%20atendimento.";

const datasDisponiveisMock = [
  { diaSemana: "Segunda-feira", datas: ["18/05/2026", "25/05/2026"] },
  { diaSemana: "Terça-feira", datas: ["19/05/2026", "26/05/2026"] },
  { diaSemana: "Quarta-feira", datas: ["20/05/2026", "27/05/2026"] },
];

const horariosMock = ["08:00", "08:30", "09:00", "09:30", "10:00"];

export default function Home() {
  const [etapa, setEtapa] = useState<Etapa>("cpf");

  const [cpf, setCpf] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const [beneficiario, setBeneficiario] = useState<Beneficiario | null>(null);
  const [carteirinhaSelecionada, setCarteirinhaSelecionada] =
    useState<Carteirinha | null>(null);

  const [clinicas, setClinicas] = useState<Clinica[]>([]);
  const [clinicaSelecionada, setClinicaSelecionada] =
    useState<Clinica | null>(null);

  const [procedimentoClinico, setProcedimentoClinico] =
    useState<ProcedimentoClinico | null>(null);

  const [dentistasDisponiveis, setDentistasDisponiveis] = useState<Dentista[]>(
    []
  );

  const [dentistaSelecionado, setDentistaSelecionado] =
    useState<Dentista | null>(null);

  const [dataSelecionada, setDataSelecionada] = useState("");
  const [horarioSelecionado, setHorarioSelecionado] = useState("");
  const [agendamentoExistente, setAgendamentoExistente] = useState<any>(null);

  const [protocolo] = useState(`AG-${Math.floor(Math.random() * 100000)}`);

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
    const cpfLimpo = cpf.replace(/\D/g, "");

    const response = await fetch(`/api/beneficiario?cpf=${cpfLimpo}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Erro ao consultar beneficiário");
    }

    if (!data.carteirinhas || data.carteirinhas.length === 0) {
      throw new Error("Nenhuma carteirinha ativa disponível para agendamento.");
    }

    return {
      nome: data.beneficiario,
      carteirinhas: data.carteirinhas.map((carteirinha: any, index: number) => ({
        id: index + 1,
        numero: carteirinha.numero,
        tipo: carteirinha.tipo,
        descricao: carteirinha.descricao,
      })),
    };
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
    } catch (error: any) {
      setErro(error.message || "Não foi possível consultar o beneficiário");
    } finally {
      setLoading(false);
    }
  }

  async function selecionarCarteirinha(carteirinha: Carteirinha) {
    setCarteirinhaSelecionada(carteirinha);
    setClinicaSelecionada(null);
    setProcedimentoClinico(null);
    setDentistaSelecionado(null);
    setDentistasDisponiveis([]);
    setDataSelecionada("");
    setHorarioSelecionado("");
    setAgendamentoExistente(null);

    try {
      const responseAgendamentos = await fetch(
        `/api/agendamentos?carteirinha=${carteirinha.numero}`
      );

      const dadosAgendamentos = await responseAgendamentos.json();

      if (
        dadosAgendamentos.possuiAgendamentoFuturo &&
        dadosAgendamentos.agendamentos?.length > 0
      ) {
        setAgendamentoExistente(dadosAgendamentos.agendamentos[0]);
        setEtapa("agendamento-existente");
        return;
      }

      const respostaClinicas = await fetch("/api/clinicas");
      const dadosClinicas = await respostaClinicas.json();

      if (dadosClinicas.success) {
        setClinicas(dadosClinicas.clinicas);
      }

      setEtapa("unidade");
    } catch {
      setErro("Não foi possível carregar os dados para agendamento.");
    }
  }

  async function selecionarUnidade(clinica: Clinica) {
    setClinicaSelecionada(clinica);
    setProcedimentoClinico(null);
    setDentistaSelecionado(null);
    setDentistasDisponiveis([]);
    setDataSelecionada("");
    setHorarioSelecionado("");

    if (carteirinhaSelecionada?.tipo === "clinico") {
      setEtapa("procedimento");
      return;
    }

    if (carteirinhaSelecionada?.tipo === "ortodontia") {
      const response = await fetch(
        `/api/ultimo-ortodontista?carteirinha=${carteirinhaSelecionada.numero}&idClinica=${clinica.id}`
      );

      const data = await response.json();

      if (!data.possuiOrtodontistaAnterior) {
        setEtapa("inicio-ortodontico");
        return;
      }

      setDentistaSelecionado({
        id: data.ortodontista.id,
        nome: data.ortodontista.nome,
        especialidade: "Ortodontia",
      });

      setEtapa("datas");
    }
  }

  async function selecionarProcedimento(procedimento: ProcedimentoClinico) {
    setProcedimentoClinico(procedimento);
    setDentistaSelecionado(null);
    setDataSelecionada("");
    setHorarioSelecionado("");

    if (procedimento === "AUTORIZAÇÃO | RAIO X") {
      return;
    }

    if (!clinicaSelecionada) {
      setErro("Selecione uma unidade antes de continuar.");
      return;
    }

    const response = await fetch(
      `/api/dentistas?idClinica=${clinicaSelecionada.id}&tipo=clinico`
    );

    const data = await response.json();

    if (data.success) {
      setDentistasDisponiveis(data.dentistas);
    }

    setEtapa("dentista");
  }

  function selecionarDentista(dentista: Dentista) {
    setDentistaSelecionado(dentista);
    setDataSelecionada("");
    setHorarioSelecionado("");
    setEtapa("datas");
  }

  function selecionarData(data: string) {
    setDataSelecionada(data);
    setHorarioSelecionado("");
    setEtapa("horarios");
  }

  function selecionarHorario(horario: string) {
    setHorarioSelecionado(horario);
    setEtapa("resumo");
  }

  function confirmarAgendamento() {
    setEtapa("confirmacao");
  }

  function novoAgendamento() {
    setCpf("");
    setErro("");
    setBeneficiario(null);
    setCarteirinhaSelecionada(null);
    setClinicaSelecionada(null);
    setProcedimentoClinico(null);
    setDentistaSelecionado(null);
    setDentistasDisponiveis([]);
    setDataSelecionada("");
    setHorarioSelecionado("");
    setAgendamentoExistente(null);
    setEtapa("cpf");
  }

  function voltar() {
    if (etapa === "carteirinha") setEtapa("cpf");
    else if (etapa === "unidade") setEtapa("carteirinha");
    else if (etapa === "procedimento") setEtapa("unidade");
    else if (etapa === "dentista") setEtapa("procedimento");
    else if (etapa === "datas") {
      if (carteirinhaSelecionada?.tipo === "ortodontia") setEtapa("unidade");
      else setEtapa("dentista");
    } else if (etapa === "horarios") setEtapa("datas");
    else if (etapa === "resumo") setEtapa("horarios");
    else if (etapa === "agendamento-existente") setEtapa("carteirinha");
    else if (etapa === "inicio-ortodontico") setEtapa("unidade");
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl p-8 border border-slate-100">
        {etapa !== "cpf" && etapa !== "confirmacao" && (
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

        {etapa === "agendamento-existente" && agendamentoExistente && (
          <StepAgendamentoExistente
            agendamento={agendamentoExistente}
            onVoltar={() => setEtapa("carteirinha")}
          />
        )}

        {etapa === "inicio-ortodontico" && (
          <>
            <h1 className="text-2xl font-bold text-slate-800">
              Início de tratamento ortodôntico
            </h1>

            <p className="text-slate-500 mt-2">
              Para iniciar o tratamento ortodôntico, o agendamento deve ser
              realizado por nossa equipe.
            </p>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center mt-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 rounded-xl shadow-lg"
            >
              Falar no WhatsApp
            </a>
          </>
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
            clinicaSelecionada={clinicaSelecionada?.nome || ""}
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
            dentistas={dentistasDisponiveis}
            onSelecionarDentista={selecionarDentista}
          />
        )}

        {etapa === "datas" && (
          <StepDatas
            datasDisponiveis={datasDisponiveisMock}
            dataSelecionada={dataSelecionada}
            onSelecionarData={selecionarData}
          />
        )}

        {etapa === "horarios" && (
          <StepHorarios
            horarios={horariosMock}
            horarioSelecionado={horarioSelecionado}
            onSelecionarHorario={selecionarHorario}
          />
        )}

        {etapa === "resumo" && beneficiario && (
          <>
            <StepResumo
              beneficiario={beneficiario}
              carteirinhaSelecionada={carteirinhaSelecionada}
              clinicaSelecionada={clinicaSelecionada?.nome || ""}
              procedimentoClinico={procedimentoClinico}
              dentistaSelecionado={dentistaSelecionado}
              dataSelecionada={dataSelecionada}
              horarioSelecionado={horarioSelecionado}
              ehOrtodontia={carteirinhaSelecionada?.tipo === "ortodontia"}
            />

            <button
              onClick={confirmarAgendamento}
              className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 transition text-white font-semibold py-3 rounded-xl shadow-lg"
            >
              Finalizar agendamento
            </button>
          </>
        )}

        {etapa === "confirmacao" && beneficiario && dentistaSelecionado && (
          <StepConfirmacao
            paciente={beneficiario.nome}
            clinica={clinicaSelecionada?.nome || ""}
            dentista={dentistaSelecionado.nome}
            horario={`${dataSelecionada} às ${horarioSelecionado}`}
            procedimento={procedimentoClinico}
            protocolo={protocolo}
            onNovoAgendamento={novoAgendamento}
          />
        )}
      </div>
    </main>
  );
}