import React from 'react'
import { Box } from '@mui/material'
import { useTranslate } from '@tolgee/react'

import { useUIStore } from '#/common/store'
import {  PlanConfWithReportData
} from 'applets/hiilikartta/common/types'
import { processReportDataToCalcQuery } from '../../app/(ui)/(applets)/(hiilikartta)/common/utils'


type Props = {
  planConfs: PlanConfWithReportData[],
  children: React.ReactNode
  onSuccessText?: string
  onFailText?: string
  disabled?: boolean
}

const DownloadResultsWrapper = ({
  planConfs,
  children,
  onSuccessText,
  onFailText,
  disabled,
}: Props) => {
  const { t } = useTranslate('avoin-map')
  const notify = useUIStore((state) => state.notify)

  const downloadResults = async () => {
    
    try {
      planConfs.forEach((planConf) => {
        const CalcQueryGeoJSON = processReportDataToCalcQuery(planConf.reportData)
        const json = JSON.stringify(CalcQueryGeoJSON, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = planConf.name + ".geojson"
        a.click()
        URL.revokeObjectURL(url)
      })
    } catch (err) {
      const text = onFailText || t('general.messages.download_fail')
      notify({ message: text, variant: 'error' })
      let message
      if (err instanceof Error) message = err.message
      else message = String(err)
      notify({ message: message, variant: 'error' })
    }
  }

  return <Box onClick={downloadResults}>{children}</Box>
}

export default DownloadResultsWrapper
