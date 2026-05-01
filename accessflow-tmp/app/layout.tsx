import type { Metadata } from 'next'
import { DM_Sans, IBM_Plex_Mono } from 'next/font/google'
import { Nav } from '@/components/Nav'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  title: 'AccessFlow — Access Decision Assistant',
  description: 'Accessibility triage for university digital accessibility offices. Not a scanner. A decision layer.',
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${ibmPlexMono.variable}`}>
      <head>
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('accessflow_theme');if(t==='dark'||(t===null&&window.matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className="bg-[#f7f6f2] dark:bg-[#111110] text-[#111110] dark:text-[#ededea] antialiased"
        suppressHydrationWarning
      >
        <Nav />
        {children}
      </body>
    </html>
  )
}
