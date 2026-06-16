"use client";
import Image from "next/image";

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

import {
  PROCEDIMENTOS_CLINICOS,
  PROCEDIMENTOS_COM_ENCAMINHAMENTO,
  MENSAGEM_ENCAMINHAMENTO,
  WHATSAPP_URL,
} from "../config/regrasAgendamento";

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
  celular?: string;
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

type GrupoDatas = {
  diaSemana: string;
  datas: string[];
};

type ProcedimentoClinico =
  (typeof PROCEDIMENTOS_CLINICOS)[number];

export default function Home() {
  const [etapa, setEtapa] = useState<Etapa>("cpf");

  const [cpf, setCpf] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensagemLoading, setMensagemLoading] = useState("");

  const [arquivoEncaminhamento, setArquivoEncaminhamento] =
  useState<File | null>(null);

  const [beneficiario, setBeneficiario] =
    useState<Beneficiario | null>(null);

  const [carteirinhaSelecionada, setCarteirinhaSelecionada] =
    useState<Carteirinha | null>(null);

  const [clinicas, setClinicas] = useState<Clinica[]>([]);

  const [clinicaSelecionada, setClinicaSelecionada] =
    useState<Clinica | null>(null);

  const [procedimentoClinico, setProcedimentoClinico] =
    useState<ProcedimentoClinico | null>(null);

  const [dentistasDisponiveis, setDentistasDisponiveis] =
    useState<Dentista[]>([]);

  const [dentistaSelecionado, setDentistaSelecionado] =
    useState<Dentista | null>(null);

  const [datasDisponiveis, setDatasDisponiveis] =
    useState<GrupoDatas[]>([]);

  const [horariosPorData, setHorariosPorData] =
    useState<Record<string, string[]>>({});

  const [dataSelecionada, setDataSelecionada] = useState("");
  const [horarioSelecionado, setHorarioSelecionado] =
    useState("");

  const [agendamentoExistente, setAgendamentoExistente] =
    useState<any>(null);

  const [protocolo] = useState(
    `AG-${Math.floor(Math.random() * 100000)}`
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

  function handleCPFChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    setCpf(formatCPF(e.target.value));

    if (erro) {
      setErro("");
    }
  }

  async function consultarBeneficiario() {
    const cpfLimpo = cpf.replace(/\D/g, "");

    const response = await fetch(
      `/api/beneficiario?cpf=${cpfLimpo}`
    );

    const data = await response.json();

    if (!data.success) {
      throw new Error(
        data.message || "Erro ao consultar beneficiário"
      );
    }

    if (!data.carteirinhas || data.carteirinhas.length === 0) {
  throw new Error(
    "CPF não encontrado, verifique os dados inseridos."
  );
}

const cpfResponsavel =
  data.carteirinhas?.[0]?.cpfRespFinanceiro?.replace(/\D/g, "") ||
  cpfLimpo;

const financeiroResponse = await fetch(
  `/api/financeiro?cpf=${cpfResponsavel}`
);

const financeiro = await financeiroResponse.json();

if (financeiro.inadimplente) {
  throw new Error(
    "Seu agendamento precisa ser realizado por nossa equipe. Entre em contato pelo WhatsApp."
  );
}

   if (
  !data.carteirinhas ||
  data.carteirinhas.length === 0
) {
  throw new Error(
    "CPF não encontrado, verifique os dados inseridos."
  );
}

return {
  nome: data.beneficiario,
  celular: data.carteirinhas?.[0]?.celular || "",
  carteirinhas: data.carteirinhas,
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
      setErro(
        error.message ||
          "Não foi possível consultar o beneficiário"
      );
    } finally {
      setLoading(false);
    }
  }

  async function carregarClinicas() {
    const response = await fetch("/api/clinicas");

    const data = await response.json();

    if (data.success) {
      setClinicas(data.clinicas);
    }
  }

  async function carregarDatasDisponiveis(
  dentista: Dentista,
  clinica: Clinica,
  carteirinhaParam?: Carteirinha
) {
  const carteirinhaUsada = carteirinhaParam || carteirinhaSelecionada;

  if (!carteirinhaUsada) {
    setErro("Carteirinha não selecionada.");
    return;
  }

  setDatasDisponiveis([]);
  setHorariosPorData({});

  const response = await fetch(
    `/api/datas-disponiveis?idClinica=${clinica.id}&idCorpoClinico=${dentista.id}&carteirinha=${carteirinhaUsada.numero}&tipo=${carteirinhaUsada.tipo}`
  );

  const data = await response.json();

  setDatasDisponiveis(data.datasDisponiveis || []);
  setHorariosPorData(data.horariosPorData || {});
}

  async function selecionarCarteirinha(
    carteirinha: Carteirinha
  ) {
    setCarteirinhaSelecionada(carteirinha);

    const responseAgendamentos = await fetch(
      `/api/agendamentos?carteirinha=${carteirinha.numero}`
    );

    const dadosAgendamentos =
      await responseAgendamentos.json();

    if (
      dadosAgendamentos.possuiAgendamentoFuturo &&
      dadosAgendamentos.agendamentos?.length > 0
    ) {
      setAgendamentoExistente(
        dadosAgendamentos.agendamentos[0]
      );

      setEtapa("agendamento-existente");

      return;
    }

    if (carteirinha.tipo === "ortodontia") {
      const response = await fetch(
        `/api/ultimo-ortodontista?carteirinha=${carteirinha.numero}`
      );

      const data = await response.json();

      if (!data.possuiOrtodontistaAnterior) {
        setEtapa("inicio-ortodontico");
        return;
      }

      const clinica = data.clinica;

      const dentista = {
        id: data.ortodontista.id,
        nome: data.ortodontista.nome,
        especialidade: "Ortodontia",
      };

      setClinicaSelecionada(clinica);
      setDentistaSelecionado(dentista);

      await carregarDatasDisponiveis(
  dentista,
  clinica,
  carteirinha
);

      setEtapa("datas");

      return;
    }

    await carregarClinicas();

    setEtapa("unidade");
  }

  async function selecionarUnidade(
    clinica: Clinica
  ) {
    setClinicaSelecionada(clinica);

    setEtapa("procedimento");
  }

  async function selecionarProcedimento(
    procedimento: ProcedimentoClinico
  ) {
    setProcedimentoClinico(procedimento);

    if (procedimento === "AUTORIZAÇÃO | RAIO X") {
      window.open(WHATSAPP_URL, "_blank");
      return;
    }

    if (!clinicaSelecionada) return;

    const response = await fetch(
      `/api/dentistas?idClinica=${clinicaSelecionada.id}&tipo=clinico&procedimento=${encodeURIComponent(procedimento)}`
    );

    const data = await response.json();

    setDentistasDisponiveis(data.dentistas || []);

    setEtapa("dentista");
  }

  async function selecionarDentista(
    dentista: Dentista
  ) {
    if (!clinicaSelecionada) return;

    setDentistaSelecionado(dentista);

    await carregarDatasDisponiveis(
      dentista,
      clinicaSelecionada
    );

    setEtapa("datas");
  }

  function selecionarData(data: string) {
    setDataSelecionada(data);

    setEtapa("horarios");
  }

  function selecionarHorario(horario: string) {
    setHorarioSelecionado(horario);

    setEtapa("resumo");
  }

  async function confirmarAgendamento() {
    if (
      !carteirinhaSelecionada ||
      !clinicaSelecionada ||
      !dentistaSelecionado
    ) {
      return;
    }

const exigeEncaminhamento =
  procedimentoClinico &&
  PROCEDIMENTOS_COM_ENCAMINHAMENTO.includes(
    procedimentoClinico
  );

if (exigeEncaminhamento && !arquivoEncaminhamento) {
  setErro(
    "Para este procedimento é obrigatório anexar o encaminhamento."
  );

  return;
}
    
    try {
      setLoading(true);

      const response = await fetch("/api/agendar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idClinica: clinicaSelecionada.id,
          idCorpoClinico: dentistaSelecionado.id,
          dataEvento: dataSelecionada,
          horaInicio: horarioSelecionado,
          codCarteirinha:
            carteirinhaSelecionada.numero,
        }),
      });

      const data = await response.json();

      const raw = JSON.parse(data.raw || "{}");

      if (!raw.success) {
        throw new Error(
          raw.message ||
            "Não foi possível realizar o agendamento."
        );
      }

      await fetch("/api/salvar-agendamento-whatsapp", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    nome: beneficiario?.nome || "",
    telefone: beneficiario?.celular || "",
    carteirinha: carteirinhaSelecionada.numero,
    idAtendimento: raw.idAtendimento || raw.data?.idAtendimento || null,
    data: dataSelecionada,
    horario: horarioSelecionado,
    unidade: clinicaSelecionada.nome,
    dentista: dentistaSelecionado.nome,
  }),
});

      const exigeEncaminhamento =
  procedimentoClinico &&
  PROCEDIMENTOS_COM_ENCAMINHAMENTO.includes(
    procedimentoClinico
  );

