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

function converterDataBR(data: string) {
  const [dia, mes, ano] = data.split("/");
  return new Date(Number(ano), Number(mes) - 1, Number(dia));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cpf = searchParams.get("cpf");

  if (!cpf) {
    return Response.json(
      { success: false, message: "CPF não informado" },
      { status: 400 }
    );
  }

  try {
    const token = await obterToken();
    const idCooperativa = 1055;

    const url =
      `${process.env.API_BASE_URL}/agenda-beneficiario-cpf` +
      `?idCooperativa=${idCooperativa}` +
      `&cpf=${cpf}` +
      `&dataInicio=01/01/2026` +
      `&dataFim=12/31/2026`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await response.json();

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const agendamentos = json.data || [];

    const agendamentosFuturos = agendamentos.filter((item: any) => {
      if (!item.dataAgendamento) return false;

      const dataAgendamento = converterDataBR(item.dataAgendamento);
      dataAgendamento.setHours(0, 0, 0, 0);

      return dataAgendamento > hoje;
    });

    const proximoAgendamento = agendamentosFuturos[0];

    return Response.json({
      success: true,
      possuiAgendamentoFuturo: Boolean(proximoAgendamento),
      agendamento: proximoAgendamento
        ? {
            local: proximoAgendamento.local,
            prestador: proximoAgendamento.nomePrestador,
            carteirinha: proximoAgendamento.codCarteirinha,
            beneficiario: proximoAgendamento.nomeBeneficiario,
            descricao: proximoAgendamento.descricao,
            data: proximoAgendamento.dataAgendamento,
            horario: proximoAgendamento.horario,
            status: proximoAgendamento.statusAgendamento,
            telefone: proximoAgendamento.telefone,
            observacao: proximoAgendamento.observacao,
          }
        : null,
      raw: json,
    });
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        message: "Erro ao consultar agendamentos",
        detalhe: error.message,
      },
      { status: 500 }
    );
  }
}