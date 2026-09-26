import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { RootDocument } from '@/components/RootDocument'
import { pageMetadata } from '@/lib/i18n'

export const metadata: Metadata = pageMetadata('en')

export default function EnglishLayout({ children }: { children: ReactNode }) {
  return <RootDocument locale="en">{children}</RootDocument>
}
