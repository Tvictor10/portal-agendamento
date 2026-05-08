type ProcedimentoClinico =
  | "AUTORIZAÇÃO | RAIO X"
  | "CANAL"
  | "PERIODONTIA"
  | "RECONSTRUÇÃO"
  | "CIRURGIA"
  | "LIMPEZA | RESTAURAÇÃO"
  | "CONSULTA INICIAL"
  | "ODONTOPEDIATRIA";

type Props = {
  clinicaSelecionada: string;
  procedimentos: ProcedimentoClinico[];
  procedimentoSelecionado: ProcedimentoClinico | null;
  onSelecionarProcedimento: (
    procedimento: ProcedimentoClinico
  ) => void;
  whatsappUrl: string;
};

export default function StepProcedimento({
  clinicaSelecionada,
  procedimentos,
  procedimentoSelecionado,
  onSelecionarProcedimento,
  whatsappUrl,
}: Props) {
  return (
    <>
      <h1 className="text-2xl font-bold text-slate-800">
        Escolha o procedimento
      </h1>

      <p className="text-slate-500 mt-2">
        Unidade: {clinicaSelecionada}
      </p>

      <div className="mt-8 space-y-3">
        {procedimentos.map((procedimento) => (
          <button
            key={procedimento}
            onClick={() =>
              onSelecionarProcedimento(procedimento)
            }
            className={`w-full rounded-xl p-4 text-left border transition ${
              procedimentoSelecionado === procedimento
                ? "border-orange-500 bg-orange-100 shadow-md"
                : "border-slate-200 hover:border-orange-400 hover:bg-orange-50 hover:shadow-md"
            }`}
          >
            {procedimento}
          </button>
        ))}
      </div>

      {procedimentoSelecionado ===
        "AUTORIZAÇÃO | RAIO X" && (
        <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-green-700">
            Este tipo de atendimento é agendado apenas por nossa equipe.
          </p>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center mt-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 rounded-xl shadow-lg"
          >
            Falar no WhatsApp
          </a>
        </div>
      )}
    </>
  );
}