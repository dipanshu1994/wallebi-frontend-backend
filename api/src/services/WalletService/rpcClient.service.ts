import { request } from './request.service';

/**
 * Bcoin RPC client.
 * @alias module:http.RPCClient
 * @constructor
 * @param {String} uri
 * @param {Object?} options
 */

function RPCClient(options) {
    this.uri = `${options.protocol || 'http'}://${options.host}:${options.port || 18333}${options.path}`;
    if (!options.auth) {
        this.username = options.username;
        this.password = options.password;
    }
    else {
        let explodes = options.auth.split(":");
        if (explodes.length !== 2) throw new Error('Invalid user name and password.');
        this.username = explodes[0];
        this.password = explodes[1];
    }
    this.id = 0;
}

/**
 * Make a json rpc request.
 * @private
 * @param {String} method - RPC method name.
 * @param {Array} params - RPC parameters.
 * @returns {Promise} - Returns Object?.
 */

RPCClient.prototype.execute = async function execute(method, params) {
    // console.log(method, params)
    // console.log({
    //     username: this.username,
    //     password: this.password,
    //     uri: this.uri
    // })
    const res: any = await request({
        method: 'POST',
        uri: this.uri,
        json: {

            method: method,
            params: params,
            id: this.id++
        },
        auth: {
            username: this.username,
            password: this.password
        }
    });
    // if (res.statusCode === 401)
    //     throw new RPCError('Unauthorized (bad API key).', -1);
    // if (res.body.error)
    //     throw new RPCError(res.body.error.message, res.body.error.code);
    return res.body.result;
};

/*
 * Helpers
 */
function RPCError(msg, code) {
    Error.call(this);

    this.type = 'RPCError';
    this.message = String(msg);
    this.code = code >>> 0;

    if (Error.captureStackTrace)
        Error.captureStackTrace(this, RPCError);
}

Object.setPrototypeOf(RPCError.prototype, Error.prototype);

/*
 * Expose
 */



export {
    RPCClient
}