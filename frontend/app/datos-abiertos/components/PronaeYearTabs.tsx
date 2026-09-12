'use client';

interface PronaeYearTabsProps {
  years: number[];
  selected: number | undefined;
  onSelect: (anio: number) => void;
}

export function PronaeYearTabs({ years, selected, onSelect }: PronaeYearTabsProps) {
  return (
    <div className="flex w-fit gap-1 rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
      {years.map((year) => (
        <button
          key={year}
          type="button"
          onClick={() => onSelect(year)}
          className={`rounded-lg px-3 py-1.5 text-sm ${
            selected === year
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
              : 'text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
          }`}
        >
          {year}
        </button>
      ))}
    </div>
  );
}
