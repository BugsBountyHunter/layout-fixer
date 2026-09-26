import { createContext, type ReactNode, useContext, useEffect } from 'react'
import { EN, type Messages } from './en'
import { directionOf, type Language, messagesFor } from './index'

const MessagesContext = createContext<Messages>(EN)

export function useMessages(): Messages {
  return useContext(MessagesContext)
}

/** Provides the strings and sets the page language and direction (RTL for Arabic). */
export function I18nProvider({ language, children }: { readonly language: Language; readonly children: ReactNode }) {
  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = directionOf(language)
  }, [language])
  return <MessagesContext.Provider value={messagesFor(language)}>{children}</MessagesContext.Provider>
}
