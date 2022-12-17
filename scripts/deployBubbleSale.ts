import {ethers} from 'hardhat';
const hre = require("hardhat");
import fs from 'fs';
import addresses from '../tasks/address.json';
async function main() {

  const networkName = hre.network.name;

  let maticUsdc = ''; //place the correct address of usdc matic
  let multiSigWallet = '0xa432cE1f3D48ddf003b95F2563238D8e9dd86Dc7';

  const signers = await ethers.getSigners();
  const BubbleSale = await ethers.getContractFactory('Bubbles');

  if( networkName != 'live' ){
    const TestToken = await ethers.getContractFactory('MyToken');
    const testToken = await TestToken.deploy();
    await testToken.deployed();
    maticUsdc = testToken.address;
    multiSigWallet = signers[0].address;
  }

  const bubbleSale = await BubbleSale.deploy(signers[0].address, maticUsdc, multiSigWallet);
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
