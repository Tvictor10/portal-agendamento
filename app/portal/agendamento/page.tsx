
import Link from "next/link";
import { redirect } from "next/navigation";
import Agendamento from "../../../components/Agendamento";
import PortalLogoutButton from "../../../components/PortalLogoutButton";
import { createPortalServerClient } from "../../../services/supabasePortalServer";

export default async function PortalAgendamentoPage() {
  const supabase = await createPortalServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/portal/login");
  }

  const { data: usuario, error: perfilError } = await supabase
    .from("portal_usuarios")
    .select("nome, perfil, ativo")
    .eq("auth_user_id", user.id)
    .single();

  if (
    perfilError ||
    !usuario ||
    !usuario.ativo ||
    !["admin", "agente"].includes(usuario.perfil)
  ) {
    redirect("/portal/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-blue-100">
      <header className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Funcionário conectado
            </p>
            <p className="font-semibold text-slate-800">
              {usuario.nome}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {usuario.perfil === "admin" && (
              <Link
                href="/portal/admin"
                className="rounded-lg border border-blue-200 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
              >
                Voltar ao painel
              </Link>
            )}

            <PortalLogoutButton />
          </div>
        </div>
      </header>

      <Agendamento origem="portal" />
    </div>
  );
}
