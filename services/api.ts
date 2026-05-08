export async function consultarBeneficiario(
  cpf: string
) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const cpfLimpo = cpf.replace(/\D/g, "");

      if (cpfLimpo === "11111111111") {
        reject("Beneficiário não encontrado");
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

export async function listarHorarios() {
  return [
    "08:00",
    "08:30",
    "09:00",
    "09:30",
    "10:00",
    "14:00",
    "14:30",
    "15:00",
  ];
}

export async function confirmarAgendamento() {
  return {
    sucesso: true,
    protocolo: `AG-${Math.floor(
      Math.random() * 100000
    )}`,
  };
}