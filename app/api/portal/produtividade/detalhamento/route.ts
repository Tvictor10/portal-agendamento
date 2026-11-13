
import { NextRequest, NextResponse } from "next/server";
import { createPortalServerClient } from "../../../../../services/supabasePortalServer";
import { supabasePortalAdmin } from "../../../../../services/supabasePortalAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMITE_LOTE = 500;

type TipoRelatorio = "realizados" | "cancelados";

function respostaErro(mensagem: string, status: number) {
  return NextResponse.json(
    { success: false, mensagem },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    }
  );
}

async function verificarAdministrador() {
  const supabase = await createPortalServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return false;

  const { data: usuario, error: perfilErro } = await supabase
    .from("portal_usuarios")
    .select("perfil, ativo")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return (
    !perfilErro &&
    usuario?.ativo === true &&
    usuario?.perfil === "admin"
  );
}

function dataISOValida(valor: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;

  const data = new Date(`${valor}T12:00:00Z`);

  return (
    !Number.isNaN(data.getTime()) &&
    data.toISOString().slice(0, 10) === valor
  );
}

function inicioBrasiliaUTC(data: string) {
  const referencia = new Date(`${data}T12:00:00Z`);

  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    timeZoneName: "shortOffset",
  }).formatToParts(referencia);

  const nomeFuso =
    partes.find((parte) => parte.type === "timeZoneName")
      ?.value ?? "GMT-3";

  const correspondencia = nomeFuso.match(
    /GMT([+-])(\d{1,2})(?::(\d{2}))?/
  );

  let deslocamento = -180;

  if (correspondencia) {
    deslocamento =
      (correspondencia[1] === "+" ? 1 : -1) *
      (Number(correspondencia[2]) * 60 +
        Number(correspondencia[3] ?? 0));
  }

  return new Date(
    Date.parse(`${data}T00:00:00Z`) - deslocamento * 60_000
  ).toISOString();
}

