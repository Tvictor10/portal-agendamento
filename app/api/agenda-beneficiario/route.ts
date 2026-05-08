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
  const cpf = searchParams.get("cpf");

  if (!cpf) {
    return Response.json(
      { success: false, message: "CPF não informado" },
      { status: 400 }
    );
  }

  const token = await obterToken();
  const idCooperativa = 1055;

  const url = `${process.env.API_BASE_URL}/agenda-beneficiario-cpf?idCooperativa=${idCooperativa}&cpf=${cpf}&dataInicio=01/01/2026&dataFim=12/31/2026`;

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