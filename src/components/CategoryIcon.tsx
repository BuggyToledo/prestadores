import React from 'react';
import {
  // Manutenção, Obras & Construção
  Zap,
  Wrench,
  Paintbrush,
  Hammer,
  Key,
  HardHat,
  Construction,
  Drill,
  BrickWall,
  Ruler,
  Axe,
  Pipette,
  Shovel,
  Plug,

  // Hidráulica, Climatização & Gás
  Wind,
  Droplets,
  Flame,
  Thermometer,
  Fan,

  // Segurança, CFTV & Acesso
  Shield,
  ShieldCheck,
  Camera,
  Cctv,
  Lock,
  Bell,
  Radio,
  Eye,

  // Limpeza, Jardinagem & Dedetização
  Sparkles,
  TreePine,
  Trees,
  Flower2,
  Bug,
  Trash2,
  ShowerHead,
  Waves,

  // Transporte, Fretes & Veículos
  Truck,
  Package,
  Car,
  Bike,
  Boxes,

  // Tecnologia, TI & Eletrônica
  Computer,
  Laptop,
  Smartphone,
  Wifi,
  Server,
  Cpu,
  Tv,
  Printer,

  // Administração, Jurídico & Finanças
  Briefcase,
  FileText,
  Calculator,
  Scale,
  Landmark,
  Receipt,
  BadgePercent,

  // Saúde, Estética & Pets
  Heart,
  Stethoscope,
  Activity,
  Dog,
  Scissors,

  // Imóveis, Estruturas & Eventos
  Home,
  Building,
  Building2,
  Store,
  PartyPopper,
  Utensils,
  Coffee,
  Music,
  MapPin,

  LucideProps,
} from 'lucide-react';

const iconMap: Record<string, React.FC<LucideProps>> = {
  // Manutenção & Obras
  Zap,
  Wrench,
  Paintbrush,
  Hammer,
  Key,
  HardHat,
  Construction,
  Drill,
  BrickWall,
  Ruler,
  Axe,
  Pipette,
  Shovel,
  Plug,

  // Hidráulica & Climatização
  Wind,
  Droplets,
  Flame,
  Thermometer,
  Fan,

  // Segurança & Acesso
  Shield,
  ShieldCheck,
  Camera,
  Cctv,
  Lock,
  Bell,
  Radio,
  Eye,

  // Limpeza & Meio Ambiente
  Sparkles,
  TreePine,
  Trees,
  Flower2,
  Bug,
  Trash2,
  ShowerHead,
  Waves,

  // Transporte & Logística
  Truck,
  Package,
  Car,
  Bike,
  Boxes,

  // Tecnologia & TI
  Computer,
  Laptop,
  Smartphone,
  Wifi,
  Server,
  Cpu,
  Tv,
  Printer,

  // Negócios & Consultoria
  Briefcase,
  FileText,
  Calculator,
  Scale,
  Landmark,
  Receipt,
  BadgePercent,

  // Saúde, Cuidados & Estética
  Heart,
  Stethoscope,
  Activity,
  Dog,
  Scissors,

  // Espaços & Eventos
  Home,
  Building,
  Building2,
  Store,
  PartyPopper,
  Utensils,
  Coffee,
  Music,
  MapPin,
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

export const CATEGORY_ICON_LIST = Object.keys(iconMap);
