import * as jwt from 'jsonwebtoken';
import { JWTSecret } from '../../config/config';


let JwtSign = (payload, cb) => {

    jwt.sign(payload, JWTSecret, { expiresIn: '1d' }, cb);
}


export {
    JwtSign,
}