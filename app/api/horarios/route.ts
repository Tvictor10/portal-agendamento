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
  const idCorpoClinico = searchParams.get("idCorpoClinico");
  const dataInicio = searchParams.get("dataInicio");

  if (!idClinica || !idCorpoClinico || !dataInicio) {
    return Response.json(
      {
        success: false,
        message:
          "idClinica, idCorpoClinico e dataInicio são obrigatórios",
      },
      { status: 400 }
    );
  }

  const token = await obterToken();

  const idCooperativa = 1055;

  const url =
    `${process.env.API_BASE_URL}/agenda-disponivel-corpo-clinico` +
    `?idCooperativa=${idCooperativa}` +
    `&idClinica=${idClinica}` +
    `&dataInicio=${dataInicio}` +
    `&idCorpoClinico=${idCorpoClinico}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await response.text();

  return Response.json({
    success: response.ok,
    status: response.status,
    url,
    raw: text,
  });
}