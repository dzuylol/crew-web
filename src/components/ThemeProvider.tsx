"use client";

import { useEffect } from "react";

// Inline script runs before paint to avoid flash of wrong theme
const themeScript = `
(function() {
  try {
    var t = localStorage.getItem('theme');
    if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  } catch(e) {}
})();
`;

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      {children}
    </>
  );
}
