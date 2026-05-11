type Clinica = {
  id: number;
  nome: string;
};

type Props = {
  carteirinhaDescricao?: string;
  clinicas: Clinica[];
  onSelecionarUnidade: (clinica: Clinica) => void;
};

export default function StepUnidade({
  carteirinhaDescricao,
  clinicas,
  onSelecionarUnidade,
}: Props) {
  return (
    <>
      <h1 className="text-2xl font-bold text-slate-800">
        Escolha a unidade
      </h1>

      <p className="text-slate-500 mt-2">
        Carteirinha: {carteirinhaDescricao}
      </p>

      <div className="mt-8 space-y-3">
        {clinicas.map((clinica) => (
          <button
            key={clinica.id}
            onClick={() => onSelecionarUnidade(clinica)}
            className="w-full rounded-xl p-4 text-left border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 hover:shadow-md transition"
          >
            {clinica.nome}
          </button>
        ))}
      </div>
    </>
  );
}