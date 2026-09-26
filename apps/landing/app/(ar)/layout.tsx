import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { RootDocument } from '@/components/RootDocument'
import { pageMetadata } from '@/lib/i18n'

export const metadata: Metadata = pageMetadata('ar')

export default function ArabicLayout({ children }: { children: ReactNode }) {
  return <RootDocument locale="ar">{children}</RootDocument>
}
