import "./globals.css";
export const metadata = {
  title: "Jus Smile",
  description: "Plataforma de documentos para dentistas",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}