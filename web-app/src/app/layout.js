import './globals.css';

export const metadata = {
  title: 'Eventopia Organizer',
  description: 'Organizer portal',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
