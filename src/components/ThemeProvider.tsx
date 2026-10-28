"use client";

import Script from "next/script";

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
      <Script id="theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeScript }} />
      {children}
    </>
  );
}
