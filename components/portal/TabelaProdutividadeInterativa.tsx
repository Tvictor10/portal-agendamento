
"use client";

import { useState } from "react";
import DetalhamentoProdutividade from "./DetalhamentoProdutividade";

type Funcionario = {
  id: string;
  nome: string;
  perfil: "agente" | "admin";
  ativo: boolean;
  realizados: number;
  cancelados: number;
};

type TipoRelatorio = "realizados" | "cancelados";

type Props = {
  funcionarios: Funcionario[];
  inicio: string;
  fim: string;
};

export default function TabelaProdutividadeInterativa({
  funcionarios,
  inicio,
  fim,
}: Props) {
  const [detalhamento, setDetalhamento] = useState<{
    funcionarioId?: string;
    funcionarioNome?: string;
    tipo: TipoRelatorio;
  } | null>(null);

  function abrir(
    funcionario: Funcionario,
    tipo: TipoRelatorio
  ) {
    setDetalhamento({
      funcionarioId: funcionario.id,
      funcionarioNome: funcionario.nome,
      tipo,
    });
  }

  return (
    <>
      <div className="mt-5 flex justify-end">
  <button
    type="button"
    onClick={() => setDetalhamento({ tipo: "realizados" })}
    className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
  >
    Exportar todos — Excel
  </button>
</div>

<div className="mt-5 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-600">
            <tr>
              <th className="px-3 py-3 font-semibold">Funcionário</th>
              <th className="px-3 py-3 font-semibold">Perfil</th>
              <th className="px-3 py-3 text-center font-semibold">
                Realizados
              </th>
              <th className="px-3 py-3 text-center font-semibold">
                Cancelados
              </th>
            </tr>
          </thead>

          <tbody>
            {funcionarios.map((funcionario) => (
              <tr
                key={funcionario.id}
                className="border-b border-slate-100"
              >
                <td className="px-3 py-4 font-medium text-slate-800">
                  {funcionario.nome}

                  {!funcionario.ativo && (
                    <span className="ml-2 text-xs text-slate-500">
                      (Inativo)
                    </span>
                  )}
                </td>

                <td className="px-3 py-4 text-slate-600">
                  {funcionario.perfil === "admin"
                    ? "Administrador"
                    : "Agente"}
                </td>

                <td className="px-3 py-4 text-center">
                  <button
                    type="button"
                    onClick={() => abrir(funcionario, "realizados")}
                    disabled={funcionario.realizados === 0}
                    className="font-semibold text-blue-700 underline-offset-4 hover:underline disabled:cursor-default disabled:text-slate-400 disabled:no-underline"
                    title="Ver agendamentos realizados"
                  >
                    {funcionario.realizados}
                  </button>
                </td>

                <td className="px-3 py-4 text-center">
                  <button
                    type="button"
                    onClick={() => abrir(funcionario, "cancelados")}
                    disabled={funcionario.cancelados === 0}
                    className="font-semibold text-red-700 underline-offset-4 hover:underline disabled:cursor-default disabled:text-slate-400 disabled:no-underline"
                    title="Ver agendamentos cancelados"
                  >
                    {funcionario.cancelados}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {funcionarios.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-500">
            Nenhum funcionário encontrado.
          </p>
        )}
      </div>

      {detalhamento && (
        <DetalhamentoProdutividade
          aberto={true}
          onFechar={() => setDetalhamento(null)}
          funcionarioId={detalhamento.funcionarioId}
          funcionarioNome={detalhamento.funcionarioNome}
          tipo={detalhamento.tipo}
          inicio={inicio}
          fim={fim}
        />
      )}
    </>
  );
}
