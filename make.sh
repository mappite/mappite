#!/bin/bash
# Replace KEY_GOES_HERE with corrct values
# Arguments: 
#  no argument  = build for dev, 
#  prod = build for prod, 
#  php  = include php
mversion=`date +%y%m%d%H%M`;
if [[ -z $1 ]]; then
echo Build for DEV
fi
# Recreate dist/ directory and copy files
if [[ -d "./dist" ]]; then
rm -r dist*
fi
mkdir dist/
mkdir dist/scripts
cat ./mappite-js/*.js > dist/scripts/mappite.js
cp -R ./other-js/* dist/scripts/
cp -R ./lang* ./icons* dist/
cp ./*.* dist/

# dist/scripts/mappite.js
# set version and edit 001-Keys.js to set keys
sed -i "s/__mversion__/$mversion/g" dist/scripts/mappite.js
sed -i 's/__mapquestKey__/KEY_GOES_HERE/g' dist/scripts/mappite.js
sed -i 's/__orsKey__/KEY_GOES_HERE/g' dist/scripts/mappite.js
sed -i 's/__mapboxKey__/KEY_GOES_HERE/g' dist/scripts/mappite.js
# if internal routing is enabled, your graphopper server:
sed -i 's/__mserver__/your_server_url/g' dist/scripts/mappite.js


# ** Database ** 
if [[ $1 == "php" || $2 == "php" ]]; then
echo "Refreshing PHP"
cp ./php/*.php dist/
# edit dist/db.php to set connection properties
sed -i 's/__servername__/KEY_GOES_HERE/g' dist/db.php
sed -i 's/__username__/KEY_GOES_HERE/g' dist/db.php
sed -i 's/__password__/KEY_GOES_HERE/g' dist/db.php
sed -i 's/__dbname__/KEY_GOES_HERE/g' dist/db.php
sed -i 's/__port__/KEY_GOES_HERE/g' dist/db.php
fi

# edit dist/index.html
# 1. update google analytics js with proper code
sed -i 's/__GOOGLE__/KEY_GOES_HERE/g' dist/index.html
# 2. minimize mappite.js to mappite-min.js
if [[ $1 == "prod"  || $2 == "prod" ]]; then
echo "Built for PROD"
uglifyjs dist/scripts/mappite.js > dist/scripts/mappite-$mversion.js
sed -i "s/mappite.js/mappite-$mversion.js/g" dist/index.html
fi
# 0. comment lines 24&25 and uncomment lines 27-28 to use custom leaflet-151w6855.js
#    production mappite uses leaflet-151w6855.js, 
#    a modified version to overcome an iOS issue (to be reviewed)
echo "Done. Edit index.html to point to correct leaflet.js"


