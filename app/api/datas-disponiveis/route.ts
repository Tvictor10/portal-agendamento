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

function formatarDataBR(data: Date) {
  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const ano = data.getFullYear();

  return `${dia}/${mes}/${ano}`;
}

function formatarDataHoraISO(data: Date, usarInicioDoDia = false) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  const hora = usarInicioDoDia ? "00:00:00" : "08:00:00";

  return `${ano}-${mes}-${dia}T${hora}`;
}

function obterDiaSemana(data: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
  }).format(data);
}

function converterDataBR(data: string) {
  const [dia, mes, ano] = data.split("/");
  return new Date(Number(ano), Number(mes) - 1, Number(dia));
}

function converterDataApi(dataHora: string) {
  const [data, hora] = dataHora.split(" ");
  const [mes, dia, ano] = data.split("/");

  return {
    dataBR: `${dia}/${mes}/${ano}`,
    hora: hora.slice(0, 5),
    date: new Date(Number(ano), Number(mes) - 1, Number(dia)),
  };
}

function segundaDaProximaSemana(data: Date) {
  const novaData = new Date(data);
  novaData.setHours(0, 0, 0, 0);

  const diaSemana = novaData.getDay();
  const diasAteProximaSegunda = ((8 - diaSemana) % 7) || 7;

  novaData.setDate(novaData.getDate() + diasAteProximaSegunda);

  return novaData;
}

function primeiroDiaDoProximoMes(data: Date) {
  return new Date(data.getFullYear(), data.getMonth() + 1, 1);
}

function mesmaCompetencia(dataA: Date, dataB: Date) {
  return (
    dataA.getFullYear() === dataB.getFullYear() &&
    dataA.getMonth() === dataB.getMonth()
  );
}

function obterDataLimiteAgenda(tipo?: string | null) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();

  if (tipo === "ortodontia") {
    return new Date(ano, mes + 2, 0);
  }

  if (hoje.getDate() >= 25) {
    return new Date(ano, mes + 2, 0);
  }

  return new Date(ano, mes + 1, 0);
}

async function buscarUltimoAgendamento(
  token: string,
  carteirinha: string
) {
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

  const agendamentosOrdenados = agendamentos
    .filter((item: any) => item.dataAgenda)
    .sort((a: any, b: any) => {
      return (
        converterDataBR(b.dataAgenda).getTime() -
        converterDataBR(a.dataAgenda).getTime()
      );
    });

  return agendamentosOrdenados[0] || null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const idClinica = searchParams.get("idClinica");
    const idCorpoClinico = searchParams.get("idCorpoClinico");
    const carteirinha = searchParams.get("carteirinha");
    const tipo = searchParams.get("tipo");

    if (!idClinica || !idCorpoClinico) {
      return Response.json(
        {
          success: false,
          message: "idClinica e idCorpoClinico são obrigatórios",
        },
        { status: 400 }
      );
    }

    const token = await obterToken();
    const idCooperativa = 1055;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    const limite = obterDataLimiteAgenda(tipo);

    let dataMinimaPermitida = new Date(amanha);

    if (carteirinha) {
      const ultimoAgendamento = await buscarUltimoAgendamento(
        token,
        carteirinha
      );

      if (tipo === "clinico" && ultimoAgendamento?.dataAgenda) {
        const dataUltimoAgendamento = converterDataBR(
          ultimoAgendamento.dataAgenda
        );

        const proximaSemana = segundaDaProximaSemana(dataUltimoAgendamento);

        if (proximaSemana > dataMinimaPermitida) {
          dataMinimaPermitida = proximaSemana;
        }
      }

      if (tipo === "ortodontia" && ultimoAgendamento?.dataAgenda) {
        const dataUltimoAgendamento = converterDataBR(
          ultimoAgendamento.dataAgenda
        );

        dataUltimoAgendamento.setHours(0, 0, 0, 0);

        if (mesmaCompetencia(dataUltimoAgendamento, hoje)) {
          const proximoMes = primeiroDiaDoProximoMes(hoje);

          if (proximoMes > dataMinimaPermitida) {
            dataMinimaPermitida = proximoMes;
          }
        }
      }
    }

    const ehOrtodontiaParnamirim =
      tipo === "ortodontia" &&
      Number(idClinica) === 16657;

    if (ehOrtodontiaParnamirim) {
      const dataInicioParnamirim = new Date(2026, 6, 20);

      if (dataInicioParnamirim > dataMinimaPermitida) {
        dataMinimaPermitida = dataInicioParnamirim;
      }
    }

    const usarInicioDoDia = ehOrtodontiaParnamirim;

    const url =
      `${process.env.API_BASE_URL}/agenda-disponivel-corpo-clinico` +
      `?idCooperativa=${idCooperativa}` +
      `&idClinica=${idClinica}` +
      `&dataInicio=${formatarDataHoraISO(
        dataMinimaPermitida,
        usarInicioDoDia
      )}` +
      `&idCorpoClinico=${idCorpoClinico}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await response.json();

    const horariosValidos = (json.data || [])
      .map((item: any) => item.horarioDisponivel)
      .filter(Boolean)
      .map(converterDataApi)
      .filter((item: any) => {
        item.date.setHours(0, 0, 0, 0);

        return item.date >= dataMinimaPermitida && item.date <= limite;
      });

    const horariosPorData: Record<string, string[]> = {};
    const datasPorDiaSemana: Record<string, string[]> = {};

    for (const item of horariosValidos) {
      if (!horariosPorData[item.dataBR]) {
        horariosPorData[item.dataBR] = [];
      }

      if (!horariosPorData[item.dataBR].includes(item.hora)) {
        horariosPorData[item.dataBR].push(item.hora);
      }

      const diaSemana = obterDiaSemana(item.date);

      if (!datasPorDiaSemana[diaSemana]) {
        datasPorDiaSemana[diaSemana] = [];
      }

      if (!datasPorDiaSemana[diaSemana].includes(item.dataBR)) {
        datasPorDiaSemana[diaSemana].push(item.dataBR);
      }
    }

    const datasDisponiveis = Object.entries(datasPorDiaSemana).map(
      ([diaSemana, datas]) => ({
        diaSemana,
        datas,
      })
    );

    return Response.json({
      success: true,
      tipo,
      dataMinimaPermitida: formatarDataBR(dataMinimaPermitida),
      dataLimitePermitida: formatarDataBR(limite),
      datasDisponiveis,
      horariosPorData,
      raw: json,
    });
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        message: "Erro ao consultar datas disponíveis",
        detalhe: error.message,
      },
      { status: 500 }
    );
  }
}

// Ajuste específico para ortodontia de Parnamirim.
// A API agenda-disponivel-corpo-clinico não retorna corretamente
// as datas futuras quando consultada com o comportamento padrão.
// Ajuste temporário para ortodontia de Parnamirim.
// Alguns prestadores retornam agenda incompleta pela API.
// Monitorar comportamento quando abrir agenda de agosto/2026.