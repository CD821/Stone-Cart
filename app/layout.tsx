import type { Metadata } from "next";
import ClerkAuthProvider from "./components/ClerkAuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "StoneCart | Cart accountability",
  description:
    "A responsive operations app for tracking stone carts, installer accountability, exact returns, and audit history.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ClerkAuthProvider>{children}</ClerkAuthProvider>
      </body>
    </html>
  );
}
