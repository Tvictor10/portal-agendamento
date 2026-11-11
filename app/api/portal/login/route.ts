
import { NextRequest, NextResponse } from "next/server";
import { createPortalServerClient } from "../../../../services/supabasePortalServer";
import { supabasePortalAdmin } from "../../../../services/supabasePortalAdmin";

export async function POST(request: NextRequest) {
  try {
    const { login, senha } = await request.json();

    if (
      typeof login !== "string" ||
      typeof senha !== "string" ||
      !login.trim() ||
      !senha
    ) {
      return NextResponse.json(
        {
          success: false,
          mensagem: "Informe login e senha.",
        },
        { status: 400 }
      );
    }

    const loginNormalizado = login.trim().toLowerCase();

    // Localiza o funcionário pelo login.
    const { data: funcionario, error: consultaErro } =
      await supabasePortalAdmin
        .from("portal_usuarios")
        .select("id, auth_user_id, usuario, nome, perfil, ativo")
        .eq("usuario", loginNormalizado)
        .maybeSingle();

    if (consultaErro) {
      console.error("Erro ao consultar funcionário:", consultaErro.message);

      return NextResponse.json(
        {
          success: false,
          mensagem: "Erro ao realizar login.",
        },
        { status: 500 }
      );
    }

    // Não revela se o login existe ou está desativado.
    if (!funcionario || !funcionario.ativo) {
      return NextResponse.json(
        {
          success: false,
          mensagem: "Login ou senha inválidos.",
        },
        { status: 401 }
      );
    }

    // Obtém o e-mail interno associado à conta do funcionário.
    const { data: conta, error: contaErro } =
      await supabasePortalAdmin.auth.admin.getUserById(
        funcionario.auth_user_id
      );

    if (contaErro || !conta.user?.email) {
      return NextResponse.json(
        {
          success: false,
          mensagem: "Login ou senha inválidos.",
        },
        { status: 401 }
      );
    }

    // Autentica a senha e estabelece a sessão do funcionário.
    const supabase = await createPortalServerClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: conta.user.email,
      password: senha,
    });

    if (error || !data.user) {
      return NextResponse.json(
        {
          success: false,
          mensagem: "Login ou senha inválidos.",
        },
        { status: 401 }
      );
    }

    // Confirma que a conta autenticada corresponde ao login informado.
    if (data.user.id !== funcionario.auth_user_id) {
      await supabase.auth.signOut();

      return NextResponse.json(
        {
          success: false,
          mensagem: "Login ou senha inválidos.",
        },
        { status: 401 }
      );
    }

    const destino =
      funcionario.perfil === "admin"
        ? "/portal/admin"
        : "/portal/agendamento";

    return NextResponse.json({
      success: true,
      destino,
      usuario: {
        id: funcionario.id,
        usuario: funcionario.usuario,
        nome: funcionario.nome,
        perfil: funcionario.perfil,
      },
    });
  } catch (error) {
    console.error("Erro no login do portal:", error);

    return NextResponse.json(
      {
        success: false,
        mensagem: "Erro ao realizar login.",
      },
      { status: 500 }
    );
  }
}
