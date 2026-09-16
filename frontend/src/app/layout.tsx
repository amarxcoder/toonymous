import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { AuthProvider } from "@/lib/AuthContext";
import { THEME_INIT_SCRIPT, ThemeProvider } from "@/lib/ThemeContext";
import { ToastProvider } from "@/lib/ToastContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Toonymous",
  description: "Post anonymously. Every image becomes a cartoon.",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the inline script below sets data-theme on
    // this element before React hydrates, which is expected to differ from
    // the server-rendered markup (see THEME_INIT_SCRIPT in ThemeContext.tsx).
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        {/* Sets data-theme before first paint so there's no flash of the
            wrong accent palette (see THEME_INIT_SCRIPT in ThemeContext.tsx). */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-bg-base text-text-primary">
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <AppShell>{children}</AppShell>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
