export interface Operator {
  name: string;
  address: string[];
  email: string;
}

export const operator: Operator | null = import.meta.env.VITE_LEGAL_NAME
  ? {
      name: import.meta.env.VITE_LEGAL_NAME,
      address: (import.meta.env.VITE_LEGAL_ADDRESS || '')
        .split('|')
        .map((line) => line.trim())
        .filter(Boolean),
      email: import.meta.env.VITE_LEGAL_EMAIL || ''
    }
  : null;

export const hasLegal = operator !== null;
