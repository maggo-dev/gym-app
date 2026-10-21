import { clsx, type ClassValue } from 'clsx'

/** Junta classes condicionais. */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}
