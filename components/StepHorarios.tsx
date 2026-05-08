type Props = {
  horarios: string[];
  horarioSelecionado: string;
  onSelecionarHorario: (horario: string) => void;
};

export default function StepHorarios({
  horarios,
  horarioSelecionado,
  onSelecionarHorario,
}: Props) {
  return (
    <>
      <h1 className="text-2xl font-bold text-slate-800">
        Escolha o horário
      </h1>

      <p className="text-slate-500 mt-2">
        Selecione um dos horários disponíveis
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3">
        {horarios.map((horario) => (
          <button
            key={horario}
            onClick={() => onSelecionarHorario(horario)}
            className={`rounded-xl py-4 font-semibold border transition ${
              horarioSelecionado === horario
                ? "border-emerald-500 bg-emerald-100 text-emerald-800 shadow-md"
                : "border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 text-slate-700"
            }`}
          >
            {horario}
          </button>
        ))}
      </div>
    </>
  );
}