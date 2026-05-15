import { DENTISTAS_PERMITIDOS } from "../../../config/dentistasPermitidos";

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

function identificarNucleoPorClinica(idClinica: string) {
  const mapa: Record<string, keyof typeof DENTISTAS_PERMITIDOS> = {
    "16595": "CENTRO",
    "16656": "GOIANINHA",
    "16659": "SANTA CRUZ",
    "16657": "PARNAMIRIM",
  };

  return mapa[idClinica];
}

function normalizarProcedimento(procedimento: string | null) {
  if (!procedimento) return "";

  if (
    procedimento === "LIMPEZA | RESTAURAÇÃO" ||
    procedimento === "CONSULTA INICIAL"
  ) {
    return "LIMPEZA | RESTAURAÇÃO E CONSULTA INICIAL";
  }

  return procedimento;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const idClinica = searchParams.get("idClinica");
    const tipo = searchParams.get("tipo");
    const procedimento = searchParams.get("procedimento");

    if (!idClinica) {
      return Response.json(
        { success: false, message: "idClinica não informado" },
        { status: 400 }
      );
    }

    const token = await obterToken();
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

    let dentistas = (json.data || []).map((item: any) => ({
      id: Number(item.dataValueField),
      nome: String(item.dataTextField).trim(),
      nomeNormalizado: normalizarTexto(item.dataTextField),
      especialidade: item.isOrtodontista === "1" ? "Ortodontia" : "Clínico",
      isOrtodontista: item.isOrtodontista === "1",
    }));

    if (tipo === "clinico") {
      dentistas = dentistas.filter((dentista: any) => !dentista.isOrtodontista);
    }

    if (tipo === "ortodontia") {
      dentistas = dentistas.filter((dentista: any) => dentista.isOrtodontista);
    }

    if (tipo === "clinico" && procedimento) {
      const nucleo = identificarNucleoPorClinica(idClinica);
      const procedimentoNormalizado = normalizarProcedimento(procedimento);

      const listaPermitida =
        nucleo &&
        DENTISTAS_PERMITIDOS[nucleo]?.[
          procedimentoNormalizado as keyof (typeof DENTISTAS_PERMITIDOS)[typeof nucleo]
        ];

      const nomesPermitidos = (listaPermitida || []).map((nome) =>
        normalizarTexto(nome)
      );

      dentistas = dentistas.filter((dentista: any) =>
        nomesPermitidos.includes(dentista.nomeNormalizado)
      );
    }

    return Response.json({
      success: true,
      quantidade: dentistas.length,
      dentistas,
      raw: json,
    });
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        message: "Erro ao consultar dentistas",
        detalhe: error.message,
      },
      { status: 500 }
    );
  }
}