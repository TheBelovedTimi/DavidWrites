import './globals.css';

export const metadata = {
  metadataBase: new URL('https://david-writes.vercel.app'),
  title: { default:'David Writes', template:'%s · David Writes' },
  description: 'A living library of fiction, fragments and books by David.',
  openGraph: { title:'David Writes', description:'Stories from other versions.', siteName:'David Writes', type:'website' },
  twitter: { card:'summary_large_image', title:'David Writes', description:'Stories from other versions.' }
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
