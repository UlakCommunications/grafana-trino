set -x
set -e
version=_v5
rm -rf ./dist
rm -rf ./trino-datasource
yarn install
yarn build --skipTest
mage -v
cp -r ./dist ./trino-datasource
zip -r trino-datasource${version}.zip trino-datasource
curl -v -u user:pwd --upload-file ./trino-datasource.zip http://192.168.57.202:8081/repository/file/trino-datasource${version}.zip
curl -v -u user:pwd --upload-file ./trino-datasource.zip http://192.168.27.6:8081/repository/file/trino-datasource${version}.zip
rm -rf ./trino-datasource

