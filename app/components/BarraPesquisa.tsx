"use client";

import Image from "next/image";
import { type ChangeEvent, type FormEvent } from "react";

export interface BarraPesquisaProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export default function BarraPesquisa({
  id = "barra-pesquisa-input",
  value,
  onChange,
  onSubmit,
  placeholder = "Procurar por...",
  className = "",
  autoFocus = false,
}: BarraPesquisaProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (onSubmit) {
      onSubmit();
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value);
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={`bg-white rounded-full flex items-center w-full max-w-3xl px-6 py-3 shadow-md border border-transparent focus-within:border-purple-300 focus-within:shadow-lg transition-all ${className}`}
    >
      <label htmlFor={id} className="sr-only">
        {placeholder}
      </label>
      <input
        id={id}
        type="search"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="flex-grow outline-none text-gray-700 placeholder-[#B8A3F2] font-normal text-sm md:text-base bg-transparent"
      />
      <button
        type="submit"
        aria-label="Buscar"
        className="flex-shrink-0 ml-3 p-1 rounded-full hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-purple-400"
      >
        <Image
          src="/lojas/lupa.svg"
          alt="Ícone de busca"
          width={22}
          height={22}
          className="object-contain"
        />
      </button>
    </form>
  );
}
