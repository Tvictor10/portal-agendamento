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

function normalizarTexto(texto: string) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

async function buscarOrtodontistasDaClinica(token: string, idClinica: number) {
  const idCooperativa = 1055;

  const url =
    `${process.env.API_BASE_URL}/agenda-ddl-corpo-clinico` +
    `?idCooperativa=${idCooperativa}` +
    `&idClinica=${idClinica}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await response.json();

  return (json.data || [])
    .filter((item: any) => item.isOrtodontista === "1")
    .map((item: any) => ({
      id: Number(item.dataValueField),
      nome: String(item.dataTextField).trim(),
      nomeNormalizado: normalizarTexto(item.dataTextField),
    }));
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const carteirinha = searchParams.get("carteirinha");
    const idClinica = Number(searchParams.get("idClinica") || 16595);

    if (!carteirinha) {
      return Response.json(
        { success: false, message: "Carteirinha não informada" },
        { status: 400 }
      );
    }

    const token = await obterToken();
    const idCooperativa = 1055;

    const url =
      `${process.env.API_BASE_URL}/agenda-beneficiario` +
      `?idCooperativa=${idCooperativa}` +
      `&carteirinha=${carteirinha}` +
      `&dataInicio=01/01/2020` +
      `&dataFim=12/31/2030`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await response.json();
    const agendamentos = json.data || [];

    const ortodontistas = await buscarOrtodontistasDaClinica(token, idClinica);

    const agendamentoComOrtodontista = agendamentos.find((agendamento: any) => {
      const prestadorNormalizado = normalizarTexto(agendamento.prestador);

      return ortodontistas.some((ortodontista: any) =>
        prestadorNormalizado.includes(ortodontista.nomeNormalizado)
      );
    });

    if (!agendamentoComOrtodontista) {
      return Response.json({
        success: true,
        possuiOrtodontistaAnterior: false,
        message:
          "Não foi encontrado agendamento ortodôntico anterior para esta carteirinha.",
        ortodontista: null,
        raw: json,
        ortodontistasConsultados: ortodontistas,
      });
    }

    const prestadorNormalizado = normalizarTexto(
      agendamentoComOrtodontista.prestador
    );

    const ortodontistaEncontrado = ortodontistas.find((ortodontista: any) =>
      prestadorNormalizado.includes(ortodontista.nomeNormalizado)
    );

    return Response.json({
      success: true,
      possuiOrtodontistaAnterior: true,
      ortodontista: {
        id: ortodontistaEncontrado?.id,
        nome: ortodontistaEncontrado?.nome || agendamentoComOrtodontista.prestador,
        dataUltimoAgendamento: agendamentoComOrtodontista.dataAgenda,
        horaUltimoAgendamento: agendamentoComOrtodontista.horaInicio,
        idAtendimento: agendamentoComOrtodontista.idAtendimento,
      },
      raw: json,
    });
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        message: "Erro ao buscar último ortodontista",
        detalhe: error.message,
      },
      { status: 500 }
    );
  }
}