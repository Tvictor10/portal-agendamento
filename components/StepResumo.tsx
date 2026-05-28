import { PROCEDIMENTOS_COM_ENCAMINHAMENTO } from "../config/regrasAgendamento";

type Carteirinha = {
  descricao: string;
  numero: string;
};

type Beneficiario = {
  nome: string;
};

type Dentista = {
  nome: string;
};

type Props = {
  beneficiario: Beneficiario;
  carteirinhaSelecionada: Carteirinha | null;
  clinicaSelecionada: string;
  procedimentoClinico: string | null;
  dentistaSelecionado: Dentista | null;
  dataSelecionada: string;
  horarioSelecionado: string;
  ehOrtodontia: boolean;

  arquivoEncaminhamento: File | null;
  setArquivoEncaminhamento: (file: File | null) => void;
};

export default function StepResumo({
  beneficiario,
  carteirinhaSelecionada,
  clinicaSelecionada,
  procedimentoClinico,
  dentistaSelecionado,
  dataSelecionada,
  horarioSelecionado,
  ehOrtodontia,

  arquivoEncaminhamento,
  setArquivoEncaminhamento,
}: Props) {
  return (
    <>
      <h1 className="text-2xl font-bold text-slate-800">
        Resumo do agendamento
      </h1>

      {ehOrtodontia && (
        <div className="mt-6 bg-purple-50 border border-purple-200 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-purple-700">
            Para ortodontia, os horários serão exibidos com base no dentista que
            já acompanha seu tratamento.
          </p>
        </div>
      )}

      <div className="mt-6 bg-slate-100 rounded-xl p-4 border border-slate-200 space-y-2 text-sm text-slate-600">
        <p>
          <strong>Paciente:</strong> {beneficiario.nome}
        </p>

        <p>
          <strong>Carteirinha:</strong> {carteirinhaSelecionada?.descricao} -{" "}
          {carteirinhaSelecionada?.numero}
        </p>

        <p>
          <strong>Unidade:</strong> {clinicaSelecionada}
        </p>

        {procedimentoClinico && (
          <p>
            <strong>Procedimento:</strong> {procedimentoClinico}
          </p>
        )}

        <p>
          <strong>Dentista:</strong> {dentistaSelecionado?.nome}
        </p>

        <p>
          <strong>Data:</strong> {dataSelecionada}
        </p>

        <p>
          <strong>Horário:</strong> {horarioSelecionado}
        </p>
      </div>

      {procedimentoClinico &&
        PROCEDIMENTOS_COM_ENCAMINHAMENTO.includes(
          procedimentoClinico
        ) && (
          <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-800">
              Encaminhamento obrigatório
            </p>

            <p className="mt-1 text-sm text-amber-700">
              Para este procedimento é necessário anexar o encaminhamento
              odontológico.
            </p>

            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="mt-4 block w-full rounded-lg border border-slate-300 bg-white p-2 text-sm"
              onChange={(e) => {
                const file = e.target.files?.[0];

                if (file) {
                  setArquivoEncaminhamento(file);
                }
              }}
            />

            {arquivoEncaminhamento && (
              <p className="mt-2 text-sm text-green-700">
                Arquivo anexado: {arquivoEncaminhamento.name}
              </p>
            )}
          </div>
        )}
    </>
  );
}