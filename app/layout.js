import './globals.css';
import { Fraunces, Source_Serif_4, Inter } from 'next/font/google';

const fraunces=Fraunces({subsets:['latin'],variable:'--font-fraunces',display:'swap'});
const sourceSerif=Source_Serif_4({subsets:['latin'],variable:'--font-source-serif',display:'swap'});
const inter=Inter({subsets:['latin'],variable:'--font-inter',display:'swap'});

export const metadata = {
  metadataBase: new URL('https://david-writes.vercel.app'),
  title: { default:'David Writes — Where Stories Breathe', template:'%s · David Writes' },
  description: 'A living library of fiction, fragments and books by David.',
  openGraph: { title:'David Writes', description:'Where stories breathe.', siteName:'David Writes', type:'website' },
  twitter: { card:'summary_large_image', title:'David Writes', description:'Where stories breathe.' }
};

export default function RootLayout({ children }) {
  return <html lang="en" className={`${fraunces.variable} ${sourceSerif.variable} ${inter.variable}`}><body>{children}</body></html>;
}