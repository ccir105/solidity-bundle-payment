import {ethers} from 'hardhat';
const hre = require("hardhat");
import fs from 'fs';
import addresses from '../tasks/address.json';
async function main() {

  const networkName = hre.network.name;

  let maticUsdc = ''; //place the correct address of usdc matic
  let multiSigWallet = '0xa432cE1f3D48ddf003b95F2563238D8e9dd86Dc7';
  let manager = '0x4d8E66e7035CcAD6B5355Fa5004dcC446342C7B7'; // this can be the signer, if we want to switch payment by matic

  const signers = await ethers.getSigners();
  const BubbleSale = await ethers.getContractFactory('Bubbles');

  if( networkName != 'live' ){
    const TestToken = await ethers.getContractFactory('MyToken');
    const testToken = await TestToken.deploy();
    await testToken.deployed();
    maticUsdc = testToken.address;
    multiSigWallet = signers[0].address;
  }

  const bubbleSale = await BubbleSale.deploy(multiSigWallet, maticUsdc, manager);
  console.log("Deployed");

  addresses[networkName] = {
    bubbleSale: bubbleSale.address,
    maticUsdc,
  }

  fs.writeFileSync(
    './tasks/address.json',
    JSON.stringify(addresses),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
