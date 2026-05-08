export async function POST() {
  try {
    const baseUrl = process.env.API_BASE_URL;
    const username = process.env.API_USERNAME;
    const password = process.env.API_PASSWORD;

    if (!baseUrl || !username || !password) {
      return Response.json(
        {
          success: false,
          message: "Variáveis de ambiente não configuradas.",
        },
        { status: 500 }
      );
    }

    const response = await fetch(`${baseUrl}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "*/*",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    const text = await response.text();

    if (!response.ok) {
      return Response.json(
        {
          success: false,
          status: response.status,
          message: "Erro ao autenticar na API externa.",
          detalhe: text,
        },
        { status: response.status }
      );
    }

    try {
      const data = JSON.parse(text);
      return Response.json(data);
    } catch {
      return Response.json({
        success: true,
        data: text,
      });
    }
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        message: "Erro inesperado na rota local.",
        detalhe: error?.message,
      },
      { status: 500 }
    );
  }
}