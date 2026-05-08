export type Carteirinha = {
  id: number;
  numero: string;
  tipo: "clinico" | "ortodontia";
  descricao: string;
};

export type Beneficiario = {
  nome: string;
  carteirinhas: Carteirinha[];
};

export type Dentista = {
  id: number;
  nome: string;
  especialidade: string;
};

export type DataDisponivel = {
  diaSemana: string;
  datas: string[];
};

export async function consultarBeneficiario(cpf: string) {
  return new Promise<Beneficiario>((resolve, reject) => {
    setTimeout(() => {
      const cpfLimpo = cpf.replace(/\D/g, "");

      if (cpfLimpo === "11111111111") {
        reject("Beneficiário não encontrado");
        return;
      }

      if (cpfLimpo === "99999999999") {
        reject("Não foi possível continuar. Entre em contato com nossa equipe.");
        return;
      }

      resolve({
        nome: "João Silva",
        carteirinhas: [
          {
            id: 1,
            numero: "CLI-123456",
            tipo: "clinico",
            descricao: "Carteirinha Clínica",
          },
          {
            id: 2,
            numero: "ORT-987654",
            tipo: "ortodontia",
            descricao: "Carteirinha Ortodôntica",
          },
        ],
      });
    }, 1000);
  });
}

export async function listarDentistasClinicos() {
  return [
    { id: 1, nome: "Dra. Ana Souza", especialidade: "Clínico Geral" },
    { id: 2, nome: "Dr. Carlos Lima", especialidade: "Clínico Geral" },
    { id: 3, nome: "Dra. Marina Alves", especialidade: "Clínico Geral" },
  ];
}

export async function listarDentistasOdontopediatria() {
  return [
    { id: 20, nome: "Dra. Camila Rocha", especialidade: "Odontopediatria" },
  ];
}

export async function buscarDentistaOrtodonticoDoPaciente() {
  return {
    id: 10,
    nome: "Dra. Beatriz Costa",
    especialidade: "Ortodontia",
  };
}

export async function listarDatasDisponiveis() {
  return [
    {
      diaSemana: "Segunda-feira",
      datas: ["18/05/2026", "25/05/2026"],
    },
    {
      diaSemana: "Terça-feira",
      datas: ["19/05/2026", "26/05/2026"],
    },
    {
      diaSemana: "Quarta-feira",
      datas: ["13/05/2026", "20/05/2026", "27/05/2026"],
    },
    {
      diaSemana: "Quinta-feira",
      datas: ["14/05/2026", "21/05/2026"],
    },
    {
      diaSemana: "Sexta-feira",
      datas: ["15/05/2026", "22/05/2026"],
    },
  ];
}

export async function listarHorariosDisponiveis() {
  return ["08:00", "08:30", "09:00", "09:30", "10:00", "14:00", "14:30", "15:00"];
}

export async function confirmarAgendamento() {
  return {
    sucesso: true,
    protocolo: `AG-${Math.floor(Math.random() * 100000)}`,
  };
}