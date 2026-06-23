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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idClinica = searchParams.get("idClinica");

  if (!idClinica) {
    return Response.json(
      { success: false, message: "idClinica não informada" },
      { status: 400 }
    );
  }

  try {
    const token = await obterToken();
    const idCooperativa = 1055;

    const urlGeral =
      `${process.env.API_BASE_URL}/agenda-ddl-corpo-clinico` +
      `?idCooperativa=${idCooperativa}` +
      `&idClinica=${idClinica}`;

    const urlOrto =
      `${process.env.API_BASE_URL}/agenda-ddl-corpo-clinico-ortodontia` +
      `?idCooperativa=${idCooperativa}` +
      `&idClinica=${idClinica}`;

    const [responseGeral, responseOrto] = await Promise.all([
      fetch(urlGeral, {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }),
      fetch(urlOrto, {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }),
    ]);

    const geral = await responseGeral.json();
    const orto = await responseOrto.json();

    return Response.json({
      success: true,
      idClinica,
      urlGeral,
      urlOrto,
      geral,
      orto,
    });
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        message: "Erro ao testar ortodontistas",
        detalhe: error.message,
      },
      { status: 500 }
    );
  }
}