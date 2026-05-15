const BASE_URL = process.env.RD_TALLOS_BASE_URL!;
const TOKEN = process.env.RD_API_TOKEN!;

const TEMPLATE_ORIGINAL =
  "Olá, {{1}}! Seu agendamento na Dental Med foi confirmado. 📅 Data: {{2}} ⏰ Horário: {{3}} 📍 Unidade: {{4}} 🦷 Profissional: {{5}} Em caso de dúvidas, responda esta mensagem.";

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

async function buscarContatoPorTelefone(
  telefone: string
) {
  const telefoneLimpo =
    limparTelefone(telefone);

  const url =
    `${BASE_URL}/contacts/${telefoneLimpo}/exists`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      accept: "application/json",
    },
  });

  const data = await lerResposta(response);

  console.log("BUSCA CONTATO:", {
    url,
    status: response.status,
    data,
  });

  if (!response.ok) {
    return null;
  }

  return data.data || null;
}

async function criarContato(
  nome: string,
  telefone: string
) {
  const telefoneLimpo =
    limparTelefone(telefone);

  const url = `${BASE_URL}/contacts`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      full_name: nome,
      cel_phone: telefoneLimpo,
      integration: "integration-1",
    }),
  });

  const data = await lerResposta(response);

  console.log("CRIAR CONTATO:", {
    url,
    status: response.status,
    data,
  });

  if (!response.ok) {
    throw new Error(
      `Erro ao criar contato RD. Status ${response.status}. Retorno: ${JSON.stringify(
        data
      )}`
    );
  }

  return data.data || data;
}

async function enviarMensagem(
  contactId: string,
  mensagem: string
) {
  const url =
    `${BASE_URL}/messages/${contactId}/send-template-filled`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      accept: "application/json",
      "content-type":
        "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      sent_by: "bot",
      integration: "integration-1",
      template_message:
        TEMPLATE_ORIGINAL,
      message: mensagem,
    }),
  });

  const data = await lerResposta(response);

  console.log("ENVIAR TEMPLATE:", {
    url,
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
  try {
    const body = await request.json();

    const nome = body.nome;
    const telefone = limparTelefone(
      body.telefone
    );

    const dataAgendamento =
      body.data;

    const horario = body.horario;

    const unidade = body.unidade;

    const dentista = body.dentista;

    let contato =
      await buscarContatoPorTelefone(
        telefone
      );

    if (!contato) {
      contato = await criarContato(
        nome,
        telefone
      );
    }

    const contatoId =
      contato?._id ||
      contato?.id ||
      contato?.contact_id ||
      contato?.contact?._id ||
      contato?.contact?.id;

    if (!contatoId) {
      return Response.json(
        {
          success: false,
          message:
            "Não foi possível obter o ID do contato.",
          contato,
        },
        { status: 400 }
      );
    }

    const mensagem = [
      `Olá, ${nome}!`,
      "",
      "Seu agendamento na Dental Med foi confirmado.",
      "",
      `📅 Data: ${dataAgendamento}`,
      `⏰ Horário: ${horario}`,
      `📍 Unidade: ${unidade}`,
      `🦷 Profissional: ${dentista}`,
      "",
      "Em caso de dúvidas, responda esta mensagem.",
    ].join("\n");

    const envio =
      await enviarMensagem(
        contatoId,
        mensagem
      );

    return Response.json({
      success: true,
      contatoId,
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