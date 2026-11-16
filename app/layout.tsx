import '@/app/ui/global.css'
import { inter } from '@/app/ui/fonts';
import NavLinks from '@/app/ui/dashboard/nav-links';
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        {/* <div>
          <NavLinks />
        </div> */}
        {children}
      </body>
    </html>
  );
}
