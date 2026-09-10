import './globals.css';

export const metadata = {
  title: 'David Writes',
  description: 'Stories from other versions.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
