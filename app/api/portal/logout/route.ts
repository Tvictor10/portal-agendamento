
import { NextResponse } from "next/server";
import { createPortalServerClient } from "../../../../services/supabasePortalServer";

export async function POST() {
  try {
    const supabase = await createPortalServerClient();

    const { error } = await supabase.auth.signOut({
      scope: "local",
    });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          mensagem: "Não foi possível encerrar a sessão.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Erro ao encerrar sessão do portal:", error);

    return NextResponse.json(
      {
        success: false,
        mensagem: "Erro ao sair do portal.",
      },
      { status: 500 }
    );
  }
}
