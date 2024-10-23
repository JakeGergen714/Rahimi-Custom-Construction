import localFont from 'next/font/local';
import { Raleway } from 'next/font/google';

import './globals.css';

const raleway = Raleway({
  subsets: ['latin'],
  weight: ['400', '600'],
});

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata = {
  title: 'Rahimi Custom Construction',
  description:
    'Where craftsmanship meets creativity | Custom Shelves | Custom Cabinets | Custom Decks | Custom Stairs',
};

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <body className={`${raleway.className} antialiased`}>{children}</body>
    </html>
  );
}