function adicionarDia(data: string) {
  const valor = new Date(`${data}T12:00:00Z`);
  valor.setUTCDate(valor.getUTCDate() + 1);
  return valor.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  try {
    if (!(await verificarAdministrador())) {
      return respostaErro("Acesso não autorizado.", 403);
    }

    const parametros = request.nextUrl.searchParams;
    const funcionarioId = parametros.get("funcionarioId");
    const tipo = parametros.get("tipo") ?? "realizados";
    const inicio = parametros.get("inicio") ?? "";
    const fim = parametros.get("fim") ?? "";

    if (
      !dataISOValida(inicio) ||
      !dataISOValida(fim) ||
      inicio > fim
    ) {
      return respostaErro("Período inválido.", 400);
    }

    if (tipo !== "realizados" && tipo !== "cancelados") {
      return respostaErro("Tipo de relatório inválido.", 400);
    }

    if (
      funcionarioId &&
      !/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(funcionarioId)
    ) {
      return respostaErro("Funcionário inválido.", 400);
    }

    const campoData =
      tipo === "cancelados" ? "cancelado_em" : "criado_em";

    const dataInicio = inicioBrasiliaUTC(inicio);
    const dataFim = inicioBrasiliaUTC(adicionarDia(fim));

    type Auditoria = {
      id_agendamento_datasys: string;
      usuario_id: string | null;
      origem: string;
      carteirinha: string;
      data_evento: string;
      hora_inicio: string;
      status: string;
      criado_em: string;
      confirmado_em: string | null;
      cancelado_em: string | null;
    };

    const auditorias: Auditoria[] = [];
    let deslocamento = 0;

    while (true) {
      let consulta = supabasePortalAdmin
        .from("portal_agendamentos_auditoria")
        .select(
          "id_agendamento_datasys, usuario_id, origem, carteirinha, data_evento, hora_inicio, status, criado_em, confirmado_em, cancelado_em"
        )
        .gte(campoData, dataInicio)
        .lt(campoData, dataFim)
        .order(campoData, { ascending: false })
        .range(deslocamento, deslocamento + LIMITE_LOTE - 1);

      if (tipo === "cancelados") {
        consulta = consulta
          .eq("status", "cancelado")
          .not("cancelado_em", "is", null);
      }

      if (funcionarioId) {
        consulta = consulta.eq("usuario_id", funcionarioId);
      }

      const { data, error } = await consulta;

      if (error) {
        console.error("Erro na auditoria:", error.message);
        return respostaErro("Falha ao consultar agendamentos.", 500);
      }

      const lote = (data ?? []) as Auditoria[];
      auditorias.push(...lote);

      if (lote.length < LIMITE_LOTE) break;
      deslocamento += LIMITE_LOTE;
    }

    const ids = [
      ...new Set(
        auditorias
          .map((registro) => registro.id_agendamento_datasys)
          .filter((id) => /^\d+$/.test(id))
          .map(Number)
          .filter(Number.isSafeInteger)
      ),
    ];

    type DadosWhatsapp = {
      id: number;
      id_atendimento: number | null;
      nome: string | null;
      carteirinha: string | null;
      unidade: string | null;
      dentista: string | null;
      especialidade: string | null;
      data_agendamento: string | null;
      horario: string | null;
    };

    const whatsappPorId = new Map<number, DadosWhatsapp>();

    for (let indice = 0; indice < ids.length; indice += LIMITE_LOTE) {
      const loteIds = ids.slice(indice, indice + LIMITE_LOTE);

      const { data, error } = await supabasePortalAdmin
        .from("agendamentos_whatsapp")
        .select(
          "id, id_atendimento, nome, carteirinha, unidade, dentista, especialidade, data_agendamento, horario"
        )
        .in("id_atendimento", loteIds)
        .order("id", { ascending: false });

      if (error) {
        console.error("Erro ao consultar WhatsApp:", error.message);
        return respostaErro("Falha ao consultar dados dos agendamentos.", 500);
      }

      for (const registro of (data ?? []) as DadosWhatsapp[]) {
        if (
          registro.id_atendimento !== null &&
          !whatsappPorId.has(registro.id_atendimento)
        ) {
          whatsappPorId.set(registro.id_atendimento, registro);
        }
      }
    }

    const idsFuncionarios = [
      ...new Set(
        auditorias
          .map((registro) => registro.usuario_id)
          .filter((id): id is string => Boolean(id))
      ),
    ];

    const nomesFuncionarios = new Map<string, string>();

    for (
      let indice = 0;
      indice < idsFuncionarios.length;
      indice += LIMITE_LOTE
    ) {
      const { data, error } = await supabasePortalAdmin
        .from("portal_usuarios")
        .select("id, nome")
        .in(
          "id",
          idsFuncionarios.slice(indice, indice + LIMITE_LOTE)
        );

      if (error) {
        console.error("Erro ao consultar funcionários:", error.message);
        return respostaErro("Falha ao consultar funcionários.", 500);
      }

      for (const funcionario of data ?? []) {
        nomesFuncionarios.set(funcionario.id, funcionario.nome);
      }
    }

    const registros = auditorias.map((auditoria) => {
      const id = Number(auditoria.id_agendamento_datasys);
      const whatsapp = whatsappPorId.get(id);

      return {
        id_agendamento_datasys: auditoria.id_agendamento_datasys,
        funcionario:
          auditoria.usuario_id
            ? nomesFuncionarios.get(auditoria.usuario_id) ??
              "Funcionário não identificado"
            : auditoria.origem === "cliente"
              ? "Autoagendamento"
              : "Não identificado",
        origem: auditoria.origem,
        nome: whatsapp?.nome ?? "Não informado",
        carteirinha:
          whatsapp?.carteirinha ?? auditoria.carteirinha,
        unidade: whatsapp?.unidade ?? "Não informada",
        dentista: whatsapp?.dentista ?? "Não informado",
        especialidade: whatsapp?.especialidade?.trim() || "Não informada",
        data_agendamento:
          whatsapp?.data_agendamento ?? auditoria.data_evento,
        horario: whatsapp?.horario ?? auditoria.hora_inicio,
        status: auditoria.status,
        criado_em: auditoria.criado_em,
        confirmado_em: auditoria.confirmado_em,
        cancelado_em: auditoria.cancelado_em,
      };
    });

    return NextResponse.json(
      {
        success: true,
        tipo: tipo as TipoRelatorio,
        inicio,
        fim,
        total: registros.length,
        registros,
      },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("Erro no detalhamento:", error);
    return respostaErro("Não foi possível gerar o relatório.", 500);
  }
}
