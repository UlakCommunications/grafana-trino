 VERSION=$1
 set -x

rm -rf ./dist
yarn build --skipTest
mage -v
cp -r ./dist trino-datasource
zip -r trino-datasource.zip trino-datasource
curl -v -u admin:nexusulak2022 --upload-file ./trino-datasource.zip http://192.168.57.202:8081/repository/file/trino-datasource.zip

