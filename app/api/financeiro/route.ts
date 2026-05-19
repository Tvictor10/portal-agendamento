function converterDataBR(data: string) {
  const [dia, mes, ano] = data.split("/");
  return new Date(Number(ano), Number(mes) - 1, Number(dia));
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const cpf = String(searchParams.get("cpf") || "").replace(/\D/g, "");

    const carteirinha = String(searchParams.get("carteirinha") || "").replace(/\D/g, "");

    if (!cpf) {
      return Response.json(
        { success: false, message: "CPF não informado" },
        { status: 400 }
      );
    }

    const usuario = process.env.FINANCEIRO_USERNAME;
    const senha = process.env.FINANCEIRO_PASSWORD;

    const auth = Buffer.from(`${usuario}:${senha}`).toString("base64");

    const url =
      `${process.env.FINANCEIRO_BASE_URL}/integracao/api/Geral/ObtemPendFinanceiro` +
      `?cpf=${cpf}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        accept: "application/json",
      },
    });

    const text = await response.text();

    let json: any = {};

    try {
      json = JSON.parse(text);
    } catch {
      return Response.json({
        success: false,
        status: response.status,
        url,
        raw: text,
        message: "A API financeira não retornou JSON válido",
      });
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const cobrancas = json.data || [];

    const cobrancasVencidas = cobrancas.filter((item: any) => {
      if (!item.dt_vencimento_recb) return false;

      const vencimento = converterDataBR(item.dt_vencimento_recb);
      vencimento.setHours(0, 0, 0, 0);

      const limiteBloqueio = new Date(vencimento);
      limiteBloqueio.setDate(limiteBloqueio.getDate() + 30);

      const vencidaMaisDe30Dias = limiteBloqueio < hoje;
      const semPagamento = !item.dt_recebimento_recb;
      const semCancelamento = !item.dt_cancelamento_recb;

      
 return (
  vencidaMaisDe30Dias &&
  semPagamento &&
  semCancelamento
);

    });

    return Response.json({
      success: true,
      inadimplente: cobrancasVencidas.length > 0,
      quantidadeVencidas: cobrancasVencidas.length,
      cobrancasVencidas,
      raw: json,
    });
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        message: "Erro ao consultar financeiro",
        detalhe: error.message,
      },
      { status: 500 }
    );
  }
}