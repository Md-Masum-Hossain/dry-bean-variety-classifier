import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dry Bean Variety Classification & Analytics Platform',
  description:
    'Industrial-grade machine learning platform for classifying 7 dry bean cultivars using 16 geometric features.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased bg-slate-950 text-slate-100 transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
