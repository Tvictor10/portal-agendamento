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

  const carteirinha = searchParams.get("carteirinha");

  if (!carteirinha) {
    return Response.json(
      {
        success: false,
        message: "Carteirinha não informada",
      },
      { status: 400 }
    );
  }

  try {
    const token = await obterToken();

    const idCooperativa = 1055;

    const hoje = new Date();

    const diaInicio = String(hoje.getDate()).padStart(2, "0");
    const mesInicio = String(hoje.getMonth() + 1).padStart(2, "0");
    const anoInicio = hoje.getFullYear();

    const dataInicio = `${mesInicio}/${diaInicio}/${anoInicio}`;

    const dataFimObj = new Date(
      hoje.getFullYear() + 1,
      hoje.getMonth(),
      hoje.getDate()
    );

    const diaFim = String(dataFimObj.getDate()).padStart(2, "0");
    const mesFim = String(dataFimObj.getMonth() + 1).padStart(2, "0");
    const anoFim = dataFimObj.getFullYear();

    const dataFim = `${mesFim}/${diaFim}/${anoFim}`;

    const url =
      `${process.env.API_BASE_URL}/agenda-beneficiario` +
      `?idCooperativa=${idCooperativa}` +
      `&carteirinha=${carteirinha}` +
      `&dataInicio=${dataInicio}` +
      `&dataFim=${dataFim}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const text = await response.text();

    let json: any = {};

    try {
      json = JSON.parse(text);
    } catch {
      return Response.json(
        {
          success: false,
          message: "A API de agendamentos não retornou JSON válido",
          status: response.status,
          url,
          raw: text,
        },
        { status: 500 }
      );
    }

    const hojeSemHora = new Date();
    hojeSemHora.setHours(0, 0, 0, 0);

    const agendamentos = json.data || [];

    const agendamentosFuturos = agendamentos.filter((item: any) => {
      if (!item.dataAgenda) return false;

      const dataAgenda = converterDataBR(item.dataAgenda);

      dataAgenda.setHours(0, 0, 0, 0);

      return dataAgenda > hojeSemHora;
    });

    return Response.json({
      success: true,
      possuiAgendamentoFuturo: agendamentosFuturos.length > 0,
      quantidade: agendamentosFuturos.length,
      agendamentos: agendamentosFuturos,
      dataInicio,
      dataFim,
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