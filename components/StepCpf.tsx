type Props = {
  cpf: string;
  erro: string;
  loading: boolean;
  onCpfChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
};

export default function StepCpf({
  cpf,
  erro,
  loading,
  onCpfChange,
  onSubmit,
}: Props) {
  return (
    <>
      <h1 className="text-3xl font-bold text-center text-slate-800">
        Portal de Agendamento
      </h1>

      <p className="text-slate-500 text-center mt-2">
        Informe seu CPF para continuar
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <input
          type="text"
          value={cpf}
          onChange={onCpfChange}
          maxLength={14}
          placeholder="000.000.000-00"
          disabled={loading}
          className={`w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 ${
            erro
              ? "border-red-500 focus:ring-red-500"
              : "border-slate-300 focus:ring-cyan-500"
          }`}
        />

        {erro && <p className="text-red-500 text-sm">{erro}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 transition text-white font-semibold py-3 rounded-xl disabled:opacity-50 shadow-lg"
        >
          {loading ? "Consultando..." : "Continuar"}
        </button>
      </form>
    </>
  );
}