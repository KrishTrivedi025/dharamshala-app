/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react'
import en from '../i18n/en'
import hi from '../i18n/hi'
import mr from '../i18n/mr'

const languages = { en, hi, mr }

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en')

  const t = languages[language]

  const changeLanguage = (lang) => {
    setLanguage(lang)
  }

  return (
    <LanguageContext.Provider value={{ t, language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}