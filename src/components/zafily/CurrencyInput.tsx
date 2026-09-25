"use client";

import { useState } from "react";

function centsFromValue(value: number | null): string {
  if (value == null) return "";
  return Math.round(value * 100).toString();
}

function formatDigits(digits: string): string {
  if (!digits) return "";
  return (Number(digits) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function CurrencyInput({
  defaultValue,
  onChange,
  className,
  placeholder = "0,00",
}: {
  defaultValue: number | null;
  onChange: (value: number | null) => void;
  className?: string;
  placeholder?: string;
}) {
  const [digits, setDigits] = useState(() => centsFromValue(defaultValue));

  function handleChange(raw: string) {
    const next = raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
    setDigits(next);
    onChange(next ? Number(next) / 100 : null);
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      value={formatDigits(digits)}
      onChange={e => handleChange(e.target.value)}
      placeholder={placeholder}
      className={className}
    />
  );
}
