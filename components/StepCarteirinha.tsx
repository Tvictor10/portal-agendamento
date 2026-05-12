type Carteirinha = {
  id: number;
  numero: string;
  tipo: "clinico" | "ortodontia";
  descricao: string;
};

type Beneficiario = {
  nome: string;
  carteirinhas: Carteirinha[];
};

type Props = {
  beneficiario: Beneficiario;
  onSelecionarCarteirinha: (carteirinha: Carteirinha) => void;
};

export default function StepCarteirinha({
  beneficiario,
  onSelecionarCarteirinha,
}: Props) {
  return (
    <>
      <h1 className="text-2xl font-bold text-slate-800">
        Olá, {beneficiario.nome}
      </h1>

      <p className="text-slate-500 mt-2">
        Selecione a carteirinha para agendamento
      </p>

      <div className="mt-8 space-y-3">
        {beneficiario.carteirinhas.map((carteirinha) => (
          <button
            key={`${carteirinha.numero}-${carteirinha.tipo}`}
            onClick={() => onSelecionarCarteirinha(carteirinha)}
            className="w-full rounded-xl p-4 text-left border border-slate-200 hover:border-cyan-400 hover:bg-cyan-50 hover:shadow-md transition"
          >
            <p className="font-semibold text-slate-800">
              {carteirinha.descricao}
            </p>

            <p className="text-sm text-slate-500">
              Nº {carteirinha.numero}
            </p>
          </button>
        ))}
      </div>
    </>
  );
}