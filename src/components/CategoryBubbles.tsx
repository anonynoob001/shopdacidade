import {
  Car,
  Check,
  Hammer,
  HeartPulse,
  Home as HomeIcon,
  Layers,
  PawPrint,
  Pizza,
  Shirt,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Store as StoreIcon,
  UtensilsCrossed
} from 'lucide-react';
import React from 'react';

export interface CategoryBubbleItem {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  storeCount?: number;
}

interface CategoryBubblesProps {
  categories: CategoryBubbleItem[];
  selectedCategory: string; // name or slug or ''
  onSelectCategory: (category: CategoryBubbleItem | null) => void;
  className?: string;
  showAllOption?: boolean;
}

function renderCategoryIcon(iconName?: string, categoryName?: string) {
  const norm = (categoryName || '').toLowerCase();
  if (norm.includes('restauran') || norm.includes('lanche') || norm.includes('comida') || iconName === 'Utensils') {
    return <UtensilsCrossed className="w-5 h-5" />;
  }
  if (norm.includes('pizza') || norm.includes('hamburg') || iconName === 'Pizza') {
    return <Pizza className="w-5 h-5" />;
  }
  if (norm.includes('supermercado') || norm.includes('bebida') || norm.includes('mercearia') || iconName === 'ShoppingCart') {
    return <ShoppingCart className="w-5 h-5" />;
  }
  if (norm.includes('constru') || norm.includes('reforma') || iconName === 'Hammer') {
    return <Hammer className="w-5 h-5" />;
  }
  if (norm.includes('eletr') || norm.includes('inform') || norm.includes('celular') || iconName === 'Smartphone') {
    return <Smartphone className="w-5 h-5" />;
  }
  if (norm.includes('moda') || norm.includes('calçado') || norm.includes('roupa') || iconName === 'Shirt') {
    return <Shirt className="w-5 h-5" />;
  }
  if (norm.includes('casa') || norm.includes('decora') || norm.includes('móve') || iconName === 'Home') {
    return <HomeIcon className="w-5 h-5" />;
  }
  if (norm.includes('farm') || norm.includes('saúde') || norm.includes('beleza') || iconName === 'HeartPulse') {
    return <HeartPulse className="w-5 h-5" />;
  }
  if (norm.includes('auto') || norm.includes('moto') || norm.includes('veículo') || iconName === 'Car') {
    return <Car className="w-5 h-5" />;
  }
  if (norm.includes('pet') || norm.includes('agro') || iconName === 'PawPrint') {
    return <PawPrint className="w-5 h-5" />;
  }

  switch (iconName) {
    case 'Hammer':
      return <Hammer className="w-5 h-5" />;
    case 'ShoppingCart':
      return <ShoppingCart className="w-5 h-5" />;
    case 'Smartphone':
      return <Smartphone className="w-5 h-5" />;
    case 'Shirt':
      return <Shirt className="w-5 h-5" />;
    case 'Home':
      return <HomeIcon className="w-5 h-5" />;
    case 'HeartPulse':
      return <HeartPulse className="w-5 h-5" />;
    case 'Car':
      return <Car className="w-5 h-5" />;
    case 'PawPrint':
      return <PawPrint className="w-5 h-5" />;
    default:
      return <StoreIcon className="w-5 h-5" />;
  }
}

export const CategoryBubbles: React.FC<CategoryBubblesProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  className = '',
  showAllOption = true
}) => {
  const isSelected = (cat: CategoryBubbleItem) => {
    if (!selectedCategory) return false;
    return (
      selectedCategory.toLowerCase() === cat.name.toLowerCase() ||
      selectedCategory.toLowerCase() === cat.slug.toLowerCase() ||
      selectedCategory.toLowerCase() === cat.id.toLowerCase()
    );
  };

  const isAllSelected = !selectedCategory;

  return (
    <div className={`w-full ${className}`}>
      {/* Scrollable category cards container */}
      <div className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-slate-200 px-0.5 snap-x no-scrollbar">
        {/* 'Todas as Categorias' Option */}
        {showAllOption && (
          <button
            type="button"
            onClick={() => onSelectCategory(null)}
            className={`group shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl transition-all duration-200 cursor-pointer snap-start border text-xs font-bold ${
              isAllSelected
                ? 'bg-slate-900 border-slate-900 text-amber-400 shadow-md ring-2 ring-amber-400/40'
                : 'bg-white border-slate-200 text-slate-700 hover:border-amber-400 hover:text-slate-900'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                isAllSelected ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-100 text-slate-600 group-hover:bg-amber-100 group-hover:text-amber-800'
              }`}
            >
              <Layers className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="block leading-tight">Todas as Lojas</span>
              <span className={`text-[10px] ${isAllSelected ? 'text-amber-300' : 'text-slate-400'}`}>
                Ver tudo
              </span>
            </div>
          </button>
        )}

        {/* Dynamic Category Cards */}
        {categories.map(cat => {
          const active = isSelected(cat);
          const count = cat.storeCount ?? 0;

          return (
            <button
              key={cat.id || cat.slug}
              type="button"
              onClick={() => onSelectCategory(active ? null : cat)}
              className={`group shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl transition-all duration-200 cursor-pointer snap-start border text-xs font-bold ${
                active
                  ? 'bg-slate-900 border-slate-900 text-amber-400 shadow-md ring-2 ring-amber-400/40 scale-102'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-amber-400 hover:text-slate-900'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                  active ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-100 text-slate-600 group-hover:bg-amber-100 group-hover:text-amber-800'
                }`}
              >
                {renderCategoryIcon(cat.icon, cat.name)}
              </div>
              <div className="text-left">
                <span className="block leading-tight">{cat.name}</span>
                <span className={`text-[10px] ${active ? 'text-amber-300' : 'text-slate-400'}`}>
                  {count} {count === 1 ? 'loja' : 'lojas'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Also export as CategoriesBar alias
export const CategoriesBar = CategoryBubbles;
