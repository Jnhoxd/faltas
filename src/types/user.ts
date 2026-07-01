export interface User {
  id?: string;
  fullName: string;
  email: string;
  registrationNumber: string;
  role: 'professor' | 'administrador';
  unit: string;
  createdAt: string;
  allowedClasses?: string[]; // Array of class numbers that the teacher can access
}

export const SENAC_UNITS = [
  'Alfenas',
  'Araxá',
  'Barbacena',
  'Belo Horizonte',
  'Betim',
  'Conselheiro Lafaiete',
  'Contagem',
  'Coromandel',
  'Coronel Fabriciano',
  'Curvelo',
  'Diamantina',
  'Divinópolis',
  'Extrema',
  'Governador Valadares',
  'Guaxupé',
  'Ipatinga',
  'Itabira',
  'Itajubá',
  'Itaúna',
  'Ituiutaba',
  'Juiz de Fora',
  'Lavras',
  'Manhuaçu',
  'Montes Claros',
  'Patos de Minas',
  'Patrocínio',
  'Poços de Caldas',
  'Pouso Alegre',
  'SENAC-SESC',
  'São João del-Rei',
  'Sete Lagoas',
  'Tiradentes',
  'Três Corações',
  'Uberaba',
  'Uberlândia',
  'Varginha'
] as const;

export type SenacUnit = typeof SENAC_UNITS[number];

export function getAdminPassword(unit: string): string {
  const specialCases: Record<string, string> = {
    'Patos de Minas': 'senacpatos',
    'Patrocínio': 'senacpatrocinio'
  };

  if (unit in specialCases) {
    return specialCases[unit];
  }

  return `senac${unit.toLowerCase().slice(0, 3)}`;
}