if (exigeEncaminhamento && arquivoEncaminhamento) {
  const formData = new FormData();

  formData.append("nome", beneficiario?.nome || "");
  formData.append("cpf", cpf.replace(/\D/g, ""));
  formData.append(
    "carteirinha",
    carteirinhaSelecionada.numero
  );
  formData.append(
    "procedimento",
    procedimentoClinico || ""
  );
  formData.append("data", dataSelecionada);
  formData.append("horario", horarioSelecionado);
  formData.append("unidade", clinicaSelecionada.nome);
  formData.append("dentista", dentistaSelecionado.nome);
  formData.append("arquivo", arquivoEncaminhamento);

  const clickupResponse = await fetch(
    "/api/clickup-encaminhamento",
    {
      method: "POST",
      body: formData,
    }
  );

  const clickupData = await clickupResponse.json();

  if (!clickupData.success) {
    throw new Error(
      "Agendamento realizado, mas não foi possível enviar o encaminhamento para análise."
    );
  }
}

      /*
      await fetch("/api/rd-whatsapp", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    nome: beneficiario?.nome || "",
    telefone:
  beneficiario?.celular || "",
    data: dataSelecionada,
    horario: horarioSelecionado,
    unidade: clinicaSelecionada.nome,
    dentista: dentistaSelecionado.nome,
  }),
}); */

      setEtapa("confirmacao");
    } catch (error: any) {
      setErro(
        error.message ||
          "Erro ao finalizar agendamento."
      );
    } finally {
      setLoading(false);
    }
  }

  function voltar() {
    if (etapa === "carteirinha") {
      setEtapa("cpf");
    } else if (etapa === "unidade") {
      setEtapa("carteirinha");
    } else if (etapa === "procedimento") {
      setEtapa("unidade");
    } else if (etapa === "dentista") {
      setEtapa("procedimento");
    } else if (etapa === "datas") {
      if (
        carteirinhaSelecionada?.tipo ===
        "ortodontia"
      ) {
        setEtapa("carteirinha");
      } else {
        setEtapa("dentista");
      }
    } else if (etapa === "horarios") {
      setEtapa("datas");
    } else if (etapa === "resumo") {
      setEtapa("horarios");
    }
  }

  const mostrarObservacaoEncaminhamento =
    procedimentoClinico !== null &&
    PROCEDIMENTOS_COM_ENCAMINHAMENTO.includes(
      procedimentoClinico
    );

  return (
    <main className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl p-8 border border-slate-100">
        <div className="flex justify-center mb-6">
  <Image
    src="/logo.png"
    alt="Logo"
    width={180}
    height={60}
    priority
  />
</div>
        {etapa !== "cpf" &&
          etapa !== "confirmacao" && (
            <button
              onClick={voltar}
              className="mb-6 text-sm font-semibold text-slate-500"
            >
              ← Voltar
            </button>
          )}

        {erro && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {erro}
          </div>
        )}

        {mensagemLoading && (
  <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
    {mensagemLoading}
  </div>
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

        {etapa === "carteirinha" &&
          beneficiario && (
            <StepCarteirinha
              beneficiario={beneficiario}
              onSelecionarCarteirinha={
                selecionarCarteirinha
              }
            />
          )}

        {etapa === "agendamento-existente" &&
          agendamentoExistente && (
            <StepAgendamentoExistente
              agendamento={
                agendamentoExistente
              }
              onVoltar={() =>
                setEtapa("carteirinha")
              }
            />
          )}

        {etapa === "inicio-ortodontico" && (
          <div>
            <h1 className="text-2xl font-bold">
              Início de tratamento
            </h1>

            <a
              href={WHATSAPP_URL}
              target="_blank"
              className="block mt-6 bg-green-600 text-white text-center py-3 rounded-xl"
            >
              Falar no WhatsApp
            </a>
          </div>
        )}

        {etapa === "unidade" && (
          <StepUnidade
            carteirinhaDescricao={
              carteirinhaSelecionada?.descricao
            }
            clinicas={clinicas}
            onSelecionarUnidade={
              selecionarUnidade
            }
          />
        )}

        {etapa === "procedimento" && (
         <StepProcedimento
  clinicaSelecionada={clinicaSelecionada?.nome || ""}
  procedimentos={PROCEDIMENTOS_CLINICOS as unknown as ProcedimentoClinico[]}
  procedimentoSelecionado={procedimentoClinico}
  onSelecionarProcedimento={selecionarProcedimento}
  whatsappUrl={WHATSAPP_URL}
          />
        )}

        {etapa === "dentista" && (
          <StepDentista
            procedimentoClinico={
              procedimentoClinico
            }
            mostrarObservacaoEncaminhamento={
              mostrarObservacaoEncaminhamento
            }
            mensagemEncaminhamento={
              MENSAGEM_ENCAMINHAMENTO
            }
            dentistas={dentistasDisponiveis}
            dentistaSelecionado={dentistaSelecionado}
          onSelecionarDentista={(dentista) =>
  selecionarDentista(dentista)
}
          />
        )}

        {etapa === "datas" && (
          <StepDatas
            datasDisponiveis={
              datasDisponiveis
            }
            dataSelecionada={
              dataSelecionada
            }
            onSelecionarData={
              selecionarData
            }
          />
        )}

        {etapa === "horarios" && (
          <StepHorarios
            horarios={
              horariosPorData[
                dataSelecionada
              ] || []
            }
            horarioSelecionado={
              horarioSelecionado
            }
            onSelecionarHorario={
              selecionarHorario
            }
          />
        )}

        {etapa === "resumo" &&
          beneficiario &&
          dentistaSelecionado && (
            <>
              <StepResumo
                beneficiario={beneficiario}
                carteirinhaSelecionada={
                  carteirinhaSelecionada
                }
                clinicaSelecionada={
                  clinicaSelecionada?.nome ||
                  ""
                }
                procedimentoClinico={
                  procedimentoClinico
                }
                dentistaSelecionado={
                  dentistaSelecionado
                }
                dataSelecionada={
                  dataSelecionada
                }
                horarioSelecionado={
                  horarioSelecionado
                }
                ehOrtodontia={
                  carteirinhaSelecionada?.tipo ===
                  "ortodontia"
                }

                arquivoEncaminhamento={arquivoEncaminhamento}
                setArquivoEncaminhamento={setArquivoEncaminhamento}
              />

{mostrarObservacaoEncaminhamento && (
  <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
    {MENSAGEM_ENCAMINHAMENTO}
  </div>
)}

              <button
                onClick={
                  confirmarAgendamento
                }
                disabled={loading}
                className="w-full mt-4 bg-blue-600 text-white py-3 rounded-xl"
              >
                {loading
                  ? "Finalizando..."
                  : "Finalizar agendamento"}
              </button>
            </>
          )}

        {etapa === "confirmacao" &&
          beneficiario &&
          dentistaSelecionado && (
            <StepConfirmacao
              paciente={
                beneficiario.nome
              }
              clinica={
                clinicaSelecionada?.nome ||
                ""
              }
              dentista={
                dentistaSelecionado.nome
              }
              horario={`${dataSelecionada} às ${horarioSelecionado}`}
              procedimento={
                procedimentoClinico
              }
              protocolo={protocolo}
              onNovoAgendamento={() =>
                window.location.reload()
              }
            />
          )}
      </div>
    </main>
  );
}