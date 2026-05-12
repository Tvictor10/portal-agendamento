type GrupoDatas = {
  diaSemana: string;
  datas: string[];
};

type Props = {
  datasDisponiveis?: GrupoDatas[];
  dataSelecionada?: string;
  onSelecionarData: (data: string) => void;
};

export default function StepDatas({
  datasDisponiveis = [],
  dataSelecionada = "",
  onSelecionarData,
}: Props) {
  return (
    <>
      <h1 className="text-2xl font-bold text-slate-800">
        Escolha a data
      </h1>

      <p className="text-slate-500 mt-2">
        Selecione uma das datas disponíveis.
      </p>

      {datasDisponiveis.length === 0 ? (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Nenhuma data disponível encontrada para este prestador.
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          {datasDisponiveis.map((grupo) => (
            <div key={grupo.diaSemana}>
              <h2 className="font-semibold text-slate-700 mb-3 capitalize">
                {grupo.diaSemana}
              </h2>

              <div className="grid grid-cols-2 gap-3">
                {grupo.datas.map((data) => (
                  <button
                    key={data}
                    onClick={() => onSelecionarData(data)}
                    className={`rounded-xl p-3 border font-semibold transition ${
                      dataSelecionada === data
                        ? "bg-blue-600 text-white border-blue-600 shadow-md"
                        : "bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50"
                    }`}
                  >
                    {data}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}