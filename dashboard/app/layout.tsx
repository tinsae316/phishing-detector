export const metadata = {
  title: "Phishing Admin",
  description: "Admin dashboard for phishing URL detection system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'Inter, system-ui, Arial', margin: 0 }}>
        {children}
      </body>
    </html>
  );
}


