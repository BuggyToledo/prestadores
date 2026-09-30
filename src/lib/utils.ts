import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

export function formatPhone(value?: string | null): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return value;
}

export function formatCNPJ(value?: string | null): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (digits.length === 14) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  } else if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  return value;
}

export function formatCEP(value?: string | null): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (digits.length === 8) {
    return digits.replace(/(\d{5})(\d{3})/, '$1-$2');
  }
  return value;
}

export function getWhatsAppLink(whatsapp?: string | null, providerName?: string): string {
  if (!whatsapp) return '';
  const cleanNumber = whatsapp.replace(/\D/g, '');
  const number = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`;
  const message = encodeURIComponent(
    `Olá${providerName ? ` ${providerName}` : ''}! Encontrei seu contato no Catálogo de Prestadores de Serviços e gostaria de solicitar um orçamento.`
  );
  return `https://wa.me/${number}?text=${message}`;
}
