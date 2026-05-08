type Props = {
  paciente: string;
  clinica: string;
  dentista: string;
  horario: string;
  procedimento: string | null;
  protocolo: string;
  onNovoAgendamento: () => void;
};

export default function StepConfirmacao({
  paciente,
  clinica,
  dentista,
  horario,
  procedimento,
  protocolo,
  onNovoAgendamento,
}: Props) {
  return (
    <>
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
          <span className="text-4xl">✓</span>
        </div>

        <h1 className="text-3xl font-bold text-slate-800 mt-6">
          Agendamento confirmado
        </h1>

        <p className="text-slate-500 mt-3">
          Seu atendimento foi reservado com sucesso.
        </p>
      </div>

      <div className="mt-8 bg-slate-100 rounded-xl p-5 border border-slate-200 space-y-3 text-sm text-slate-700">
        <p>
          <strong>Paciente:</strong> {paciente}
        </p>

        <p>
          <strong>Clínica:</strong> {clinica}
        </p>

        {procedimento && (
          <p>
            <strong>Procedimento:</strong> {procedimento}
          </p>
        )}

        <p>
          <strong>Dentista:</strong> {dentista}
        </p>

        <p>
          <strong>Horário:</strong> {horario}
        </p>

        <p>
          <strong>Protocolo:</strong> {protocolo}
        </p>
      </div>

      <button
        onClick={onNovoAgendamento}
        className="w-full mt-8 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 transition text-white font-semibold py-3 rounded-xl shadow-lg"
      >
        Novo agendamento
      </button>
    </>
  );
}