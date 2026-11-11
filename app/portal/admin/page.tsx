
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createPortalServerClient } from "../../../services/supabasePortalServer";
import PortalLogoutButton from "../../../components/PortalLogoutButton";

export default async function PortalAdminPage() {
  const supabase = await createPortalServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Verifica se existe uma sessão autenticada.
  if (error || !user) {
    redirect("/portal/login");
  }

  // Consulta o perfil do funcionário no banco.
  const { data: usuario, error: perfilError } = await supabase
    .from("portal_usuarios")
    .select("nome, perfil, ativo")
    .eq("auth_user_id", user.id)
    .single();

  // Apenas administradores ativos podem acessar este painel.
  if (
    perfilError ||
    !usuario ||
    !usuario.ativo ||
    usuario.perfil !== "admin"
  ) {
    redirect("/portal/login");
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-5xl">
        {/* Cabeçalho administrativo */}
        <header className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-5">
            {/* Logo e identificação */}
            <div className="flex flex-wrap items-center gap-5">
              <Image
                src="/logo.png"
                alt="Dental Med"
                width={120}
                height={80}
                className="h-16 w-auto max-w-48 object-contain"
              />

              <div>
                <h1 className="text-2xl font-bold text-blue-700">
                  Painel Administrativo
                </h1>

                <p className="mt-2 text-slate-600">
                  Bem-vindo(a), {usuario.nome}.
                </p>
              </div>
            </div>

            {/* Botão para encerrar a sessão */}
            <PortalLogoutButton />
          </div>
        </header>

        {/* Funcionalidades administrativas */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Gerenciamento de agentes */}
          <Link
            href="/portal/admin/agentes"
            className="block rounded-xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <h2 className="font-semibold text-slate-800">
              Gerenciar agentes
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Cadastro e gerenciamento de funcionários.
            </p>

            <p className="mt-4 text-sm font-semibold text-blue-700">
              Gerenciar funcionários →
            </p>
          </Link>

                   {/* Dashboard e relatórios */}
          <Link
            href="/portal/admin/produtividade"
            className="block rounded-xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <h2 className="font-semibold text-slate-800">
              Dashboard e relatórios
            </h2>

            <p className="mt-2 text-sm text-slate-600">
  Indicadores e acompanhamento dos agendamentos.
</p>

<p className="mt-4 text-sm font-semibold text-blue-700">
  Acessar Dashboard →
</p>
          </Link>

          {/* Agendamento de beneficiários */}
          <Link
            href="/portal/agendamento"
            className="block rounded-xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <h2 className="font-semibold text-slate-800">
              Realizar agendamento
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Acesso ao agendamento de beneficiários.
            </p>

            <p className="mt-4 text-sm font-semibold text-blue-700">
              Acessar agendamento →
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
