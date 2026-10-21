/** Formata números no padrão brasileiro (1.234,5). */
export const fmt = (n: number, decimals = 0) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
