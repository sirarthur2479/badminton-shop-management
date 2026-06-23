import { createContext, useContext } from 'react'

const InquiryContext = createContext(null)

export function InquiryProvider({ children }) {
  return <InquiryContext.Provider value={null}>{children}</InquiryContext.Provider>
}

export function useInquiry() {
  return useContext(InquiryContext)
}
