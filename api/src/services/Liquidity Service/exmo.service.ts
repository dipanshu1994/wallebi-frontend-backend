import * as CryptoJS from 'crypto-js';
import * as http from 'http';
import * as querystring from 'querystring';
import * as request from 'request';

let config: any = {
    url: 'https://api.exmo.com/v1/'
};


function sign(message) {
    return CryptoJS.HmacSHA512(message, config.secret).toString(CryptoJS.enc.hex);
}

let init_exmo = async (cfg) => {
    config.key = cfg.key;
    config.secret = cfg.secret;
    config.nonce = Math.floor(new Date().getTime());
};



let api_query = async (method_name, data, callback) => {

    data.nonce = config.nonce++;
    let post_data = querystring.stringify(data);
    let options = {
        url: config.url + method_name,
        method: 'POST',
        headers: {
            'Key': config.key,
            'Sign': sign(post_data)
        },
        form: data
    };
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            callback(body);
        } else {
            callback(error);
        }
    });
};

let api_query2 = async (method_name, data, callback) => {
    data.nonce = config.nonce++;
    let post_data = querystring.stringify(data);

    let post_options = {
        host: 'api.exmo.com',
        port: '80',
        path: '/v1/' + method_name,
        method: 'POST',
        headers: {
            'Key': config.key,
            'Sign': sign(post_data),
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(post_data)
        }
    };
    let post_req = http.request(post_options, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            callback(chunk);
        });
    });

    post_req.write(post_data);
    post_req.end();
};



let cancelOrder = async (method_name, data, callback) => {

    
    data.nonce = config.nonce++;
    let post_data = querystring.stringify(data);
    let options = {
        url: config.url + method_name,
        method: 'POST',
        headers: {
            'Key': config.key,
            'Sign': sign(post_data)
        },
        form: data
    };
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            callback(body);
        } else {
            callback(error);
        }
    });
};







let fetchUserInfo = async (method_name, data, callback) => {

    
    data.nonce = config.nonce++;
    let post_data = querystring.stringify(data);
    let options = {
        url: config.url + method_name,
        method: 'POST',
        headers: {
            'Key': config.key,
            'Sign': sign(post_data)
        },
        form: data
    };
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            callback(body);
        } else {
            callback(error);
        }
    });
};














export {
    init_exmo,
    api_query,
    api_query2,
    cancelOrder,
    fetchUserInfo
}




// Database is now connected!
// {"result":true,"error":"","order_id":4393630456}
// POST /userWallets/buyCryptoTrade - - ms - -
// {"result":true,"error":"","order_id":439364605





