import {
  Flower2, Hammer, HardHat, KeyRound, Paintbrush, Plug, Scissors, Sparkles, Wrench, Zap,
  type LucideIcon,
} from 'lucide-react'

const iconos: Record<string, LucideIcon> = {
  Plomero: Wrench,
  Electricista: Zap,
  Albañil: HardHat,
  Pintor: Paintbrush,
  Carpintero: Hammer,
  Cerrajero: KeyRound,
  'Técnico de electrodomésticos': Plug,
  Jardinero: Flower2,
  Limpieza: Sparkles,
  Estilista: Scissors,
}

export function iconoOficio(nombre: string): LucideIcon {
  return iconos[nombre] ?? Wrench
}