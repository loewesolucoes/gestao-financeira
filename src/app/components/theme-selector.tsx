"use client";
import { useState } from 'react';
import { useTheme } from '../contexts/theme';

export function ThemeSelector() {
  const [show, setShow] = useState(false);
  const { setTheme } = useTheme();

  return <li className="nav-item dropdown">
    <button type='button' className={`nav-link dropdown-toggle ${show ? 'show' : ''}`} role="button" data-bs-toggle="dropdown" aria-expanded="false" onClick={() => setShow(!show)}>
      🌗
    </button>
    <ul className={`dropdown-menu m-3 ${show ? 'show' : ''}`}>
      <li><button type="button" className="dropdown-item" onClick={() => { setTheme('system'); setShow(false); }}>🌓 Auto</button></li>
      <li><button type="button" className="dropdown-item" onClick={() => { setTheme('light'); setShow(false); }}>🌞 Light</button></li>
      <li><button type="button" className="dropdown-item" onClick={() => { setTheme('dark'); setShow(false); }}>🌜 Dark</button></li>
    </ul>
  </li>;
}
