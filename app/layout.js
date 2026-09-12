import './globals.css';

export const metadata = {
  metadataBase: new URL('https://ghost-stories-society.vercel.app'),
  title: { default:'Ghost Stories Society', template:'%s · Ghost Stories Society' },
  description: 'A quietly unsettling library of fiction by Doctor — mystery, romance, horror, suspense and strange stories.',
  openGraph: { title:'Ghost Stories Society', description:'Come closer. There is always another story.', siteName:'Ghost Stories Society', type:'website' },
  twitter: { card:'summary_large_image', title:'Ghost Stories Society', description:'Come closer. There is always another story.' }
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
