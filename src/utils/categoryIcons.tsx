import React from 'react';
import {
  Briefcase,
  Building2,
  Car,
  Film,
  Gift,
  GraduationCap,
  HeartPulse,
  Laptop,
  Plane,
  ShoppingBag,
  Tag,
  TrendingUp,
  Utensils,
  Zap,
} from 'lucide-react';

export function getCategoryIcon(category: string, className = 'w-4 h-4'): React.ReactNode {
  const key = category.toLowerCase();
  if (key.includes('food') || key.includes('dining') || key.includes('grocer')) {
    return <Utensils className={className} />;
  }
  if (key.includes('shop')) {
    return <ShoppingBag className={className} />;
  }
  if (key.includes('transport') || key.includes('commute') || key.includes('fuel')) {
    return <Car className={className} />;
  }
  if (key.includes('bill') || key.includes('util') || key.includes('electric')) {
    return <Zap className={className} />;
  }
  if (key.includes('entertain') || key.includes('movie')) {
    return <Film className={className} />;
  }
  if (key.includes('health') || key.includes('medic')) {
    return <HeartPulse className={className} />;
  }
  if (key.includes('educat') || key.includes('course')) {
    return <GraduationCap className={className} />;
  }
  if (key.includes('travel') || key.includes('trip') || key.includes('vacat')) {
    return <Plane className={className} />;
  }
  if (key.includes('salary')) {
    return <Briefcase className={className} />;
  }
  if (key.includes('freelance')) {
    return <Laptop className={className} />;
  }
  if (key.includes('business')) {
    return <Building2 className={className} />;
  }
  if (key.includes('invest') || key.includes('dividend')) {
    return <TrendingUp className={className} />;
  }
  if (key.includes('gift')) {
    return <Gift className={className} />;
  }
  return <Tag className={className} />;
}
