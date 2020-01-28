import * as Web3 from 'web3';
import { getHumanContractABI } from './human.standard.abi.service';
import { nodeAddreses } from '../../config/config';


let web3s = new Web3(`http://${nodeAddreses.eth.host}:${nodeAddreses.eth.port}`);

let getToeknDetailsByContractAddress = async (contractAddress) => {
    return new Promise(async (resolve, reject) => {
        try {
            let data = {};
            if (contractAddress !== undefined && contractAddress !== null && contractAddress !== '') {
                let contract = web3s.utils.isAddress(contractAddress);
                    if (contract) {
                        let contractABI = getHumanContractABI();
                        let tokenContract = web3s.eth.Contract(contractABI, contractAddress);
                        let symbol = await tokenContract.methods.symbol().call();
                        let deceimals = await tokenContract.methods.decimals().call();
                        let name = await tokenContract.methods.name().call();
                        data = {
                            symbol: symbol,
                            deceimals: deceimals,
                            name: name,
                            contractAddress: contractAddress
                        }
                        resolve(data);
                    }
            }
        
        } catch (error) {
            // console.log(error);
            reject(error);
        }
        
    });

};


export {
    getToeknDetailsByContractAddress
}


