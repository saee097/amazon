import "./globals.css";
import { Poppins } from "next/font/google";
import ClientShell from "@/components/ClientShell";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900 font-poppins antialiased min-h-screen flex flex-col">
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
