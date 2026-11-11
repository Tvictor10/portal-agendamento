
import { consultarProdutividade } from "../../../../services/portalProdutividade";

export async function GET() {
  try {
    const resultado = await consultarProdutividade();

    return Response.json(resultado, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(
      "Erro ao consultar produtividade:",
      error
    );

    return Response.json(
      {
        success: false,
        message: "Não foi possível consultar a produtividade.",
      },
      {
        status: 403,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
