import "./globals.css";
import PushPrompt from "@/components/PushPrompt";

export const metadata = {
  title: "Memory Cake",
  description: "A sweet place to keep your memories.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    title: "Memory Cake",
    statusBarStyle: "default",
  },
};

export const viewport = {
  themeColor: "#3f2f24",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-cream text-cocoa-900 antialiased">
        {children}
        <PushPrompt />
      </body>
    </html>
  );
}
