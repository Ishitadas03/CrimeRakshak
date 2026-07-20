import {ClerkProvider} from "@clerk/nextjs";
import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono, Dancing_Script, Playfair_Display } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/components/LanguageContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const dancingScript = Dancing_Script({
  variable: "--font-cursive",
  subsets: ["latin"],
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CrimeRakshak AI 2.0 — Smart Policing Platform | Karnataka",
  description:
    "AI-Powered Crime Intelligence Platform for Smart Cities, Law Enforcement, and Public Safety. Predicting crime before it happens.",
  openGraph: {
    title: "CrimeRakshak AI 2.0 — Smart Policing Platform | Karnataka",
    description:
      "AI-Powered Crime Intelligence Platform for Smart Cities, Law Enforcement, and Public Safety.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html
        lang="en"
        className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${dancingScript.variable} ${playfairDisplay.variable} h-full antialiased`}
        suppressHydrationWarning
      >
      <body className="min-h-full bg-background text-foreground">
        <ClerkProvider>
          <ThemeProvider
          attribute="class"
          defaultTheme="light"
          storageKey="crime-rakshak-theme-v2"
          enableSystem={false}
          disableTransitionOnChange
          >
          <LanguageProvider>
          {children}
          </LanguageProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}