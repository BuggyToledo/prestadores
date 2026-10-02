import { Phone } from 'lucide-react';
import { formatPhone } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { normalizePhoneBr } from '@/lib/validation';

type Props = {
  phone?: string | null;
  label?: string;
  className?: string;
  compact?: boolean;
};

export function PhoneButton({
  phone,
  label = 'Ligar',
  className,
  compact = false,
}: Props) {
  if (!phone?.trim()) return null;

  const normalized = normalizePhoneBr(phone);
  const tel = normalized.valid && normalized.e164 ? `+${normalized.e164}` : phone.replace(/\D/g, '');
  if (!tel) return null;

  const display = normalized.display || formatPhone(phone);

  return (
    <a
      href={`tel:${tel}`}
      aria-label={`${label}${display ? `: ${display}` : ''}`}
      className={cn(
        'inline-flex min-h-touch min-w-touch items-center justify-center gap-2 rounded-control border border-brand-border bg-slate-100 px-4 font-semibold text-brand-navy transition-colors hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-amber',
        compact ? 'px-3' : 'w-full sm:w-auto',
        className
      )}
    >
      <Phone className="h-5 w-5 shrink-0" aria-hidden />
      {!compact ? <span>{label}</span> : null}
    </a>
  );
}
