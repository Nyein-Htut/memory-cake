import "./globals.css";

export const metadata = {
  title: "Memory Cake",
  description: "A sweet place to keep your memories.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-cream text-cocoa-900 antialiased">
        {children}
      </body>
    </html>
  );
}
