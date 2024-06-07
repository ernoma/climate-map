'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Box, Typography } from '@mui/material'
import { useRouter } from 'next/navigation'
import { styled } from '@mui/material/styles'
// import SettingsIcon from '@mui/icons-material/Settings'
// import MuiLink from '@mui/material/Link'
// import Link from 'next/link'
import { T, useTranslate } from '@tolgee/react'
import { useMutation } from '@tanstack/react-query'
import FolderCopy from '@mui/icons-material/FolderCopyOutlined'
import Tooltip from '@mui/material/Tooltip'

import { getRoute } from '#/common/utils/routing-client'
import useStore from '#/common/hooks/useStore'
import { useUIStore } from '#/common/store'
import DropDownSelectMinimal from '#/components/common/DropDownSelectMinimal'
import { pp } from '#/common/utils/general'
import {
  SCROLLBAR_WIDTH_REM,
  SIDEBAR_PADDING_REM,
  SIDEBAR_PADDING_WITH_SCROLLBAR_REM,
} from '#/common/style/theme/constants'
import { ArrowNextBig, Delete, Star } from '#/components/icons'

import { useAppletStore } from '#/app/[locale]/(map)/(applets)/hiilikartta/state/appletStore'
import { routeTree } from '#/app/[locale]/(map)/(applets)/hiilikartta/common/routes'
import { checkIsValidZoningCode } from '#/app/[locale]/(map)/(applets)/hiilikartta/common/utils'
import ZoneAccordion from './_components/ZoneAccordion'
import { calcPostMutation } from '#/app/[locale]/(map)/(applets)/hiilikartta/common/queries/calcPostMutation'
import PlanFolder from '#/app/[locale]/(map)/(applets)/hiilikartta/components/PlanFolder'
import {
  CalculationState,
  GlobalState,
  PlanConfState,
} from '#/app/[locale]/(map)/(applets)/hiilikartta/common/types'
import { planDeleteMutation } from '#/app/[locale]/(map)/(applets)/hiilikartta/common/queries/planDeleteMutation'
import { LoadingSpinner } from '#/components/Loading'

