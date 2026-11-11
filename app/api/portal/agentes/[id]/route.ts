
import { NextRequest, NextResponse } from "next/server";
import { createPortalServerClient } from "../../../../../services/supabasePortalServer";
import { supabasePortalAdmin } from "../../../../../services/supabasePortalAdmin";

export const runtime = "nodejs";

const LOGIN_REGEX = /^[a-z0-9][a-z0-9._-]{2,39}$/;

type Contexto = {
  params: Promise<{ id: string }>;
};

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

  if (error || !user) return false;

  const { data: perfil, error: perfilErro } = await supabase
    .from("portal_usuarios")
    .select("perfil, ativo")
    .eq("auth_user_id", user.id)
    .single();

  return (
    !perfilErro &&
    perfil?.ativo === true &&
    perfil?.perfil === "admin"
  );
}

export async function PATCH(
  request: NextRequest,
  contexto: Contexto
) {
  try {
    if (!(await verificarAdministrador())) {
      return respostaErro("Acesso não autorizado.", 403);
    }

    const { id } = await contexto.params;

    const { data: agente, error: buscaErro } =
      await supabasePortalAdmin
        .from("portal_usuarios")
        .select("id, auth_user_id, usuario, nome, perfil, ativo")
        .eq("id", id)
        .single();

    if (buscaErro || !agente) {
      return respostaErro("Funcionário não encontrado.", 404);
    }

    const body = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return respostaErro("Dados inválidos.", 400);
    }

    const atualizacoes: {
      nome?: string;
      usuario?: string;
      ativo?: boolean;
      atualizado_em?: string;
    } = {};

    if (body.nome !== undefined) {
      if (typeof body.nome !== "string" || !body.nome.trim()) {
        return respostaErro("Informe um nome válido.", 400);
      }

      atualizacoes.nome = body.nome.trim();
    }

    let novoEmailInterno: string | undefined;

    if (body.login !== undefined) {
      if (typeof body.login !== "string") {
        return respostaErro("Login inválido.", 400);
      }

      const novoLogin = body.login.trim().toLowerCase();

      if (!LOGIN_REGEX.test(novoLogin)) {
        return respostaErro(
          "O login deve ter entre 3 e 40 caracteres e utilizar letras minúsculas, números, ponto, hífen ou sublinhado.",
          400
        );
      }

      if (novoLogin !== agente.usuario) {
        const { data: existente, error: consultaErro } =
          await supabasePortalAdmin
            .from("portal_usuarios")
            .select("id")
            .eq("usuario", novoLogin)
            .maybeSingle();

        if (consultaErro) {
          return respostaErro("Erro ao verificar o login.", 500);
        }

        if (existente) {
          return respostaErro("Este login já está cadastrado.", 409);
        }

        atualizacoes.usuario = novoLogin;
        novoEmailInterno =
          `${novoLogin}@agentes.dentalmed.invalid`;
      }
    }

    if (body.ativo !== undefined) {
      if (typeof body.ativo !== "boolean") {
        return respostaErro("Situação inválida.", 400);
      }

      if (agente.perfil === "admin" && body.ativo === false) {
        return respostaErro(
          "Não é permitido desativar o administrador por esta tela.",
          403
        );
      }

      atualizacoes.ativo = body.ativo;
    }

    if (body.senha !== undefined) {
      if (
        typeof body.senha !== "string" ||
        body.senha.length < 8
      ) {
        return respostaErro(
          "A nova senha deve ter pelo menos 8 caracteres.",
          400
        );
      }
    }

    const dadosAuth: {
      email?: string;
      password?: string;
    } = {};

    if (novoEmailInterno) {
      dadosAuth.email = novoEmailInterno;
    }

    if (body.senha !== undefined) {
      dadosAuth.password = body.senha;
    }

    // Atualiza primeiro o perfil para evitar que o login
    // passe a apontar para uma conta ainda não atualizada.
    if (Object.keys(atualizacoes).length > 0) {
      atualizacoes.atualizado_em = new Date().toISOString();

      const { error: atualizacaoErro } =
        await supabasePortalAdmin
          .from("portal_usuarios")
          .update(atualizacoes)
          .eq("id", agente.id);

      if (atualizacaoErro) {
        console.error(
          "Erro ao atualizar funcionário:",
          atualizacaoErro.message
        );

        return respostaErro(
          "Não foi possível atualizar o funcionário.",
          500
        );
      }
    }

    if (Object.keys(dadosAuth).length > 0) {
      const { error: authErro } =
        await supabasePortalAdmin.auth.admin.updateUserById(
          agente.auth_user_id,
          dadosAuth
        );

      if (authErro) {
        console.error(
          "Erro ao atualizar autenticação:",
          authErro.message
        );

        // Restaura o perfil anterior se a atualização
        // da autenticação não foi concluída.
        if (Object.keys(atualizacoes).length > 0) {
          const { error: restauracaoErro } =
            await supabasePortalAdmin
              .from("portal_usuarios")
              .update({
                nome: agente.nome,
                usuario: agente.usuario,
                ativo: agente.ativo,
              })
              .eq("id", agente.id);

          if (restauracaoErro) {
            console.error(
              "Falha ao restaurar perfil:",
              restauracaoErro.message
            );
          }
        }

        return respostaErro(
          "Não foi possível atualizar o acesso do funcionário.",
          500
        );
      }
    }

    return NextResponse.json({
      success: true,
      mensagem: "Funcionário atualizado com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao gerenciar funcionário:", error);

    return respostaErro(
      "Erro ao atualizar funcionário.",
      500
    );
  }
}
