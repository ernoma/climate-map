
# Hiilikartta Front-end

## Running the Hiilikartta for the First Time

By default the hiilikartta git branch has ui of the [map.avoin.org](https://map.avoin.org). To change it to [hiilikartta.avoin.org](https://hiilikartta.avoin.org) ui and to be able to run the climate-map app, you may have to do following steps:

1. If you have not already done, for example, with the [hiilikartta-data-service app](https://github.com/AvoinOrg/hiilikartta-data-service), you may need to run once `docker network create climate-map-network`.
2. Copy the .env.template to .env
3. in MS Windows, you may need to recreate the docker-entrypoint.sh to change CRLF to LF
4. change the docker-entrypoint.sh contents to:
    ```
    #!/bin/bash
    yarn run build-hiilikartta
    ```
5. change in the package.json
    from `"build": "yarn run prebuild && next build",`
    to `"build": "next build",`
6. You may want to ask AvoinOrg about the Zitadel but I created Zitadel account, Zitadel project and Zitadel instance and copied `ZITADEL_CLIENT_ID` and `ZITADEL_CLIENT_SECRET` to .env. Also, in the .env you may need to replace `NEXT_PUBLIC_ZITADEL_ISSUER` to `NEXT_PUBLIC_ZITADEL_ISSUER=https://**your-instance-name**.zitadel.cloud` (maybe not needed if not using logging).
7. You may want to ask AvoinOrg about Tolgee and should probably use downloadTranslations.js under utils\scripts folder but I
    1. created `src\i18n\avoin-map` folder and under that `en.json` file. I used avoin-map because it is the defaultNs.
    2. (maybe not needed: in `src/app/(ui)/layout.tsx` leave only the line `"'en:avoin-map': () => loadTranslation('hiilikartta', 'en'),"` uncommented under the staticData)
    
    Even with the above changes, the texts are not shown correctly in the UI but at least running the climate-map app succeeds.
8. Run `docker-compose up`
9. In the docker-entrypoint.sh change back to original content 
10. (optional) Set the NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to be able to see the map on the web page
11. In the .env file set `NEXT_PUBLIC_USE_BASE_ROUTE_FOR_APPLETS=true`, so that the links in the UI do not add "hiilikartta" to the route that causes routing to error
12. run `docker-compose up`

When you have the climate-map app running, the UI can be found from [http://localhost:3000](http://localhost:3000)

## Technical Notes

### How Existing Plan Calculation Results are Retrieved from the Server by the Hiilikartta Map-Client

The plan calculation resuls for one plan are shown at the URL: https://hiilikartta.avoin.org/raportti?planIds=<uuid> where uuid is the unique id for the plan used in Hiilikartta calculation, for example https://hiilikartta.avoin.org/raportti?planIds=1ab88dd6-673d-4d7e-a07f-58f13d6fc163 shows results of the imaginary plan. If we search code fpr the `planIds` term we notice that it is set as a query parameter in the `src/app/(ui)/(applets)/(hiilikartta)/(pages)/kaavat/[planIdSlug]/page.tsx` in the handleOpenReport function that also routes the web browser to open the `src/app/(ui)/(applets)/(hiilikartta)/(pages)/raportti/page.tsx`. We also notice that the plandIds query parameter is referred in the `src/app/(ui)/(applets)/(hiilikartta)/(pages)/raportti/page.tsx` twice, it is:
1. set in the `handlePlanSelectClick` function and
2. read in the `useEffect` hook. 
(planIdSlug is also defined as the page parameter)
In the useEffect hook there is `PlanConfWithReportData` handling. The PlanConfWithReportData (that is defined in the `src/app/(ui)/(applets)/(hiilikartta)/common/types.ts`), for example, will contain the calculation report data that is shown to the user(s) .
Since the user just opened the raportti page, the `addExternalPlanConf` function is called from the useEffect hook.

The `addExternalPlanConf` is defined in the `src/app/(ui)/(applets)/(hiilikartta)/state/appletStore.ts` and there is also `useAppletStore.subscribe()` function call at the end of the appletStore.ts that checks if the report data has been fetched from the server already and if not, then it will use the fetchQuery function of the QueryClient (defined in the `src/common/queries/queryClient.ts`) to fetch and cache the calculation report data via using the externalPlanQuery function defined in the `src/app/(ui)/(applets)/(hiilikartta)/common/queries/externalPlanQuery.tsx` (and imported from the `appletStore.ts`). The externalPlanQuery function makes get HTTP request to the hiilikartta-data-service to get the calculation report data and when the data is received, calls `processCalcQueryToReportData` function defined in the `src/app/(ui)/(applets)/(hiilikartta)/common/utils.ts`.

It might also be useful to note that:
- `src/app/(ui)/(applets)/(hiilikartta)/common/queries/planQueries.tsx` is imported from `src/app/(ui)/(applets)/(hiilikartta)/(pages)/layout.tsx`
- `src/app/(ui)/(applets)/(hiilikartta)/common/queries/planQuery.tsx` is not imported from anywhere but there is commented out code that uses planQuery, in the `planQueries.tsx`

The PlanConfWithReportData has ReportData attribute that is also defined in the `src/app/(ui)/(applets)/(hiilikartta)/common/types.ts`. The ReportData contains the attributes:
```
    areas: CalcFeatureCollection
    totals: CalcFeatureCollection
    metadata:
        timestamp: number
        featureYears: string[]
    agg: { totals: FeatureCalcs }
```


### How Existing Plan Calculation Results Can be Retrieved from the Carbon Map

There is the `src\app\(ui)\(applets)\(hiilikartta)\api\report\route.ts`. This means that if the client application, such as USCIAT, knows id of the plan that has calculation results, it can retrieve the results by making request to the `https://hiilikartta.avoin.org/api/report?id=<plan_id>` URL where the `<plan_id>` is the id of the plan. The data is returned as JSON (containing also GeoJSON).

