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
  LucideProps,
} from 'lucide-react';

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

interface CategoryIconProps extends Omit<LucideProps, 'name'> {
  name?: string | null;
}

export function CategoryIcon({ name, ...props }: CategoryIconProps) {
  if (!name) {
    return <Briefcase {...props} />;
  }

  const IconComponent = iconMap[name] || Briefcase;
  return <IconComponent {...props} />;
}
