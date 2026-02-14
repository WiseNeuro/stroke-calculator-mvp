import "./globals.css";
export const metadata = {
  title: "Stroke Eligible? (Web MVP)",
  description: "Rule-based stroke triage decision support",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}