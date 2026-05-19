const TOKEN = process.env.RD_API_TOKEN!;

async function lerResposta(response: Response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function limparTelefone(telefone: string) {
  return String(telefone || "").replace(/\D/g, "");
}

async function enviarMensagem(
  telefone: string,
  nome: string,
  dataAgendamento: string,
  horario: string,
  unidade: string,
  dentista: string
) {
  const telefoneLimpo =
    limparTelefone(telefone);

  const url =
    "https://api.tallos.com.br/v3/messages/template/send";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      country_code: "55",

      recipient_number:
        telefoneLimpo,

      sent_by: "bot",

      template_message_id:
        process.env
          .RD_TEMPLATE_CONFIRMACAO_ID,

      variables: [
        nome,
        dataAgendamento,
        horario,
        unidade,
        dentista,
      ],
    }),
  });

  const data = await lerResposta(response);

  console.log("ENVIAR TEMPLATE:", {
    status: response.status,
    data,
  });

  if (!response.ok) {
    throw new Error(
      `Erro ao enviar template RD. Status ${response.status}. Retorno: ${JSON.stringify(
        data
      )}`
    );
  }

  return data;
}

export async function POST(
  request: Request
) {

  return Response.json({
    success: true,
    disabled: true,
  });

  try {
    const body = await request.json();

    const nome = body.nome;

    const telefone =
      limparTelefone(
        body.telefone
      );

    const dataAgendamento =
      body.data;

    const horario =
      body.horario;

    const unidade =
      body.unidade;

    const dentista =
      body.dentista;

    const envio =
      await enviarMensagem(
        telefone,
        nome,
        dataAgendamento,
        horario,
        unidade,
        dentista
      );

    return Response.json({
      success: true,
      envio,
    });
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}
