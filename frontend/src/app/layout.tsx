import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/hooks/useAuth';

export const metadata: Metadata = {
  title: {
    default: 'TreckWari – Adventure Trekking & Expedition Platform',
    template: '%s | TreckWari'
  },
  description: 'Join TreckWari for unforgettable trekking, camping, and nature explorations across Maharashtra and beyond. Conducted under certified leadership and safety guidelines.',
  keywords: ['Trekking', 'Maharashtra Trekking', 'Kalsubai Trek', 'Adrai Jungle Trek', 'Adventure Tours', 'Camping India'],
  authors: [{ name: 'Atharva Dhawale' }],
  creator: 'TreckWari',
  publisher: 'TreckWari',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'TreckWari – Adventure Trekking & Expedition Platform',
    description: 'Explore Maharashtra\'s highest peaks and dense forest trails with certified leaders. Safe, professional, and lifetime outdoor memories.',
    url: 'https://treckwari.com',
    siteName: 'TreckWari',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: '/images/kalsubai_2.jpg',
        width: 1200,
        height: 630,
        alt: 'TreckWari Adventure Peak Sunrise'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TreckWari – Adventure Trekking & Expedition Platform',
    description: 'Explore Maharashtra\'s highest peaks and dense forest trails with certified leaders.',
    images: ['/images/kalsubai_2.jpg']
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    }
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png'
  }
};

export const viewport: Viewport = {
  themeColor: '#14532D',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
