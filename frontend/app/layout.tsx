import "../globals.css";
import { Toaster } from "react-hot-toast";
import StagewiseWrapper from "../components/ui/StagewiseWrapper";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900">
        {children}
        <Toaster position="top-center" />
        <StagewiseWrapper />
      </body>
    </html>
  );
} 