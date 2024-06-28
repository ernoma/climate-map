
By default the hiilikartta git branch has ui of the [map.avoin.org](https://map.avoin.org). To change it to [hiilikartta.avoin.org](https://hiilikartta.avoin.org) ui and to be able to run the climate-map app, you may have to do following steps:

1. If you have not already done, for example, with the [hiilikartta-data-service app](https://github.com/AvoinOrg/hiilikartta-data-service), you may need to run once `docker network create climate-map-network`.
2. Copy the .env.template to .env
3. recreate the docker-entrypoint.sh, change contents to:
    ```
    #!/bin/bash
    yarn run build-hiilikartta
    ```
4. change in the package.json
    from `"build": "yarn run prebuild && next build",`
    to `"build": "next build",`
5. You may want to ask AvoinOrg about the Zitadel but I created Zitadel account, Zitadel project and Zitadel instance and copied `ZITADEL_CLIENT_ID` and `ZITADEL_CLIENT_SECRET` to .env. Also, in the .env you may need to replace `NEXT_PUBLIC_ZITADEL_ISSUER` to `NEXT_PUBLIC_ZITADEL_ISSUER=https://**your-instance-name**.zitadel.cloud` (maybe not needed if not using logging).
6. You may want to ask AvoinOrg about Tolgee and should probably use downloadTranslations.js under utils\scripts folder but I
    1. created `src\i18n\hiilikartta` folder and under that `en.json` file
    2. in `src\app\(ui)\layout.tsx` leave only the line `"'en:hiilikartta': () => loadTranslation('hiilikartta', 'en'),"` uncommented under the staticData
    
    Even with the above changes, the texts are not shown correctly in the UI but at least running the climate-map app succeeds.
7. Run `docker-compose up`
8. In the docker-entrypoint.sh change back to original content 
9. (optional) Set the NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to be able to see the map on the web page
10. run `docker-compose up`


When you have the climate-map app running, the UI can be found from [http://localhost:3000](http://localhost:3000)