
import { createPortalServerClient } from "../../../../services/supabasePortalServer";

export async function GET() {
  try {
    const supabase = await createPortalServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json(
        {
          success: false,
          message: "Sessão de funcionário não encontrada.",
        },
        { status: 401 }
      );
    }

    const { data: usuario, error: perfilErro } = await supabase
      .from("portal_usuarios")
      .select("id, perfil, ativo")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (
      perfilErro ||
      !usuario ||
      !usuario.ativo ||
      !["agente", "admin"].includes(usuario.perfil)
    ) {
      return Response.json(
        {
          success: false,
          message: "Funcionário não autorizado.",
        },
        { status: 403 }
      );
    }

    return Response.json(
      {
        success: true,
        funcionario: {
          id: usuario.id,
          perfil: usuario.perfil,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Erro ao consultar contexto de agendamento:", error);

    return Response.json(
      {
        success: false,
        message: "Não foi possível identificar o funcionário.",
      },
      { status: 500 }
    );
  }
}
