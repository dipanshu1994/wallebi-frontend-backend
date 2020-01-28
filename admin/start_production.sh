#!/bin/bash
#echo " starting blockoville"
#pm2 start --name 'blockoville' /usr/local/bin/ng -- serve  --env=prod --port=4201
echo "Building Application";
ng build --aot --prod --output-hashing none --build-optimizer=false
pm2 start --name 'admin.wallebi.com' server.js