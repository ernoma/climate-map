import { memo, useState, useEffect } from 'react'
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
} from '@mui/material'
import { styled } from '@mui/material/styles'
import { T } from '@tolgee/react'

import DropDownSelect from '#/components/common/DropDownSelect'
import { ArrowDown } from '#/components/icons'

import { ZONING_CLASSES } from '../../../../common/constants'
import { PlanDataFeature } from '../../../../common/types'
import ZoneAccordionItemTitle from './ZoneAccordionItemTitle'
import { checkIsValidZoningCode } from 'applets/hiilikartta/common/utils'

const zoningCodeOptions = ZONING_CLASSES.map((zoning) => ({
  value: zoning.code,
  label: `${zoning.name} (${zoning.code})`,
}))

interface CustomAccordionProps {
  feature: PlanDataFeature
  index: number
  expanded: boolean
  onChange: (
    featureId: string
  ) => (event: React.SyntheticEvent, isExpanded: boolean) => void
  accordionRefs: React.MutableRefObject<{
    [key: string]: HTMLDivElement | null
  }>
  updateFeature: (id: string, feature: Partial<PlanDataFeature>) => void
}

const ZoneAccordionItem = memo(
  ({
    feature,
    index,
    expanded,
    onChange,
    accordionRefs,
    updateFeature,
  }: CustomAccordionProps) => {
    const [isValid, setIsValid] = useState(true)

    useEffect(() => {
      const valid = checkIsValidZoningCode(feature.properties.zoning_code)
      setIsValid(valid)
    }, [feature.properties.zoning_code])

    const handleZoningCodeChange = (event: any) => {
      const zoningCode = event.target.value

      if (zoningCode != null) {
        updateFeature(feature.properties.id, {
          properties: { ...feature.properties, zoning_code: zoningCode },
        })
      }
    }

    const handleNameChange = (event: any) => {
      const name = event.target.value

      if (name != null && name != '') {
        updateFeature(feature.properties.id, {
          properties: { ...feature.properties, name: name },
        })
      }
    }

    return (
      <Accordion
        key={feature.properties.id}
        sx={{
          width: '100%',
          backgroundColor: 'background.paper',
          ':before': {
            opacity: 0,
          },
          '&.Mui-expanded': {
            margin: 'auto',
            backgroundColor: 'primary.lighter',
          },
          '&:before': {
            display: 'none',
          },
        }}
        TransitionProps={{ unmountOnExit: true }}
        expanded={expanded}
        onChange={onChange(feature.properties.id)}
        ref={(el) => (accordionRefs.current[feature.properties.id] = el)}
      >
        <AccordionSummary
          expandIcon={<ArrowDown />}
          aria-controls={`panel${index + 1}-content`}
          id={`panel${index + 1}-header`}
          sx={{
            '& .MuiAccordionSummary-content': {
              width: '100%',
              display: 'flex',
              flexGrow: 1,
            },
          }}
        >
          <ZoneAccordionItemTitle
            name={feature.properties.name}
            zoningCode={feature.properties.zoning_code}
            isValidZoningCode={isValid}
            onChange={handleNameChange}
          ></ZoneAccordionItemTitle>
        </AccordionSummary>
        <AccordionDetails sx={{ display: 'flex', flexDirection: 'column' }}>
          <Row>
            <T
              keyName={'sidebar.plan_settings.zones.area_information'}
              ns="hiilikartta"
            ></T>
          </Row>
          <DropDownSelect
            value={feature.properties.zoning_code}
            options={zoningCodeOptions}
            onChange={handleZoningCodeChange}
            sx={{
              backgroundColor: 'neutral.lighter',
              borderColor: 'primary.light',
              mt: 1,
            }}
          ></DropDownSelect>
        </AccordionDetails>
      </Accordion>
    )
  },
  (prevProps, nextProps) => {
    return (
      prevProps.expanded === nextProps.expanded &&
      prevProps.feature.properties.zoning_code ===
        nextProps.feature.properties.zoning_code &&
      prevProps.feature.properties.name === nextProps.feature.properties.name
    )
  }
)

export default ZoneAccordionItem

const Row = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  width: '100%',
}))
