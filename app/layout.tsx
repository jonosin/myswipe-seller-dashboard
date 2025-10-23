import "../styles/globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Toaster } from "@/components/toast";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";
import AuthGate from "@/components/auth-gate";

export const metadata: Metadata = {
  title: "Myswipe Seller Dashboard",
  description: "UI-only mock dashboard for Myswipe sellers",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-neutral-900">
        <a href="#content" className="skip-to-content">Skip to content</a>
        <div className="min-h-screen">
          <Topbar />
          <div className="flex">
            <Sidebar />
            <main id="content" className="flex-1 p-4 sm:p-6 lg:p-8" role="main" aria-label="Main content">
              <AuthGate>
                {children}
              </AuthGate>
            </main>
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
