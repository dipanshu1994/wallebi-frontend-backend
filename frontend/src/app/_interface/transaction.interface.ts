export interface UserTransaction {
    action: string;
    currencyType: string;
    receiverAddress: string;
    amount: number;
    timestamp: Date;
    trnxFee: number;
    hash: string;
  }
