import type { Metadata } from "next";
import { League_Spartan } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";

const leagueSpartan = League_Spartan({
  variable: "--font-league-spartan",
  subsets: ["latin"],
  weight: ["300", "500", "600", "800"],
});

export const metadata: Metadata = {
  title: "STOCK.IO",
  description: "Acesse sua conta no STOCK.IO.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${leagueSpartan.variable} h-full antialiased`}
    >
      <body className={`${leagueSpartan.className} min-h-full flex flex-col`}>
        <Navbar /> 
        
        <main className="flex-grow"> 
          {children}
        </main>
      </body>
    </html>
  );
}