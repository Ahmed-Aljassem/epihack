import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="description" content="Community-powered One Health reporting for Arizona." />
        <meta name="theme-color" content="#0B6623" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="OneHealth" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <title>OneHealth Arizona</title>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/png" sizes="192x192" href="/logo192.png" />
        <link rel="apple-touch-icon" href="/logo192.png" />
        <script dangerouslySetInnerHTML={{ __html: sw }} />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}

const sw = `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('Service worker registration failed:', error);
    });
  });
}
`;
