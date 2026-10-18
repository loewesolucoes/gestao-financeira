"use client";
import { useState } from 'react';
import { useTheme } from '../contexts/theme';
import { useEnv } from '../contexts/env';

export function ThemeSelector() {
  const [show, setShow] = useState(false);
  const { theme, setTheme } = useTheme();
  const { isMobile } = useEnv();

  return <li className="nav-item dropdown not-link">
    <button type='button' className={`nav-link dropdown-toggle ${show ? 'show' : ''}`} role="button" data-bs-toggle="dropdown" aria-expanded="false" onClick={() => setShow(!show)} title='Altere o tema da aplicação'>
      {isMobile ? 'Alterar tema' : 'Escolher tema'}
    </button>
    <ul className={`dropdown-menu m-3 ${show ? 'show' : ''}`}>
      <li><button type="button" className={`dropdown-item ${theme === 'system' ? 'active' : ''}`} onClick={() => { setTheme('system'); setShow(false); }}>Auto</button></li>
      <li><button type="button" className={`dropdown-item ${theme === 'light' ? 'active' : ''}`} onClick={() => { setTheme('light'); setShow(false); }}>Claro</button></li>
      <li><button type="button" className={`dropdown-item ${theme === 'dark' ? 'active' : ''}`} onClick={() => { setTheme('dark'); setShow(false); }}>Escuro</button></li>
    </ul>
  </li>;
}
