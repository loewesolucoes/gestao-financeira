"use client";
import { useState } from 'react';
import { useTheme } from '../contexts/theme';
import { useEnv } from '../contexts/env';

export function ThemeSelector() {
  const [show, setShow] = useState(false);
  const { setTheme } = useTheme();
  const { isMobile } = useEnv();

  return <li className="nav-item dropdown">
    <button type='button' className={`nav-link dropdown-toggle ${show ? 'show' : ''}`} role="button" data-bs-toggle="dropdown" aria-expanded="false" onClick={() => setShow(!show)}>
      {isMobile ? 'Trocar estilo ' : ''}
      🌗
    </button>
    <ul className={`dropdown-menu m-3 ${show ? 'show' : ''}`}>
      <li><button type="button" className="dropdown-item" onClick={() => { setTheme('system'); setShow(false); }}>🌓 Auto</button></li>
      <li><button type="button" className="dropdown-item" onClick={() => { setTheme('light'); setShow(false); }}>🌞 Light</button></li>
      <li><button type="button" className="dropdown-item" onClick={() => { setTheme('dark'); setShow(false); }}>🌚 Dark</button></li>
    </ul>
  </li>;
}
