'use client';

import React from 'react';
import {
  Zap,
  Wrench,
  Paintbrush,
  Wind,
  Key,
  Hammer,
  Car,
  Sparkles,
  Briefcase,
  Scissors,
  Home,
  Truck,
  Shield,
  Heart,
  Computer,
  Camera,
  Plug,
  Building2,
  Scale,
  HardHat,
  Flame,
  Leaf,
  Package,
  Wifi,
  Users,
  HeartPulse,
  Landmark,
  ShieldAlert,
  FileText,
  Bug,
  Recycle,
  Settings,
  type LucideProps,
} from 'lucide-react';
import { getCategoryIconSvgPath } from '@/lib/categoryIcons';

const iconMap: Record<string, React.FC<LucideProps>> = {
  Zap,
  Wrench,
  Paintbrush,
  Wind,
  Key,
  Hammer,
  Car,
  Sparkles,
  Briefcase,
  Scissors,
  Home,
  Truck,
  Shield,
  Heart,
  Computer,
  Camera,
  Plug,
  Building2,
  Scale,
  HardHat,
  Flame,
  Leaf,
  Package,
  Wifi,
  Users,
  HeartPulse,
  Landmark,
  ShieldAlert,
  FileText,
  Bug,
  Recycle,
  Settings,
};

interface CategoryIconProps extends Omit<LucideProps, 'name' | 'ref'> {
  name?: string | null;
  /** Usa o SVG estático de /public/icons/categories quando disponível. */
  preferSvg?: boolean;
}

/**
 * Renderiza o ícone de uma categoria pelo nome (ex.: Building2, Scale).
 * Fallback: SVG em /icons/categories/{name}.svg, depois Briefcase.
 */
export function CategoryIcon({ name, preferSvg = false, className, ...props }: CategoryIconProps) {
  const resolved = (name || '').trim();
  const svgPath = getCategoryIconSvgPath(resolved);

  if (preferSvg && svgPath) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={svgPath}
        alt=""
        aria-hidden="true"
        className={className}
        style={{ width: props.size ?? undefined, height: props.size ?? undefined }}
      />
    );
  }

  if (resolved && iconMap[resolved]) {
    const IconComponent = iconMap[resolved];
    return <IconComponent className={className} {...props} />;
  }

  // Fallback para SVG estático se o nome Lucide não estiver no mapa
  if (svgPath) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={svgPath}
        alt=""
        aria-hidden="true"
        className={className}
        style={{ width: props.size ?? undefined, height: props.size ?? undefined }}
      />
    );
  }

  return <Briefcase className={className} {...props} />;
}

export { iconMap as CATEGORY_LUCIDE_ICON_MAP };
