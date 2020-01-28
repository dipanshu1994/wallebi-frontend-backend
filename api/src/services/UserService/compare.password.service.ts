import * as bcrypt from 'bcrypt';


let comparePassword = (password, payload) => {
    try {
        return bcrypt.compareSync(password, payload);
    } catch (error) {
        console.log(error);
    }
}

export {
    comparePassword
}
