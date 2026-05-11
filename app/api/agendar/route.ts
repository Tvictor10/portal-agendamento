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

export async function POST(request: Request) {
  const body = await request.json();

  const token = await obterToken();

  const payload = {
    idCooperativa: 1055,
    idClinica: body.idClinica,
    idCorpoClinico: body.idCorpoClinico,
    dataEvento: body.dataEvento,
    horaInicio: body.horaInicio,
    codCarteirinha: body.codCarteirinha,
  };

  const url = `${process.env.API_BASE_URL}/agenda-evento`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();

  return Response.json({
    success: response.ok,
    status: response.status,
    url,
    payload,
    raw: text,
  });
}