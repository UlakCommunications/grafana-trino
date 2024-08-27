set -x
set -e

rm -rf ./dist
rm -rf ./trino-datasource
yarn build --skipTest
mage -v
cp -r ./dist ./trino-datasource
zip -r trino-datasource.zip trino-datasource
curl -v -u admin:nexusulak2022 --upload-file ./trino-datasource.zip http://192.168.57.202:8081/repository/file/trino-datasource.zip
rm -rf ./trino-datasource

