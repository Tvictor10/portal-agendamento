
import { NextRequest, NextResponse } from "next/server";
import { createPortalServerClient } from "../../../../services/supabasePortalServer";
import { supabasePortalAdmin } from "../../../../services/supabasePortalAdmin";

export const runtime = "nodejs";

const LOGIN_REGEX = /^[a-z0-9][a-z0-9._-]{2,39}$/;

function respostaErro(mensagem: string, status: number) {
  return NextResponse.json(
    { success: false, mensagem },
    { status }
  );
}

async function verificarAdministrador() {
  const supabase = await createPortalServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return false;
  }

  const { data: usuario, error: perfilErro } = await supabase
    .from("portal_usuarios")
    .select("perfil, ativo")
    .eq("auth_user_id", user.id)
    .single();

  return (
    !perfilErro &&
    usuario?.ativo === true &&
    usuario?.perfil === "admin"
  );
}

export async function GET() {
  try {
    if (!(await verificarAdministrador())) {
      return respostaErro("Acesso não autorizado.", 403);
    }

    const { data, error } = await supabasePortalAdmin
      .from("portal_usuarios")
      .select("id, usuario, nome, perfil, ativo, criado_em")
      .order("nome", { ascending: true });

    if (error) {
      console.error("Erro ao listar agentes:", error.message);
      return respostaErro("Não foi possível consultar os funcionários.", 500);
    }

    return NextResponse.json({
      success: true,
      agentes: data ?? [],
    });
  } catch (error) {
    console.error("Erro ao consultar agentes:", error);
    return respostaErro("Erro ao consultar funcionários.", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await verificarAdministrador())) {
      return respostaErro("Acesso não autorizado.", 403);
    }

    const body = await request.json();

    const nome =
      typeof body.nome === "string" ? body.nome.trim() : "";

    const login =
      typeof body.login === "string"
        ? body.login.trim().toLowerCase()
        : "";

    const senha =
      typeof body.senha === "string" ? body.senha : "";

    if (!nome || !login || !senha) {
      return respostaErro("Preencha nome, login e senha.", 400);
    }

    if (!LOGIN_REGEX.test(login)) {
      return respostaErro(
        "O login deve ter entre 3 e 40 caracteres e utilizar letras minúsculas, números, ponto, hífen ou sublinhado.",
        400
      );
    }

    if (senha.length < 8) {
      return respostaErro(
        "A senha inicial deve ter pelo menos 8 caracteres.",
        400
      );
    }

    const { data: existente, error: consultaErro } =
      await supabasePortalAdmin
        .from("portal_usuarios")
        .select("id")
        .eq("usuario", login)
        .maybeSingle();

    if (consultaErro) {
      return respostaErro("Erro ao verificar o login.", 500);
    }

    if (existente) {
      return respostaErro("Este login já está cadastrado.", 409);
    }

    // Identificador técnico usado apenas pelo Supabase Auth.
    // Não representa uma caixa de e-mail real.
    const emailInterno = `${login}@agentes.dentalmed.invalid`;

    const { data: authData, error: authErro } =
      await supabasePortalAdmin.auth.admin.createUser({
        email: emailInterno,
        password: senha,
        email_confirm: true,
      });

    if (authErro || !authData.user) {
      console.error("Erro ao criar conta Auth:", authErro?.message);

      return respostaErro(
        "Não foi possível criar a conta do funcionário.",
        500
      );
    }

    const authUserId = authData.user.id;

    const { data: agente, error: cadastroErro } =
      await supabasePortalAdmin
        .from("portal_usuarios")
        .insert({
          auth_user_id: authUserId,
          usuario: login,
          nome,
          perfil: "agente",
          ativo: true,
        })
        .select("id, usuario, nome, perfil, ativo, criado_em")
        .single();

    if (cadastroErro || !agente) {
      console.error(
        "Erro ao cadastrar perfil:",
        cadastroErro?.message
      );

      // Desfaz a conta Auth se não foi possível salvar o perfil.
      const { error: exclusaoErro } =
        await supabasePortalAdmin.auth.admin.deleteUser(authUserId);

      if (exclusaoErro) {
        console.error(
          "Falha ao desfazer conta Auth:",
          exclusaoErro.message
        );
      }

      return respostaErro(
        "Não foi possível concluir o cadastro. Verifique se o login já existe.",
        500
      );
    }

    return NextResponse.json(
      {
        success: true,
        mensagem: "Agente cadastrado com sucesso.",
        agente,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao cadastrar agente:", error);
    return respostaErro("Erro ao cadastrar funcionário.", 500);
  }
}
