
import Link from "next/link";
import { redirect } from "next/navigation";
import { consultarProdutividade } from "../../../../services/portalProdutividade";
import TabelaProdutividadeInterativa from "../../../../components/portal/TabelaProdutividadeInterativa";

export const dynamic = "force-dynamic";

type Periodo = "hoje" | "semana" | "mes" | "personalizado";

type Props = {
  searchParams: Promise<{
    periodo?: string;
    inicio?: string;
    fim?: string;
  }>;
};

const FUSO = "America/Sao_Paulo";

function dataBrasilia(data: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(data);
}

function dataValida(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return false;
  }

  const data = new Date(`${valor}T12:00:00Z`);

  return !Number.isNaN(data.getTime()) &&
    data.toISOString().slice(0, 10) === valor;
}

function adicionarDias(data: string, quantidade: number): string {
  const valor = new Date(`${data}T12:00:00Z`);
  valor.setUTCDate(valor.getUTCDate() + quantidade);
  return valor.toISOString().slice(0, 10);
}

function inicioUTC(data: string): string {
  // Calcula o início do dia no fuso de Brasília.
  // O deslocamento é obtido dinamicamente, sem assumir UTC-3.
  const referencia = new Date(`${data}T12:00:00Z`);

  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: FUSO,
    timeZoneName: "shortOffset",
  }).formatToParts(referencia);

  const nomeFuso =
    partes.find((parte) => parte.type === "timeZoneName")
      ?.value ?? "GMT-3";

  const correspondencia = nomeFuso.match(
    /GMT([+-])(\d{1,2})(?::(\d{2}))?/
  );

  let deslocamentoMinutos = -180;

  if (correspondencia) {
    const sinal = correspondencia[1] === "+" ? 1 : -1;
    deslocamentoMinutos =
      sinal *
      (Number(correspondencia[2]) * 60 +
        Number(correspondencia[3] ?? 0));
  }

  const meiaNoiteUTC = Date.parse(`${data}T00:00:00Z`);

  return new Date(
    meiaNoiteUTC - deslocamentoMinutos * 60_000
  ).toISOString();
}

function obterPeriodo(
  periodo: Periodo,
  inicioInformado?: string,
  fimInformado?: string
) {
  const hoje = dataBrasilia(new Date());

  if (periodo === "hoje") {
    return {
      inicio: hoje,
      fim: hoje,
    };
  }

  if (periodo === "semana") {
    const diaSemana = new Date(
      `${hoje}T12:00:00Z`
    ).getUTCDay();

    const diasDesdeSegunda = (diaSemana + 6) % 7;

    return {
      inicio: adicionarDias(hoje, -diasDesdeSegunda),
      fim: adicionarDias(hoje, 6 - diasDesdeSegunda),
    };
  }

  if (periodo === "mes") {
    const [ano, mes] = hoje.split("-").map(Number);

    const ultimoDia = new Date(
      Date.UTC(ano, mes, 0)
    ).getUTCDate();

    return {
      inicio: `${ano}-${String(mes).padStart(2, "0")}-01`,
      fim: `${ano}-${String(mes).padStart(2, "0")}-${String(
        ultimoDia
      ).padStart(2, "0")}`,
    };
  }

  const inicio = dataValida(inicioInformado ?? "")
    ? inicioInformado!
    : hoje;

  const fim = dataValida(fimInformado ?? "")
    ? fimInformado!
    : hoje;

  return {
    inicio: inicio <= fim ? inicio : fim,
    fim: inicio <= fim ? fim : inicio,
  };
}

