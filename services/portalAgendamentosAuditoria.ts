
import "server-only";

import { createPortalServerClient } from "./supabasePortalServer";
import { supabasePortalAdmin } from "./supabasePortalAdmin";

export type OrigemAgendamento =
  | "cliente"
  | "agente"
  | "admin";

export type IdentidadeAgendamento = {
  origem: OrigemAgendamento;
  usuarioId: string | null;
};

type DadosAgendamento = {
  identidade: IdentidadeAgendamento;
  idAgendamentoDatasys: string | number | null;
  carteirinha: string;
  idClinica: string | number;
  idCorpoClinico: string | number;
  dataEvento: string;
  horaInicio: string;
};

type ResultadoAuditoria = {
  success: boolean;
  mensagem: string;
};

// Identifica automaticamente a origem pela sessao Supabase.
export async function identificarOrigem(
  _origemSolicitada?: "cliente" | "portal"
): Promise<IdentidadeAgendamento> {
  const supabase = await createPortalServerClient();

  // Verifica se existe uma sessao no navegador.
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error(
      "Não foi possível consultar a sessão do usuário."
    );
  }

  // Sem sessao autenticada: autoagendamento.
  if (!session) {
    return {
      origem: "cliente",
      usuarioId: null,
    };
  }

  // Confirma a identidade diretamente no Supabase Auth.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error(
      "Não foi possível validar a sessão do usuário."
    );
  }

  // Localiza o funcionario vinculado ao usuario autenticado.
  const { data: usuario, error: perfilErro } = await supabase
    .from("portal_usuarios")
    .select("id, perfil, ativo")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (perfilErro) {
    throw new Error(
      "Falha ao identificar o funcionário."
    );
  }

  if (!usuario) {
    throw new Error(
      "Funcionário não encontrado."
    );
  }

  if (!usuario.ativo) {
    throw new Error(
      "Funcionário com acesso desativado."
    );
  }

  if (
    usuario.perfil !== "agente" &&
    usuario.perfil !== "admin"
  ) {
    throw new Error(
      "Perfil de funcionário inválido."
    );
  }

  return {
    origem: usuario.perfil,
    usuarioId: usuario.id,
  };
}

// Registra somente agendamentos confirmados pela Datasys.
export async function registrarAgendamentoConfirmado(
  dados: DadosAgendamento
): Promise<ResultadoAuditoria> {
  try {
    const identificador = dados.idAgendamentoDatasys;

const idNumerico =
  typeof identificador === "number"
    ? identificador
    : typeof identificador === "string" &&
        identificador.trim() !== ""
      ? Number(identificador.trim())
      : NaN;

if (!Number.isSafeInteger(idNumerico) || idNumerico <= 0) {
  console.error(
    "Auditoria: identificador de agendamento inválido.",
    { tipo: typeof identificador }
  );

  return {
    success: false,
    mensagem:
      "A Datasys não retornou um identificador numérico válido.",
  };
}

const idAgendamento = String(idNumerico);

    const { origem, usuarioId } = dados.identidade;

    // Chave unica para evitar registros duplicados.
    const chaveOperacao =
      `datasys:agendamento:${idAgendamento}`;

    const { error } = await supabasePortalAdmin
      .from("portal_agendamentos_auditoria")
      .upsert(
        {
          chave_operacao: chaveOperacao,
          id_agendamento_datasys: idAgendamento,
          origem,
          usuario_id: usuarioId,
          carteirinha: String(dados.carteirinha),
          id_clinica: String(dados.idClinica),
          id_corpo_clinico: String(dados.idCorpoClinico),
          data_evento: String(dados.dataEvento),
          hora_inicio: String(dados.horaInicio),
          status: "confirmado",
          cancelado_em: null,
        },
        {
          onConflict: "chave_operacao",
          ignoreDuplicates: true,
        }
      );

    if (error) {
      console.error(
        "Falha ao registrar auditoria:",
        error.message
      );

      return {
        success: false,
        mensagem:
          "Não foi possível registrar a auditoria.",
      };
    }

    return {
      success: true,
      mensagem:
        "Auditoria registrada com sucesso.",
    };
  } catch (error) {
    console.error(
      "Erro no registro de auditoria:",
      error
    );

    return {
      success: false,
      mensagem:
        "Erro ao registrar auditoria do agendamento.",
    };
  }
}
