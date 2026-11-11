
import { supabaseAdmin } from "../../../services/supabaseAdmin";
import { supabasePortalAdmin } from "../../../services/supabasePortalAdmin";

async function obterToken() {
  const response = await fetch(`${process.env.API_BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "*/*",
    },
    body: JSON.stringify({
      username: process.env.API_USERNAME,
      password: process.env.API_PASSWORD,
    }),
  });

  const data = await response.json();

  return data.token || data.access_token || data.data;
}

async function lerResposta(response: Response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const idAgendamento = Number(body.idAgendamento);

    if (!Number.isSafeInteger(idAgendamento) || idAgendamento <= 0) {
      return Response.json(
        {
          success: false,
          message: "idAgendamento inválido ou não informado",
        },
        { status: 400 }
      );
    }

    const token = await obterToken();

    const response = await fetch(
      `${process.env.API_BASE_URL}/agenda-cancelamento`,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          idCooperativa: 1055,
          idAgendamento,
        }),
      }
    );

    const resultado = await lerResposta(response);

    if (!response.ok || !resultado.success) {
      return Response.json(
        {
          success: false,
          etapa: "cancelar_datasys",
          status: response.status,
          resultado,
        },
        { status: 500 }
      );
    }

    // Mantém a atualização original das pendências do WhatsApp.
    const { error: erroWhatsapp } = await supabaseAdmin
      .from("agendamentos_whatsapp")
      .update({
        status_envio: "cancelado",
      })
      .eq("id_atendimento", idAgendamento)
      .eq("status_envio", "pendente");

    if (erroWhatsapp) {
      console.error(
        "Cancelamento confirmado na Datasys, mas falhou a atualização do WhatsApp:",
        erroWhatsapp.message
      );
    }

    // Atualiza somente um agendamento já existente na auditoria.
    // Não cria registros fictícios.
    try {
      const { data: auditoria, error: erroAuditoria } =
        await supabasePortalAdmin
          .from("portal_agendamentos_auditoria")
          .update({
            status: "cancelado",
            cancelado_em: new Date().toISOString(),
          })
          .eq("id_agendamento_datasys", String(idAgendamento))
          .eq("status", "confirmado")
          .select("id_agendamento_datasys");

      if (erroAuditoria) {
        console.error(
          "Cancelamento confirmado na Datasys, mas falhou a atualização da auditoria:",
          erroAuditoria.message
        );
      } else if (!auditoria || auditoria.length === 0) {
        console.warn(
          "Cancelamento confirmado na Datasys, mas nenhum registro confirmado correspondente foi encontrado na auditoria."
        );
      }
    } catch (erro) {
      console.error(
        "Erro ao atualizar auditoria de cancelamento:",
        erro
      );
    }

    return Response.json({
      success: true,
      message: "Agendamento cancelado com sucesso",
      resultado,
    });
  } catch (error) {
    console.error("Erro ao cancelar agendamento:", error);

    return Response.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Erro ao cancelar agendamento",
      },
      { status: 500 }
    );
  }
}
