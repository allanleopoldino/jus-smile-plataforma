import './globals.css';
import { ErrorProvider } from '@/context/ErrorContext';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'Jus Smile',
  description: 'Plataforma de documentos para dentistas',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <ErrorProvider>
          {children}
          {/* componente Toaster aqui */}
          <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        </ErrorProvider>
      </body>
    </html>
  );
}