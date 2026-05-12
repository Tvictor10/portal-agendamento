export const CLINICAS_PERMITIDAS = [
  "CENTRO",
  "PARNAMIRIM",
  "GOIANINHA",
  "SANTA CRUZ",
];

export const PROCEDIMENTOS_CLINICOS = [
  "AUTORIZAÇÃO | RAIO X",
  "CANAL",
  "PERIODONTIA",
  "RECONSTRUÇÃO",
  "CIRURGIA",
  "LIMPEZA | RESTAURAÇÃO",
  "CONSULTA INICIAL",
  "ODONTOPEDIATRIA",
] as const;

export const PROCEDIMENTOS_COM_ENCAMINHAMENTO = [
  "CANAL",
  "PERIODONTIA",
  "RECONSTRUÇÃO",
  "CIRURGIA",
];

export const PROCEDIMENTOS_WHATSAPP = ["AUTORIZAÇÃO | RAIO X"];

export const MENSAGEM_ENCAMINHAMENTO =
  "Para este tipo de atendimento é necessário o encaminhamento do dentista, caso não tenha, escolha a opção Autorização";

export const WHATSAPP_URL =
  "https://wa.me/558488024098?text=Olá,%20gostaria%20de%20agendar%20um%20atendimento.";

export const REGRAS_PROCEDIMENTOS = {
  "AUTORIZAÇÃO | RAIO X": {
    tipo: "whatsapp",
    dentistasPermitidos: [],
  },
  CANAL: {
    tipo: "encaminhamento",
    dentistasPermitidos: [],
  },
  PERIODONTIA: {
    tipo: "encaminhamento",
    dentistasPermitidos: [],
  },
  RECONSTRUÇÃO: {
    tipo: "encaminhamento",
    dentistasPermitidos: [],
  },
  CIRURGIA: {
    tipo: "encaminhamento",
    dentistasPermitidos: [],
  },
  "LIMPEZA | RESTAURAÇÃO": {
    tipo: "clinico",
    dentistasPermitidos: [],
  },
  "CONSULTA INICIAL": {
    tipo: "clinico",
    dentistasPermitidos: [],
  },
  ODONTOPEDIATRIA: {
    tipo: "odontopediatria",
    dentistasPermitidos: [],
  },
};