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

export async function GET() {
  try {
    const token = await obterToken();

    const idCooperativa = 1055;

    const url =
      `${process.env.API_BASE_URL}/agenda-ddl-clinica` +
      `?idCooperativa=${idCooperativa}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await response.json();

    const clinicas =
      (json.data || [])
        .filter((item: any) => {
          const nome = String(item.dataTextField).toUpperCase();

          return (
            nome.includes("CENTRO") ||
            nome.includes("PARNAMIRIM") ||
            nome.includes("GOIANINHA") ||
            nome.includes("SANTA CRUZ")
          );
        })
        .map((item: any) => ({
          id: Number(item.dataValueField),
          nome: item.dataTextField,
        })) || [];

    return Response.json({
      success: true,
      quantidade: clinicas.length,
      clinicas,
      raw: json,
    });
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        message: "Erro ao consultar clínicas",
        detalhe: error.message,
      },
      { status: 500 }
    );
  }
}