const Page = ({ params }: { params: { planIdSlug: string } }) => {
  const triggerConfirmationDialog = useUIStore(
    (state) => state.triggerConfirmationDialog
  )
  const notify = useUIStore((state) => state.notify)
  const planConf = useStore(
    useAppletStore,
    (state) => state.planConfs[params.planIdSlug]
  )
  const globalState = useAppletStore((state) => state.globalState)
  const updatePlanConf = useAppletStore((state) => state.updatePlanConf)
  const placeholderPlanConfs = useAppletStore(
    (state) => state.placeholderPlanConfs
  )
  const copyPlanConf = useAppletStore((state) => state.copyPlanConf)
  const calcPost = useMutation(calcPostMutation())
  const planDelete = useMutation(planDeleteMutation())
  const [currentYear, setCurrentYear] = useState<string>()
  const [areSettingsValid, setAreSettingsValid] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const router = useRouter()
  const { t } = useTranslate('hiilikartta')

  const hasNoFeatures = useMemo(() => {
    if (planConf?.data?.features != null) {
      return planConf.data.features.length === 0
    }
    return true
  }, [planConf?.data?.features])

  useEffect(() => {
    if (planConf?.data.features) {
      for (const feature of planConf.data.features) {
        if (!checkIsValidZoningCode(feature.properties.zoning_code)) {
          if (areSettingsValid) {
            setAreSettingsValid(false)
          }
          return
        }
      }
      setAreSettingsValid(true)
    }
  }, [planConf?.data.features])

  const handleSubmit = async () => {
    if (planConf) {
      calcPost.mutate(planConf)

      if (planConf.reportData != null) {
        updatePlanConf(planConf.id, { reportData: undefined })
      }

      // Download plan as JSON. A feature to be added later.
      // const jsonString = JSON.stringify(planConf, null, 2)

      // // Create a Blob from the JSON string
      // const blob = new Blob([jsonString], { type: 'application/json' })

      // // Create a URL for the Blob
      // const url = URL.createObjectURL(blob)

      // // Create a temporary anchor element and set the necessary attributes
      // const a = document.createElement('a')
      // a.href = url
      // a.download = planConf.name + '.json'
      // document.body.appendChild(a) // Append the anchor to the body

      // // Programmatically click the anchor to trigger the download
      // a.click()

      // // Clean up by removing the anchor and revoking the Blob URL
      // document.body.removeChild(a)
      // URL.revokeObjectURL(url)
    }
  }

  const handleOpenReport = async () => {
    if (planConf) {
      const route = getRoute(routeTree.report, routeTree, {
        queryParams: {
          planIds: planConf.serverId,
          prevPageId: params.planIdSlug,
        },
      })
      router.push(route)
    }
  }

  const handleDeleteClick = async () => {
    if (planConf) {
      const handleDeleteConfirm = async () => {
        await planDelete.mutate(planConf)
      }

      triggerConfirmationDialog({
        content: t('sidebar.plan_settings.delete_confirmation_message'),
        onConfirm: handleDeleteConfirm,
      })
    }
  }

  useEffect(() => {
    if (planDelete.isSuccess) {
      router.push(getRoute(routeTree, routeTree))
    }
    if (planDelete.isError) {
      notify({
        message: t('sidebar.plan_settings.delete_error'),
        variant: 'error',
      })
    }
  }, [planDelete.isError, planDelete.isSuccess])

  const handleCopyClick = async () => {
    if (planConf) {
      const { id } = await copyPlanConf(
        planConf.id,
        t('sidebar.plan_settings.copy_suffix')
      )
      router.push(
        getRoute(routeTree.plans.plan, routeTree, {
          routeParams: { planId: id },
        })
      )
    }
  }

  useEffect(() => {
    if (planConf === undefined) {
      if (
        globalState === GlobalState.FETCHING &&
        !Object.keys(placeholderPlanConfs).includes(params.planIdSlug)
      ) {
        router.push(getRoute(routeTree, routeTree))
      } else if (globalState === GlobalState.IDLE) {
        router.push(getRoute(routeTree, routeTree))
      }
    } else {
      if (GlobalState.IDLE && planConf?.isHidden) {
        router.push(getRoute(routeTree, routeTree))
      } else {
        if (planConf?.reportData) {
          setCurrentYear(planConf.reportData.metadata.featureYears[1])
        }
        if (
          planConf?.state == null ||
          [PlanConfState.IDLE, PlanConfState.SAVING].includes(planConf?.state)
        ) {
          setIsLoaded(true)
          return
        }
      }
    }
    setIsLoaded(false)
  }, [planConf, globalState])

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
      }}
      className={'plan-sidebar-container'}
    >
      {isLoaded && planConf && (
        <>
          <Box
            sx={{
              overflowY: 'scroll',
              direction: 'rtl',
              display: 'flex',
              flexGrow: 1,
              flexDirection: 'column',
            }}
          >
            <Box
              sx={{
                direction: 'ltr',
                overflow: 'visible',
                p: SIDEBAR_PADDING_REM + 'rem',
                mr: SCROLLBAR_WIDTH_REM + 'rem',
              }}
            >
              <PlanFolder
                isNameEditable={true}
                planConf={planConf}
                height={90}
              />

              {/* <MuiLink
            href={getRoute(routeTree.plans.plan.settings, routeTree, [planConf.id])}
            sx={{ display: 'flex', color: 'inherit', textDecoration: 'none' }}
            component={Link}
            >
            <MenuButton sx={{ margin: '25px 0 0 0' }} variant="outlined">
            Kaavatiedoston asetukset <SettingsIcon />
            </MenuButton>
          </MuiLink> */}
              {!planConf.reportData && (
                <Box sx={{ display: 'flex', flexDirection: 'row', mt: 10 }}>
                  <Star sx={{ height: 40, width: 'auto' }}></Star>
                  <Typography
                    sx={{
                      display: 'inline-flex',
                      typography: 'body2',
                      ml: 1.5,
                      mt: 0.5,
                    }}
                  >
                    <T
                      keyName={'sidebar.plan_settings.draw_hint'}
                      ns="hiilikartta"
                    ></T>
                  </Typography>
                </Box>
              )}

              {planConf.reportData && currentYear != null && (
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Box
                    sx={{
                      flexDirection: 'row',
                      typography: 'h2',
                      justifyContent: 'space-between',
                      mt: 4,
                      mb: 2,
                    }}
                  >
                    <T
                      keyName={
                        'sidebar.plan_settings.report_preview.impact_on_carbon_stock'
                      }
                      ns="hiilikartta"
                    ></T>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      mt: 2,
                    }}
                  >
                    <Typography
                      sx={{
                        display: 'inline-flex',
                        typography: 'h6',
                        textAlign: 'end',
                      }}
                    >
                      <T
                        keyName={'sidebar.plan_settings.report_preview.on_year'}
                        ns="hiilikartta"
                      ></T>
                    </Typography>
                    <DropDownSelectMinimal
                      value={currentYear}
                      isIconOnTheRight={false}
                      sx={{ mr: -4, mt: -0.5 }}
                      iconSx={{ mt: 0.25 }}
                      optionSx={{ typography: 'h8' }}
                      onChange={(e) => setCurrentYear(e.target.value)}
                      options={planConf.reportData.metadata.featureYears
                        .slice(1)
                        .map((year) => {
                          return {
                            value: year,
                            label: year,
                          }
                        })}
                    ></DropDownSelectMinimal>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'row',
                      typography: 'h4',
                      justifyContent: 'space-between',
                      mt: 4,
                      mb: 2,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'inline-flex',
                        maxWidth: '15rem',
                        mr: 3,
                        pt: 0.3,
                        lineHeight: 1.2,
                      }}
                    >
                      <T
                        keyName={
                          'sidebar.plan_settings.report_preview.carbon_stores_shrink'
                        }
                        ns="hiilikartta"
                      ></T>
                    </Box>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        flexDirection: 'column',
                        alignItems: 'end',
                        textAlign: 'end',
                      }}
                    >
                      <Typography typography={'h1'}>
                        {pp(
                          planConf.reportData.agg.totals.bio_carbon_total_diff[
                            currentYear
                          ] +
                            planConf.reportData.agg.totals
                              .ground_carbon_total_diff[currentYear],
                          0
                        )}
                      </Typography>
                      <Typography mt={0.5} typography={'h5'}>
                        <T
                          keyName="sidebar.plan_settings.report_preview.carbon_eqv_unit"
                          ns="hiilikartta"
                        ></T>
                      </Typography>
                      <Typography mt={2} typography={'h1'}>
                        {pp(
                          planConf.reportData.agg.totals.bio_carbon_ha_diff[
                            currentYear
                          ] +
                            planConf.reportData.agg.totals
                              .ground_carbon_ha_diff[currentYear],
                          0
                        )}
                      </Typography>
                      <Typography mt={0.5} typography={'h5'}>
                        <T
                          keyName="sidebar.plan_settings.report_preview.carbon_eqv_unit_hectare"
                          ns="hiilikartta"
                        ></T>
                      </Typography>
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      typography: 'h2',
                      textAlign: 'end',
                      mt: 6,
                      mb: 1,
                      minWidth: '270px',
                      '&:hover': { cursor: 'pointer' },
                      textDecoration: 'underline',
                    }}
                    onClick={handleOpenReport}
                  >
                    <T
                      keyName={'sidebar.plan_settings.open_full_report'}
                      ns={'hiilikartta'}
                    ></T>
                  </Box>
                </Box>
              )}

              <ZoneAccordion
                planConfId={planConf.id}
                sx={{ mt: 4 }}
              ></ZoneAccordion>
            </Box>
          </Box>

          <Box
            sx={(theme) => ({
              display: 'flex',
              flexDirection: 'column',
              pl: SIDEBAR_PADDING_WITH_SCROLLBAR_REM + 'rem',
              pr: SIDEBAR_PADDING_WITH_SCROLLBAR_REM + 'rem',
              pt: 2,
              pb: 2,
              zIndex: 9999,
              borderTop: 1,
              borderColor: 'primary.lighter',
            })}
          >
            <FooterButtonContainer mt={0.4} onClick={handleCopyClick}>
              <Box sx={{ mr: 1.5 }}>
                <FolderCopy></FolderCopy>
              </Box>
              <Box
                sx={{
                  typography: 'h3',
                }}
              >
                <T keyName={'sidebar.plan_settings.copy'} ns={'hiilikartta'} />
              </Box>
              {/* </Box> */}
            </FooterButtonContainer>
            <FooterButtonContainer onClick={handleDeleteClick} sx={{ mt: 1.3 }}>
              <Box sx={{ mr: 1.7 }}>
                <Delete></Delete>
              </Box>
              <Box
                sx={{
                  typography: 'h3',
                }}
              >
                <T
                  keyName={'sidebar.plan_settings.delete'}
                  ns={'hiilikartta'}
                />
              </Box>
              {/* </Box> */}
            </FooterButtonContainer>
            {[
              CalculationState.NOT_STARTED,
              CalculationState.ERRORED,
              CalculationState.FINISHED,
            ].includes(planConf.calculationState) && (
              <Box
                sx={{
                  display: 'flex',
                  flex: 1,
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                  }}
                >
                  <Tooltip
                    title={
                      hasNoFeatures
                        ? t(
                            'sidebar.plan_settings.calculate_carbon_effect.tooltip_no_features'
                          )
                        : t(
                            'sidebar.plan_settings.calculate_carbon_effect.tooltip_invalid'
                          )
                    }
                    disableHoverListener={areSettingsValid && !hasNoFeatures}
                    disableFocusListener={areSettingsValid && !hasNoFeatures}
                    disableTouchListener={areSettingsValid && !hasNoFeatures}
                  >
                    <Box
                      sx={{
                        display: 'inline-flex',
                        flexDirection: 'row',
                        '&:hover': {
                          cursor:
                            areSettingsValid && !hasNoFeatures
                              ? 'pointer'
                              : 'default',
                        },
                        mt: 4,
                        flex: '0',
                        color:
                          areSettingsValid && !hasNoFeatures
                            ? 'neutral.darker'
                            : 'neutral.main',
                      }}
                      onClick={
                        areSettingsValid && !hasNoFeatures
                          ? handleSubmit
                          : undefined
                      }
                    >
                      <Box
                        sx={{
                          typography: 'h1',
                          textAlign: 'end',
                          mr: 3,
                          minWidth: '270px',
                        }}
                      >
                        <T
                          keyName={
                            'sidebar.plan_settings.calculate_carbon_effect'
                          }
                          ns={'hiilikartta'}
                        />
                      </Box>
                      <Box sx={{ mt: 0.2 }}>
                        <ArrowNextBig></ArrowNextBig>
                      </Box>
                    </Box>
                  </Tooltip>
                </Box>
              </Box>
            )}
          </Box>
        </>
      )}
      {!isLoaded && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            mt: 18,
          }}
        >
          <LoadingSpinner></LoadingSpinner>
        </Box>
      )}
    </Box>
  )
}

const FooterButtonContainer = styled(Box)<{ component?: string }>({
  display: 'inline-flex',
  flexDirection: 'row',
  '&:hover': { cursor: 'pointer' },
  color: 'neutral.dark',
  flex: '0',
  whiteSpace: 'nowrap',
  alignSelf: 'flex-start',
})

export default Page
