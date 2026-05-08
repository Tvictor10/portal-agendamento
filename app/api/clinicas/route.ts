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
  const token = await obterToken();

  const idCooperativa = 1055;

const url = `${process.env.API_BASE_URL}/agenda-ddl-clinica?idCooperativa=${idCooperativa}`;

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