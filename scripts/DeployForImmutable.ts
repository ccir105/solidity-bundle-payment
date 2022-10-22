import {ethers} from 'hardhat';
import fs from 'fs';

const imxDevContract = `0x7917eDb51ecD6CdB3F9854c3cc593F33de10c623`;
let royaltyReceiver = ``;

async function main() {
  const signers = await ethers.getSigners();
  royaltyReceiver = !royaltyReceiver ? signers[1].address : ``;

  const BattlePass = await ethers.getContractFactory('BattlePass');
  const battlePass = await BattlePass.deploy(999, imxDevContract, royaltyReceiver); //supply, imx, royalty
  await battlePass.deployed();

  console.log(`BattlePass Deployed`, battlePass.address)

  const Collection = await ethers.getContractFactory('BBots');
  const collection = await Collection.deploy(333, royaltyReceiver);
  await collection.deployed();

  console.log(`Bbots Deployed`, collection.address)

  const Minter = await ethers.getContractFactory('MinterProxy');
  const minter = await Minter.deploy(collection.address, BigInt(0.005 * 1e18), BigInt(0.001 * 1e18));
  await minter.deployed();

  console.log(`Minter Deployed`, minter.address);


  const deployedAddress = {
    battlePass: battlePass.address,
    collection: collection.address,
    minter: minter.address
  }

  console.log('Deployed to:', deployedAddress);

  fs.writeFileSync(
    './tasks/address.json',
      JSON.stringify(deployedAddress)
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
