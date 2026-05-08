type DataDisponivel = {
  diaSemana: string;
  datas: string[];
};

type Props = {
  datasDisponiveis: DataDisponivel[];
  dataSelecionada: string;
  onSelecionarData: (data: string) => void;
};

export default function StepDatas({
  datasDisponiveis,
  dataSelecionada,
  onSelecionarData,
}: Props) {
  return (
    <>
      <h1 className="text-2xl font-bold text-slate-800">
        Escolha a data
      </h1>

      <p className="text-slate-500 mt-2">
        Selecione uma data disponível para continuar
      </p>

      <div className="mt-8 space-y-5">
        {datasDisponiveis.map((grupo) => (
          <div key={grupo.diaSemana}>
            <h2 className="font-semibold text-slate-700 mb-3">
              {grupo.diaSemana}
            </h2>

            <div className="grid grid-cols-2 gap-3">
              {grupo.datas.map((data) => (
                <button
                  key={data}
                  onClick={() => onSelecionarData(data)}
                  className={`rounded-xl py-3 px-4 font-semibold border transition ${
                    dataSelecionada === data
                      ? "border-blue-500 bg-blue-100 text-blue-800 shadow-md"
                      : "border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-700"
                  }`}
                >
                  {data}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}