'use client'

import '#/common/style/index.css'

import React, { useEffect, useState } from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { Box } from '@mui/material'
import {
  Tolgee,
  DevTools,
  TolgeeProvider,
  FormatSimple,
  TreeTranslationsData,
} from '@tolgee/react'
import { QueryClientProvider } from '@tanstack/react-query'

import theme from '#/common/style/theme'
import { queryClient } from '#/common/queries/queryClient'
import { Sidebar } from '#/components/Sidebar'
import { NavBar } from '#/components/NavBar'
import { Map } from '#/components/Map'
import { LoginModal } from '#/components/Modal'
// import { UserModal } from '#/components/Profile'
// import { UiStateProvider, UserStateProvider } from '#/components/State'
// import RootStyleRegistry from './emotion'

const loadTranslation = async (
  ns: string,
  lang: string
): Promise<TreeTranslationsData> => {
  try {
    const module = await import(`#/i18n/${ns}/${lang}.json`)
    return module.default as TreeTranslationsData
  } catch (error) {
    console.error(`Failed to load ${lang}:${ns} translations`, error)
    return {} // Return a fallback or an empty object as needed
  }
}

const tolgee = Tolgee()
  .use(DevTools())
  .use(FormatSimple())
  .init({
    language: 'en',
    defaultNs: 'avoin-map',
    apiUrl: process.env.NEXT_PUBLIC_TOLGEE_API_URL,
    apiKey: process.env.NEXT_PUBLIC_TOLGEE_API_KEY,
    staticData: {
      'en:avoin-map': () => loadTranslation('avoin-map', 'en'),
      'fi:hiilikartta': () => loadTranslation('hiilikartta', 'fi'),
      // Add more translations as needed
    },
  })

const Layout = ({
  // Layouts must accept a children prop.
  // This will be populated with nested layouts or pages
  children,
}: {
  children: React.ReactNode
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        {/* <UserStateProvider> */}
        <CssBaseline>
          <TolgeeProvider
            tolgee={tolgee}
            fallback="" // loading fallback
          >
            <Map>
              {/* <UserModal /> */}
              <Box
                className="layout-container"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100vh',
                  width: '100vw',
                  zIndex: 'drawer',
                }}
              >
                <Sidebar>{children}</Sidebar>
                <NavBar />
              </Box>
              <LoginModal></LoginModal>
            </Map>
          </TolgeeProvider>
        </CssBaseline>
        {/* </UserStateProvider> */}
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default Layout
