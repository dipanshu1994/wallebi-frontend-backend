import { nodeAddreses } from "../../config/config";
import { getHumanContractABI } from "../AdminService/human.standard.abi.service";
import * as Web3 from 'web3';
import { unlockAddress } from "./eth.Service";


const web3 = new Web3(`http://${nodeAddreses.eth.host}:${nodeAddreses.eth.port}`);



const getTokenContract = async (from, contractAddress) => {
    return new Promise(async (resolve, reject) => {
        try {
            let contractABI = getHumanContractABI();
            let contract  = web3.eth.Contract(contractABI, contractAddress, { gas: "100000", from });
            resolve(contract);
        } catch (error) {
            reject(error);
        }
    });

};



let getTokenBalance = async (address, contractAddress) => {
    return new Promise(async (resolve, reject) => {
        try {
            await getTokenContract(address, contractAddress).then(async (contract: any) => {
                let balance = await contract.methods.balanceOf(address).call();
                balance =  parseInt(balance);
                let decimals = await contract.methods.decimals().call();
                balance = balance /  Math.pow(10, decimals);
                resolve(balance);
            }).catch((error) => {
                reject(error);
            });
        } catch (error) {
            // console.log(error)
            reject(error);
        }
    });
};



let transferTokenAmount = async (contractAddress, senderAddress, password, receiverAddress, amount) => {
    return new Promise(async (resolve, reject) => {
        try {
            await getTokenContract(senderAddress, contractAddress).then(async (contract: any) => {
                await unlockAddress(senderAddress, password).then(async (unlock) => {
                    if (unlock) {
                        let decimals = await contract.methods.decimals().call();
                        let result = await contract.methods.transfer(receiverAddress, decimals*amount).send();
                        resolve(result);
                    }
                }).catch((error) => {
                    reject(error);
                });
            }).catch((error) => {
                reject(error);
            });
        } catch (error) {
            reject(error);
        }
    });
};





export {
    getTokenBalance,
    transferTokenAmount
}