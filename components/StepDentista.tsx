type Dentista = {
  id: number;
  nome: string;
  especialidade?: string;
};

type Props = {
  dentistas: Dentista[];
  dentistaSelecionado?: Dentista | null;
  onSelecionarDentista: (dentista: Dentista) => void;
  procedimentoClinico?: string | null;
  mostrarObservacaoEncaminhamento?: boolean;
  mensagemEncaminhamento?: string;
};

export default function StepDentista({
  dentistas,
  dentistaSelecionado,
  onSelecionarDentista,
  mostrarObservacaoEncaminhamento,
  mensagemEncaminhamento,
}: Props) {
  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold text-slate-800">
        Escolha o dentista
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Selecione o profissional desejado.
      </p>

      {mostrarObservacaoEncaminhamento && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          {mensagemEncaminhamento}
        </div>
      )}

      {dentistas.length === 0 ? (
        <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          <p>
            Não há dentistas disponíveis para este atendimento.
            Procure nossa rede credenciada ou entre em contato pelo WhatsApp.
          </p>

          <a
            href="https://wa.me/5584999999999"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 block rounded-xl bg-green-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-green-700"
          >
            Falar pelo WhatsApp
          </a>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {dentistas.map((dentista) => (
            <button
              key={dentista.id}
              onClick={() => onSelecionarDentista(dentista)}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                dentistaSelecionado?.id === dentista.id
                  ? "border-blue-600 bg-blue-50"
                  : "border-slate-200 bg-white hover:border-blue-400"
              }`}
            >
              <div className="font-semibold text-slate-800">
                {dentista.nome}
              </div>

              {dentista.especialidade && (
                <div className="mt-1 text-sm text-slate-500">
                  {dentista.especialidade}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

    </div>
  );
}