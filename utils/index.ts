import {asciiToHex, toBN, toWei, fromWei, rightPad} from "web3-utils";
import {BigNumber} from "ethers";
import BN from "bn.js";

export const Utils = {

  toBytes32: (key: any) =>
    rightPad(asciiToHex(key), 64),

  fromUnit: (amount: BN | string) => fromWei(amount, 'ether'),

  toUnit: (amount: BigNumber | string) => toBN(toWei(amount.toString(), 'ether')),

}
