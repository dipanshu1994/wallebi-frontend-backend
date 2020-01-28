import { exec } from "child_process";



let activateMoneroWalletService = async (walletName) => {
    try {
        return new Promise( (resolve, reject) => {
            exec("curl -u ravi:123456 --digest -X POST http://18.185.69.170:18081/json_rpc -d '{\"jsonrpc\":\"2.0\",\"id\":\"0\",\"method\":\"create_account\",\"params\":{\"label\":\"" + walletName + "\"}}' -H 'Content-Type:application/json'", (error, stdout, stderr) => {
            if (error) {
                    reject(error);
                } else {
                    let getJsonResp = JSON.parse(stdout);
                    let accountIndex;
                    let accountAddress;
                    if (getJsonResp.result) {
                        accountIndex = getJsonResp.result.account_index;
                        accountAddress = getJsonResp.result.address;
                    }
                    resolve({
                        name: walletName,
                        address: accountAddress,
                        account_index: accountIndex,
                        balance: 0
                    });
                }
            });
        })


    } catch (error) {
        console.log(error);
    }
};



export {
    activateMoneroWalletService
}