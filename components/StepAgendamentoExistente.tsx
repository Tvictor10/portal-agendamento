type Agendamento = {
  idAtendimento: number;
  prestador: string;
  dataAgenda: string;
  horaInicio: string;
  horaFim: string;
  statusAgenda: string;
};

type Props = {
  agendamento: Agendamento;
  onVoltar: () => void;
};

export default function StepAgendamentoExistente({
  agendamento,
  onVoltar,
}: Props) {
  return (
    <>
      <h1 className="text-2xl font-bold text-slate-800">
        Você já possui um agendamento
      </h1>

      <p className="text-slate-500 mt-2">
        Seu próximo atendimento já está marcado.
      </p>

      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2 text-sm text-amber-900">
        <p>
          <strong>Data:</strong> {agendamento.dataAgenda}
        </p>

        <p>
          <strong>Horário:</strong> {agendamento.horaInicio} às{" "}
          {agendamento.horaFim}
        </p>

        <p>
          <strong>Prestador:</strong> {agendamento.prestador}
        </p>

        <p>
          <strong>Status:</strong> {agendamento.statusAgenda}
        </p>
      </div>

      <button
        onClick={onVoltar}
        className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 transition text-white font-semibold py-3 rounded-xl shadow-lg"
      >
        Voltar
      </button>
    </>
  );
}