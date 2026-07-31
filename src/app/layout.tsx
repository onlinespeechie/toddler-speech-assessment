import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Online Speechie Assessment",
  description: "Late Talker Speech Assessment Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('set', 'autoConfig', false, '320483099619378');
              fbq('init', '320483099619378');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=320483099619378&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
      </head>
      <body style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

