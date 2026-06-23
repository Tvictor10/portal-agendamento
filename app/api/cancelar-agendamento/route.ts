import { supabaseAdmin } from "../../../services/supabaseAdmin";

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

    if (!idAgendamento) {
      return Response.json(
        {
          success: false,
          message: "idAgendamento não informado",
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

    await supabaseAdmin
      .from("agendamentos_whatsapp")
      .update({
        status_envio: "cancelado",
      })
      .eq("id_atendimento", idAgendamento)
      .eq("status_envio", "pendente");

    return Response.json({
      success: true,
      message: "Agendamento cancelado com sucesso",
      resultado,
    });
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}