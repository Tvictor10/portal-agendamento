type Dentista = {
  id: number;
  nome: string;
  especialidade: string;
};

type Props = {
  procedimentoClinico: string | null;
  mostrarObservacaoEncaminhamento: boolean;
  mensagemEncaminhamento: string;
  dentistas: Dentista[];
  onSelecionarDentista: (dentista: Dentista) => void;
};

export default function StepDentista({
  procedimentoClinico,
  mostrarObservacaoEncaminhamento,
  mensagemEncaminhamento,
  dentistas,
  onSelecionarDentista,
}: Props) {
  return (
    <>
      <h1 className="text-2xl font-bold text-slate-800">
        Escolha o dentista
      </h1>

      <p className="text-slate-500 mt-2">
        Procedimento: {procedimentoClinico}
      </p>

      {mostrarObservacaoEncaminhamento && (
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-amber-800">
            {mensagemEncaminhamento}
          </p>
        </div>
      )}

      <div className="mt-8 space-y-3">
        {dentistas.map((dentista) => (
          <button
            key={dentista.id}
            onClick={() =>
              onSelecionarDentista(dentista)
            }
            className="w-full rounded-xl p-4 text-left border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 hover:shadow-md transition"
          >
            <p className="font-semibold text-slate-800">
              {dentista.nome}
            </p>

            <p className="text-sm text-slate-500">
              {dentista.especialidade}
            </p>
          </button>
        ))}
      </div>
    </>
  );
}