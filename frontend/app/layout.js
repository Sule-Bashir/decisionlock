import "./globals.css";

export const metadata = {
  title: "DecisionLock AI",
  description: "AI project memory firewall"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
