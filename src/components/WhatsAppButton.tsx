import { MessageCircle } from 'lucide-react';
import { getWhatsAppLink } from '@/lib/utils';
import { cn } from '@/lib/utils';

type Props = {
  whatsapp?: string | null;
  providerName?: string;
  label?: string;
  className?: string;
  compact?: boolean;
};

export function WhatsAppButton({
  whatsapp,
  providerName,
  label = 'Chamar no WhatsApp',
  className,
  compact = false,
}: Props) {
  const href = getWhatsAppLink(whatsapp, providerName);
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={cn(
        'inline-flex min-h-touch min-w-touch items-center justify-center gap-2 rounded-control bg-brand-green px-4 font-semibold text-white transition-colors hover:bg-brand-green-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green',
        compact ? 'px-3' : 'w-full sm:w-auto',
        className
      )}
    >
      <MessageCircle className="h-5 w-5 shrink-0" aria-hidden />
      {!compact ? <span>{label}</span> : null}
    </a>
  );
}
