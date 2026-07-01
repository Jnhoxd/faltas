// Funções de validação reutilizáveis
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  
  // Regex para validar email genérico
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim().toLowerCase());
}

export function sanitizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const normalized = digits.replace(/^0+/, '');

  if (!normalized) {
    return '';
  }

  if (normalized.length === 10 || normalized.length === 11) {
    return `55${normalized}`;
  }

  if (normalized.length >= 11 && normalized.length <= 15) {
    return normalized;
  }

  return '';
}

export function isValidPhoneNumber(phone: string): boolean {
  return Boolean(sanitizePhone(phone));
}

export function sanitizeString(str: string): string {
  return str?.trim() ?? '';
}

export function isValidDate(dateStr: string): boolean {
  if (!dateStr) return false;
  
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  if (!regex.test(dateStr)) return false;

  const [, day, month, year] = dateStr.match(regex) || [];
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  return date instanceof Date && !isNaN(date.getTime()) &&
    date.getDate() === Number(day) &&
    date.getMonth() === Number(month) - 1 &&
    date.getFullYear() === Number(year);
}

export function isValidDateList(dates: string[]): boolean {
  return dates.every(isValidDate);
}

export function formatSenacEmail(fullName: string): string {
  // Remove acentos e caracteres especiais
  const normalized = fullName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // Divide o nome em partes
  const parts = normalized.toLowerCase().split(' ').filter(part => part.length > 0);
  
  if (parts.length < 2) {
    return '';
  }

  // Pega o primeiro nome e o último sobrenome
  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  
  // Formata o email
  return `${firstName}.${lastName}@mg.senac.br`;
}