
import {
  identificarOrigem,
  registrarAgendamentoConfirmado,
  type IdentidadeAgendamento,
} from "../../../services/portalAgendamentosAuditoria";

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

export async function POST(request: Request) {
  const body = await request.json();

  let identidade: IdentidadeAgendamento;

  // Identifica a origem automaticamente pela sessao Supabase.
  // Nao utiliza o campo "origem" enviado pelo navegador.
  try {
    identidade = await identificarOrigem();
  } catch (error) {
    console.error(
      "Falha ao identificar a origem do agendamento:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          "Não foi possível validar a sessão. Atualize a página e tente novamente.",
      },
      { status: 401 }
    );
  }

  // Autenticacao na API Datasys.
  const token = await obterToken();

  // Mantem o payload original do agendamento.
  const payload = {
    idCooperativa: 1055,
    idClinica: body.idClinica,
    idCorpoClinico: body.idCorpoClinico,
    dataEvento: body.dataEvento,
    horaInicio: body.horaInicio,
    codCarteirinha: body.codCarteirinha,
  };

  const url = `${process.env.API_BASE_URL}/agenda-evento`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const raw = await response.text();

  // Preserva o formato de resposta utilizado pelo portal.
  const resultado = {
    success: response.ok,
    status: response.status,
    url,
    payload,
    raw,
  };

  // Registra auditoria somente apos confirmacao da Datasys.
  if (response.ok) {
    try {
      const dadosResposta = JSON.parse(raw);

      if (dadosResposta.success === true) {
        const auditoria = await registrarAgendamentoConfirmado({
          identidade,
          idAgendamentoDatasys: dadosResposta.data ?? null,
          carteirinha: body.codCarteirinha,
          idClinica: body.idClinica,
          idCorpoClinico: body.idCorpoClinico,
          dataEvento: body.dataEvento,
          horaInicio: body.horaInicio,
        });

        if (!auditoria.success) {
          console.error(
            "Agendamento confirmado, mas auditoria não registrada:",
            auditoria.mensagem
          );
        }
      }
    } catch (error) {
      console.error(
        "Não foi possível processar a auditoria do agendamento:",
        error
      );
    }
  }

  return Response.json(resultado);
}
