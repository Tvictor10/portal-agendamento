
import "server-only";

import { createPortalServerClient } from "./supabasePortalServer";
import { supabasePortalAdmin } from "./supabasePortalAdmin";

export type RegistroProdutividade = {
  id_agendamento_datasys: string;
  criado_em: string;
  confirmado_em: string | null;
  cancelado_em: string | null;
  origem: "cliente" | "agente" | "admin";
  usuario_id: string | null;
  data_evento: string;
  hora_inicio: string;
  status: string;
};

export type FuncionarioProdutividade = {
  id: string;
  nome: string;
  perfil: "agente" | "admin";
  ativo: boolean;
};

export type ResultadoProdutividade = {
  perfil: "agente" | "admin";
  usuarioId: string;
  registros: RegistroProdutividade[];
  cancelamentos: RegistroProdutividade[];
  funcionarios: FuncionarioProdutividade[];
};

export type FiltroProdutividade = {
  inicio?: string;
  fim?: string;
};

type CampoData = "criado_em" | "cancelado_em";

async function consultarRegistrosPaginados(
  campoData: CampoData,
  filtro: FiltroProdutividade,
  usuarioId: string | null
): Promise<RegistroProdutividade[]> {
  const TAMANHO_LOTE = 1000;
  const registros: RegistroProdutividade[] = [];
  let inicioLote = 0;

  while (true) {
    let consulta = supabasePortalAdmin
      .from("portal_agendamentos_auditoria")
      .select(
        "id_agendamento_datasys, origem, usuario_id, data_evento, hora_inicio, status, criado_em, confirmado_em, cancelado_em"
      )
      .order(campoData, { ascending: false })
      .order("id_agendamento_datasys", {
        ascending: false,
      })
      .range(
        inicioLote,
        inicioLote + TAMANHO_LOTE - 1
      );

    // Agentes consultam somente os próprios registros.
    if (usuarioId !== null) {
      consulta = consulta.eq("usuario_id", usuarioId);
    }

    if (campoData === "cancelado_em") {
      consulta = consulta
        .eq("status", "cancelado")
        .not("cancelado_em", "is", null);
    }

    if (filtro.inicio) {
      consulta = consulta.gte(
        campoData,
        filtro.inicio
      );
    }

    if (filtro.fim) {
      consulta = consulta.lt(
        campoData,
        filtro.fim
      );
    }

    const { data: lote, error } = await consulta;

    if (error) {
      console.error(
        "Falha ao consultar auditoria:",
        error.message
      );

      throw new Error(
        "Não foi possível consultar a produtividade."
      );
    }

    const registrosLote =
      (lote ?? []) as RegistroProdutividade[];

    registros.push(...registrosLote);

    if (registrosLote.length < TAMANHO_LOTE) {
      break;
    }

    inicioLote += TAMANHO_LOTE;
  }

  return registros;
}

export async function consultarProdutividade(
  filtro: FiltroProdutividade = {}
): Promise<ResultadoProdutividade> {
  const supabase = await createPortalServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Sessão de funcionário inválida.");
  }

  const { data: funcionario, error: perfilErro } =
    await supabase
      .from("portal_usuarios")
      .select("id, perfil, ativo")
      .eq("auth_user_id", user.id)
      .maybeSingle();

  if (
    perfilErro ||
    !funcionario ||
    !funcionario.ativo ||
    (funcionario.perfil !== "agente" &&
      funcionario.perfil !== "admin")
  ) {
    throw new Error("Funcionário não autorizado.");
  }

  // Administradores consultam todos os registros.
  // Agentes consultam somente os próprios registros.
  const usuarioFiltro =
    funcionario.perfil === "agente"
      ? funcionario.id
      : null;

  // Produção: período de criação do agendamento.
  // Inclui registros cancelados posteriormente.
  const registros = await consultarRegistrosPaginados(
    "criado_em",
    filtro,
    usuarioFiltro
  );

  // Cancelamentos: período efetivo do cancelamento.
  const cancelamentos = await consultarRegistrosPaginados(
    "cancelado_em",
    filtro,
    usuarioFiltro
  );

  let consultaFuncionarios = supabasePortalAdmin
    .from("portal_usuarios")
    .select("id, nome, perfil, ativo")
    .in("perfil", ["agente", "admin"])
    .order("nome", { ascending: true });

  if (funcionario.perfil === "agente") {
    consultaFuncionarios = consultaFuncionarios.eq(
      "id",
      funcionario.id
    );
  }

  const {
    data: funcionarios,
    error: funcionariosErro,
  } = await consultaFuncionarios;

  if (funcionariosErro) {
    console.error(
      "Falha ao consultar funcionários:",
      funcionariosErro.message
    );

    throw new Error(
      "Não foi possível consultar os funcionários."
    );
  }

  return {
    perfil: funcionario.perfil,
    usuarioId: funcionario.id,
    registros,
    cancelamentos,
    funcionarios:
      (funcionarios ?? []) as FuncionarioProdutividade[],
  };
}
