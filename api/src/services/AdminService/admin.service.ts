import * as fs from 'fs';

let removeFile = async (filePath) => {
    try {
        return new Promise(async (resolve, reject) => {
            // console.log(`./dist/public/images/${filePath}`);
            return await fs.unlinkSync(`./dist/public/images/${filePath}`);
            // console.log(dir);
        });
    } catch (error) {
        console.log(error);
    }
};



export {
    removeFile
}