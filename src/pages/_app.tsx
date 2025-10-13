import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { Toaster } from '../components/ui/toaster';
import { Toaster as Sonner } from 'sonner';
import { Analytics } from '@vercel/analytics/react';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <Toaster />
      <Sonner />
      <Analytics />
    </>
  );
}