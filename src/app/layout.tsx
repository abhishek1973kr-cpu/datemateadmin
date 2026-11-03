import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "DateMate – Master Admin Panel",
  description: "Enterprise Executive Administration Portal for DateMate India",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-white min-h-screen antialiased text-slate-900 selection:bg-purple-100 selection:text-purple-900">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

