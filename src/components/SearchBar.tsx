'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, MapPin, Grid, ArrowRight } from 'lucide-react';

interface SearchBarProps {
  categories?: Array<{ id: string; name: string; slug: string }>;
  initialSearch?: string;
  initialCategory?: string;
  initialCity?: string;
}

export function SearchBar({
  categories = [],
  initialSearch = '',
  initialCategory = '',
  initialCity = '',
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [city, setCity] = useState(initialCity);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();

    if (query.trim()) params.set('q', query.trim());
    if (category) params.set('categoria', category);
    if (city.trim()) params.set('cidade', city.trim());

    router.push(`/?${params.toString()}#prestadores`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className="bg-white p-3 sm:p-4 rounded-2xl shadow-xl border border-amber-200/90 max-w-4xl mx-auto -mt-8 relative z-20"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Campo de Palavra-chave */}
        <div className="md:col-span-5 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4 text-amber-500" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Qual serviço ou empresa você procura?"
            className="w-full pl-10 pr-3 py-3 text-sm rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all font-medium"
          />
        </div>

        {/* Seletor de Categoria */}
        <div className="md:col-span-3 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Grid className="w-4 h-4 text-amber-500" />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full pl-10 pr-8 py-3 text-sm rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all font-medium appearance-none cursor-pointer"
          >
            <option value="">Todas as categorias</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Campo de Cidade */}
        <div className="md:col-span-2 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <MapPin className="w-4 h-4 text-amber-500" />
          </div>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Cidade (ex: SP)"
            className="w-full pl-10 pr-3 py-3 text-sm rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all font-medium"
          />
        </div>

        {/* Botão Buscar */}
        <div className="md:col-span-2">
          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <span>Buscar</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </form>
  );
}
