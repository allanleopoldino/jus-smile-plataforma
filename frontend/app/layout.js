import './globals.css';
import { ErrorProvider } from '@/context/ErrorContext';

export const metadata = {
  title: 'Jus Smile',
  description: 'Plataforma de documentos para dentistas',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        {/* 2. Envolva os 'children' com o ErrorProvider */}
        <ErrorProvider>
          {children}
        </ErrorProvider>
      </body>
    </html>
  );
}