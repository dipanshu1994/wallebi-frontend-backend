import * as Pusher from 'pusher';
let databaseURL = 'mongodb://localhost:27017/';
// let databaseURL = 'mongodb://wallebi:Wallebi_2019!@ds235158-a0.pvb45.fleet.mlab.com:35158,ds235158-a1.pvb45.fleet.mlab.com:35158/wallebi?replicaSet=rs-ds235158&ssl=true';

// database name
let DBName = 'Wallebi-com';

// secret of JWT toekn
let JWTSecret = 'secret';

// mail sender
let sender = "admin@wallebi.asia";

// send sms credentials of omini channel API
let smsusername = '37cd3ba514ada61da5654ef7cfa6ee18';
let smspassword = 'a0fe6b140913b20465ae6115921c1f1d';


// pusher credentials
let pusher = new Pusher({
    appId: '797548',
    key: 'f588fdb1405ed9563e5c',
    secret: '2904654dbdd2bddef46a',
    cluster: 'ap2',
    useTLS: true
});



// yek pay merchant id
let merchantId = {
    merchantId: '2KRSNVRT569AFZ5M5QR456M8NJ6FUFB6',
};


/**
 * Admin block chain node addrress
 */
let nodeAddreses = {
    "btc": {
        "protocol": "http",
        "path": "/",
        "port": 8332,
        "host": "18.197.155.136",
        "username": "bitcoin",
        "password": "amir@bitcoin"
    },
    "omniusdt": {
        "protocol": "http",
        "path": "/",
        "port": 8332,
        "host": "52.58.25.118",
        "username": "ramomnilayer",
        "password": "WallAMB12Ty3456dfasO123PPEfbi"
    },
    "ltc": {
        "protocol": "http",
        "path": "/",
        "port": 9332,
        "host": "3.122.245.6",
        "username": "ram",
        "password": "AMB12Ty3456dfasO123PPEf"
    },
    "bch": {
        "protocol": "http",
        "path": "/",
        "port": 8332,
        "host": "52.59.159.163",
        "username": "amir",
        "password": "amir@bitcoincash"
    },
    "usdt": {
        "protocol": "http",
        "path": "",
        "port": 18222,
        "host": "206.189.112.9",
        "wsPort": "8546",
        "username": "bit_user",
        "password": "a4213460fee4faa0ee11aabf8e5ea68e1c723a0b99e63212551579f21e3b02fc"

    },
    "eth": {
        "protocol": "http",
        "path": "/",
        "port": 8545,
        "host": "3.120.140.233",
        "username": "",
        "password": ""

    },
    "xrp": {
        "protocol": "wss",
        "path": "/",
        "port": 51233,
        "host": "s.altnet.rippletest.net",
        "username": "",
        "password": "",
        "uri": "wss://s.altnet.rippletest.net:51233"
    },
    "xmr": {
        "protocol": "http",
        "path": "/",
        "port": 18081,
        "host": "18.184.224.23",
        "username": "ram",
        "password": "123456"
    }
}



/**
* Admin addresses for trade
*/ 
let AdminDetailsForTrade = {
    "btc": {
        "name": "bitcoin_wallebiadmin_1542089184558",
        "address": "3Jwr3g3P4Ycmted2hftc2zRYGn3mWWGhB9"
    },
    "eth": {
        "name": "ethereum_wallebiadmin_1543136301891",
        "address": "0x35512acA73D0842904AccF32CbBaD150116A93BD"
    },

    "bch": {
        "name": "bch_wallebiadmin_1542089184622",
        "address": "bitcoincash:pq2vvw708k4u2d8rns6kd5crgx46qm0qcvwr5epjpa"
    },
    "ltc": {
        "name": "ltc_wallebiadmin_1543136301823",
        "address": "MEPPAAi6UD1Bz7BgTH6W7P6HEXDT8Rr2Sp"
    },
    "omniusdt": {
        "name": "omniusdt_wallebiadmin_1544422604824",
        "address": "38be9rrVr8RUNWGMjKm5bEuzaaSKivNV2j"
    },
    "usdt": {
        "name": "omniusdt_wallebiadmin_1544422604824",
        "address": "38be9rrVr8RUNWGMjKm5bEuzaaSKivNV2j"
    }
}











export {
    databaseURL,
    DBName,
    JWTSecret,
    sender,
    smsusername,
    smspassword,
    pusher,
    AdminDetailsForTrade,
    nodeAddreses,
    merchantId
}
