import "./globals.css";

export const metadata = {
  title: "MediSafe · Medication safety",
  description: "Understand medication interactions and prescription safety.",
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
