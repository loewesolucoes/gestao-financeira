"use client";
import { useTheme } from '../contexts/theme';

const options = [['system', 'Auto'], ['light', 'Claro'], ['dark', 'Escuro']] as const;

// Segmented control (design system Tabs): one tap per theme instead of a dropdown.
export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="ps-tabs theme-tabs" role="tablist" aria-label="Tema da aplicação">
      {options.map(([value, label]) => (
        <button key={value} type="button" role="tab" className="ps-tab" aria-selected={theme === value} onClick={() => setTheme(value)}>
          {label}
        </button>
      ))}
    </div>
  );
}
