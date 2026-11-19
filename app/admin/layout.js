export const metadata = {
  title: "Memory Cake Admin",
  manifest: "/admin-manifest.json",
  appleWebApp: {
    capable: true,
    title: "MC Admin",
    statusBarStyle: "default",
  },
};

export default function AdminLayout({ children }) {
  return children;
}
