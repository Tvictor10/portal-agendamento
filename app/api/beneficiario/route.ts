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

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Login falhou: ${response.status} - ${text}`);
  }

  try {
    const data = JSON.parse(text);
    return data.token || data.access_token || data.data || text;
  } catch {
    return text;
  }
}

export async function GET(request: Request) {
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

  try {
    const token = await obterToken();

    const idCooperativa = 16595;

const url = `${process.env.API_BASE_URL}/dados-beneficiario?idCooperativa=${idCooperativa}&cpf=${cpf}`;

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