import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'VedaAI – AI Assessment Creator',
  description: 'AI-powered assessment and academic intelligence system',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const baseUrl = apiUrl.replace('/api', '');

  return (
    <html lang="en">
      <body className="bg-[#F5F5F5] min-h-screen">
        {/* Wake up Render backend on page load */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                fetch('${baseUrl}/api/health', { method: 'GET' }).catch(function(){});
              } catch(e) {}
            `,
          }}
        />

        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col min-h-screen lg:min-h-0 overflow-hidden">
            {children}
          </div>
        </div>

        <MobileNav />

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1A1A1A',
              color: '#fff',
              fontSize: '13px',
              borderRadius: '10px',
              padding: '10px 14px',
            },
            success: { iconTheme: { primary: '#E8520A', secondary: '#fff' } },
            error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  );
}
