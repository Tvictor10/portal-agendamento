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

const planosClinicos = [
  "BASICO I",
  "BÁSICO I (2010)",
  "BÁSICO I (2011)",
  "ESPECIAL",
  "ESPECIAL (2010)",
  "ESPECIAL (2011)",
  "ESPECIAL (AUMED)",
  "ESPECIAL EXCLUSIVO",
  "ESPECIAL FLEX 01",
  "ESPECIAL FLEX 02",
  "ESPECIAL FLEX 03",
  "ESPECIAL I (2010)",
  "ESPECIAL I (2011)",
  "ESPECIAL LIGHT",
  "ESPECIAL PLUS",
  "ESPECIAL RESERVADO",
  "ESPECIAL VOCÊ",
  "MODELAR",
  "MODELAR EXCLUSIVO",
  "MODELAR FLEX 02",
];

const planosOrtodonticos = [
  "ORTODÔNTICO",
  "ORTODÔNTICO (2010)",
  "ORTODÔNTICO (CAS)",
  "ORTODÔNTICO ESTÉTICO",
  "ORTODÔNTICO ESTÉTICO PLUS",
  "ORTODÔNTICO ESTÉTICO PLUS (C)",
  "ORTODÔNTICO FLEX 01",
  "ORTODÔNTICO FLEX 02",
  "ORTODÔNTICO FLEX 03",
  "ORTODÔNTICO PLUS",
  "ORTODÔNTICO PLUS (E)",
];

function limparNomePlano(plano: string) {
  if (!plano) return "";

  const partes = plano.split("-");

  if (partes.length > 1) {
    return partes[1].trim().toUpperCase();
  }

  return plano.trim().toUpperCase();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cpf = searchParams.get("cpf");

    if (!cpf) {
      return Response.json(
        {
          success: false,
          message: "CPF não informado",
        },
        { status: 400 }
      );
    }

    const token = await obterToken();
    const idCooperativa = 1055;

    const url =
      `${process.env.API_BASE_URL}/dados-beneficiario` +
      `?idCooperativa=${idCooperativa}` +
      `&cpf=${cpf}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await response.json();
    const beneficiarios = json.data || [];

    const carteirinhasValidas = beneficiarios
      .filter((item: any) => {
        const planoLimpo = limparNomePlano(item.plano);

        const planoValido =
          planosClinicos.includes(planoLimpo) ||
          planosOrtodonticos.includes(planoLimpo);

        const beneficiarioAtivo =
          String(item.statusBeneficiario).toUpperCase() === "ATIVO";

        return planoValido && beneficiarioAtivo;
      })
      .map((item: any) => {
        const planoLimpo = limparNomePlano(item.plano);
        const tipo = planosOrtodonticos.includes(planoLimpo)
          ? "ortodontia"
          : "clinico";

        return {
          idPessoa: item.idPessoa,
          idPessoaContrato: item.idPessoaContrato,
          beneficiario: item.beneficiario,
          cpf: item.cpf,
          codCarteirinha: item.codCarteirinha,
          numero: item.codCarteirinha,
          plano: item.plano,
          planoLimpo,
          tipo,
          descricao:
            tipo === "ortodontia"
              ? `Carteirinha Ortodôntica - ${planoLimpo}`
              : `Carteirinha Clínica - ${planoLimpo}`,
          statusBeneficiario: item.statusBeneficiario,
          celular: item.celular,
          email: item.email,
        };
      });

    return Response.json({
      success: true,
      quantidade: carteirinhasValidas.length,
      beneficiario: carteirinhasValidas[0]?.beneficiario || null,
      carteirinhas: carteirinhasValidas,
      raw: json,
    });
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        message: "Erro ao consultar beneficiário",
        detalhe: error.message,
      },
      { status: 500 }
    );
  }
}