
"use client";

import { useEffect, useState } from "react";
import ExcelJS from "exceljs";

type TipoRelatorio = "realizados" | "cancelados";

type Registro = {
  id_agendamento_datasys: string;
  funcionario: string;
  origem: string;
  nome: string;
  carteirinha: string;
  unidade: string;
  dentista: string;
  especialidade: string;
  data_agendamento: string;
  horario: string;
  status: string;
  criado_em: string;
  confirmado_em: string | null;
  cancelado_em: string | null;
};

type Props = {
  aberto: boolean;
  onFechar: () => void;
  funcionarioId?: string;
  funcionarioNome?: string;
  tipo: TipoRelatorio;
  inicio: string;
  fim: string;
};

function formatarData(valor: string | null): string {
  if (!valor) return "-";

  const data = valor.slice(0, 10);
  const partes = data.split("-");

  if (partes.length !== 3) return valor;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function formatarDataHora(valor: string | null): string {
  if (!valor) return "-";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) return valor;

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  }).format(data);
}

export default function DetalhamentoProdutividade({
  aberto,
  onFechar,
  funcionarioId,
  funcionarioNome,
  tipo,
  inicio,
  fim,
}: Props) {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    if (!aberto) return;

    const controlador = new AbortController();

    async function carregar() {
      setCarregando(true);
      setErro("");
      setRegistros([]);

      try {
        const parametros = new URLSearchParams({
          tipo,
          inicio,
          fim,
        });

        if (funcionarioId) {
          parametros.set("funcionarioId", funcionarioId);
        }

        const resposta = await fetch(
          `/api/portal/produtividade/detalhamento?${parametros}`,
          {
            cache: "no-store",
            signal: controlador.signal,
          }
        );

        const dados = await resposta.json();

        if (!resposta.ok || !dados.success) {
          throw new Error(
            dados.mensagem ?? "Não foi possível consultar os registros."
          );
        }

        if (!controlador.signal.aborted) {
          setRegistros(dados.registros ?? []);
        }
      } catch (error) {
        if (!controlador.signal.aborted) {
          setErro(
            error instanceof Error
              ? error.message
              : "Erro ao carregar os agendamentos."
          );
        }
      } finally {
        if (!controlador.signal.aborted) {
          setCarregando(false);
        }
      }
    }

    void carregar();

    return () => controlador.abort();
  }, [aberto, funcionarioId, tipo, inicio, fim]);

  async function exportarExcel() {
    if (!registros.length || exportando) return;

    setExportando(true);

    try {
      const workbook = new ExcelJS.Workbook();
      const planilha = workbook.addWorksheet("Agendamentos");

      planilha.columns = [
        { header: "Funcionário", key: "funcionario", width: 28 },
        { header: "Beneficiário", key: "nome", width: 35 },
        { header: "Carteirinha", key: "carteirinha", width: 22 },
        { header: "Unidade", key: "unidade", width: 24 },
        { header: "Dentista", key: "dentista", width: 30 },
        { header: "Especialidade", key: "especialidade", width: 28 },
        { header: "Data da consulta", key: "data", width: 20 },
        { header: "Horário", key: "horario", width: 15 },
        { header: "Situação", key: "status", width: 18 },
        { header: "Data de realização", key: "criacao", width: 23 },
        { header: "Data do cancelamento", key: "cancelamento", width: 25 },
      ];

      for (const registro of registros) {
        planilha.addRow({
          funcionario: registro.funcionario,
          nome: registro.nome,
          carteirinha: registro.carteirinha,
          unidade: registro.unidade,
          dentista: registro.dentista,
          especialidade: registro.especialidade,
          data: formatarData(registro.data_agendamento),
          horario: registro.horario,
          status: registro.status,
          criacao: formatarDataHora(registro.criado_em),
          cancelamento: formatarDataHora(registro.cancelado_em),
        });
      }

      const cabecalho = planilha.getRow(1);
      cabecalho.font = {
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      cabecalho.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1D4ED8" },
      };
      cabecalho.alignment = { vertical: "middle" };
      cabecalho.height = 24;

      planilha.autoFilter = {
        from: "A1",
        to: "J1",
      };

      planilha.views = [
        { state: "frozen", ySplit: 1 },
      ];

      const buffer = await workbook.xlsx.writeBuffer();

      const arquivo = new Blob(
        [new Uint8Array(buffer)],
        {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }
      );

      const url = URL.createObjectURL(arquivo);
      const link = document.createElement("a");

      link.href = url;

      const nomeSeguro = (funcionarioNome ?? "todos")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9_-]+/g, "_")
        .toLowerCase();

      link.download =
        `produtividade_${nomeSeguro}_${tipo}_${inicio}_${fim}.xlsx`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao exportar Excel:", error);
      setErro("Não foi possível gerar o arquivo Excel.");
    } finally {
      setExportando(false);
    }
  }

  if (!aberto) return null;

  const titulo = funcionarioNome ?? "Todos os agendamentos";

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-detalhamento"
        className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 p-5">
          <div>
            <h2
              id="titulo-detalhamento"
              className="text-xl font-bold text-slate-800"
            >
              {titulo}
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              {tipo === "realizados"
                ? "Agendamentos realizados"
                : "Agendamentos cancelados"}
              {" · "}
              {formatarData(inicio)} a {formatarData(fim)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void exportarExcel()}
              disabled={carregando || exportando || !registros.length}
              className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {exportando ? "Gerando Excel..." : "Exportar Excel"}
            </button>

            <button
              type="button"
              onClick={onFechar}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Fechar
            </button>
          </div>
        </header>

        <div className="overflow-auto p-5">
          {carregando && (
            <p className="py-8 text-center text-slate-600">
              Carregando agendamentos...
            </p>
          )}

          {erro && (
            <p
              role="alert"
              className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700"
            >
              {erro}
            </p>
          )}

          {!carregando && !erro && (
            <>
              <p className="mb-4 text-sm text-slate-600">
                Total de registros:{" "}
                <strong>{registros.length}</strong>
              </p>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                        {!funcionarioId && (
                       <th className="px-3 py-3">Funcionário</th>
                        )}
                      <th className="px-3 py-3">Beneficiário</th>
                      <th className="px-3 py-3">Carteirinha</th>
                      <th className="px-3 py-3">Unidade</th>
                      <th className="px-3 py-3">Dentista</th>
                      <th className="px-3 py-3">Especialidade</th>
                      <th className="px-3 py-3">Data da consulta</th>
                      <th className="px-3 py-3">Horário</th>
                      <th className="px-3 py-3">Data de realização</th>
                      <th className="px-3 py-3">Situação</th>
                    </tr>
                  </thead>

                  <tbody>
                    {registros.map((registro, indice) => (
                      <tr
                        key={`${registro.id_agendamento_datasys}-${indice}`}
                        className="border-b border-slate-100"
                      >
                        {!funcionarioId && (
                        <td className="px-3 py-3">
                        {registro.funcionario}
                         </td>
                         )}
                        <td className="px-3 py-3 font-medium text-slate-800">
                          {registro.nome}
                        </td>
                        <td className="px-3 py-3">
                          {registro.carteirinha}
                        </td>
                        <td className="px-3 py-3">
                          {registro.unidade}
                        </td>
                        <td className="px-3 py-3">
  {registro.dentista}
</td>
<td className="px-3 py-3">
  {registro.especialidade}
</td>
<td className="px-3 py-3">
  {formatarData(registro.data_agendamento)}
</td>
<td className="px-3 py-3">
  {registro.horario}
</td>
<td className="px-3 py-3">
  {formatarDataHora(registro.criado_em)}
</td>
<td className="px-3 py-3">
  {registro.status}
</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {registros.length === 0 && (
                <p className="py-8 text-center text-slate-500">
                  Nenhum registro encontrado neste período.
                </p>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