export default async function DashboardProdutividadePage({
  searchParams,
}: Props) {
  const parametros = await searchParams;

  const periodo: Periodo = (
    ["hoje", "semana", "mes", "personalizado"].includes(
      parametros.periodo ?? ""
    )
      ? parametros.periodo
      : "mes"
  ) as Periodo;

  const datas = obterPeriodo(
    periodo,
    parametros.inicio,
    parametros.fim
  );

  const filtro = {
    inicio: inicioUTC(datas.inicio),
    fim: inicioUTC(adicionarDias(datas.fim, 1)),
  };

  let resultado;

  try {
    resultado = await consultarProdutividade(filtro);
  } catch {
    redirect("/portal/login");
  }

  if (resultado.perfil !== "admin") {
    redirect("/portal/agendamento");
  }

  // Conta todos os agendamentos realizados no período,
  // mesmo quando cancelados posteriormente.
  const registros = resultado.registros;

  // Conta cancelamentos pela data efetiva do cancelamento.
  const cancelamentos = resultado.cancelamentos;

  const funcionarios = registros.filter(
    (registro) =>
      registro.origem === "agente" ||
      registro.origem === "admin"
  );

  const autoagendamentos = registros.filter(
    (registro) => registro.origem === "cliente"
  );

  const produtividadeFuncionarios = resultado.funcionarios.map(
    (funcionario) => ({
      ...funcionario,
      realizados: registros.filter(
        (registro) => registro.usuario_id === funcionario.id
      ).length,
      cancelados: cancelamentos.filter(
        (registro) => registro.usuario_id === funcionario.id
      ).length,
    })
  );

  const indicadores = [
    {
      titulo: "Agendamentos realizados",
      valor: registros.length,
      descricao: "Inclui os cancelados posteriormente",
    },
    {
      titulo: "Realizados por funcionários",
      valor: funcionarios.length,
      descricao: "Agentes e administradores",
    },
    {
      titulo: "Autoagendamentos",
      valor: autoagendamentos.length,
      descricao: "Beneficiários sem login de funcionário",
    },
    {
      titulo: "Cancelamentos",
      valor: cancelamentos.length,
      descricao: "Ocorridos no período selecionado",
    },
  ];

  const periodos = [
    { valor: "hoje", titulo: "Hoje" },
    { valor: "semana", titulo: "Esta semana" },
    { valor: "mes", titulo: "Este mês" },
    { valor: "personalizado", titulo: "Personalizado" },
  ];

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <Link
            href="/portal/admin"
            className="text-sm font-semibold text-blue-700 hover:underline"
          >
            ← Voltar ao Painel Administrativo
          </Link>

          <h1 className="mt-4 text-2xl font-bold text-blue-700">
            Dashboard e relatórios
          </h1>

          <p className="mt-2 text-slate-600">
            Acompanhamento dos agendamentos e da produtividade
            dos funcionários da Dental Med.
          </p>
        </header>

        <section className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">
            Filtrar produtividade
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            Agendamentos pela data de realização e cancelamentos pela data efetiva.
            Horário de Brasília.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {periodos.map((opcao) => (
              <Link
                key={opcao.valor}
                href={`/portal/admin/produtividade?periodo=${opcao.valor}`}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                  periodo === opcao.valor
                    ? "border-blue-700 bg-blue-700 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-blue-50"
                }`}
              >
                {opcao.titulo}
              </Link>
            ))}
          </div>

          {periodo === "personalizado" && (
            <form
              action="/portal/admin/produtividade"
              method="GET"
              className="mt-5 flex flex-wrap items-end gap-4"
            >
              <input
                type="hidden"
                name="periodo"
                value="personalizado"
              />

              <div>
                <label
                  htmlFor="inicio"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Data inicial
                </label>

                <input
                  id="inicio"
                  name="inicio"
                  type="date"
                  defaultValue={datas.inicio}
                  required
                  className="rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label
                  htmlFor="fim"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Data final
                </label>

                <input
                  id="fim"
                  name="fim"
                  type="date"
                  defaultValue={datas.fim}
                  required
                  className="rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
                />
              </div>

              <button
                type="submit"
                className="rounded-lg bg-blue-700 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800"
              >
                Aplicar filtro
              </button>
            </form>
          )}

          <p className="mt-4 text-xs text-slate-500">
            Período selecionado: {datas.inicio} até {datas.fim}.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {indicadores.map((indicador) => (
            <div
              key={indicador.titulo}
              className="rounded-xl bg-white p-5 shadow-sm"
            >
              <h2 className="text-sm font-medium text-slate-600">
                {indicador.titulo}
              </h2>

              <p className="mt-3 text-3xl font-bold text-blue-700">
                {indicador.valor}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                {indicador.descricao}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">
            Produtividade dos agendamentos
          </h2>

          {registros.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">
              Nenhum agendamento realizado no período selecionado.
            </p>
          ) : (
            <p className="mt-4 text-sm text-slate-600">
              Foram realizados {registros.length} agendamentos
              no período selecionado, incluindo os cancelados depois.
            </p>
          )}
        </section>

        <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">
            Produtividade por funcionário
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            Agendamentos realizados por agentes e administradores.
          </p>

          <TabelaProdutividadeInterativa
  funcionarios={produtividadeFuncionarios}
  inicio={datas.inicio}
  fim={datas.fim}
/>
                  </section>

        <p className="mt-4 text-xs text-slate-500">
          Agendamentos contados pela data de confirmação, inclusive os
          cancelados posteriormente. Cancelamentos contados pela data
          efetiva do cancelamento, no horário de Brasília.
        </p>
      </div>
    </main>
  );
}
