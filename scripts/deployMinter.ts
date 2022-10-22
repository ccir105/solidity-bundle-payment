import {ethers} from 'hardhat';
import fs from 'fs';

async function main() {
  const address = JSON.parse(fs.readFileSync('./tasks/address.json').toString())

  const Minter = await ethers.getContractFactory('MinterProxy');
  const minter = await Minter.deploy(address.collection, BigInt(0.005 * 1e18), BigInt(0.001 * 1e18));
  await minter.deployed();

  console.log(`Minter Deployed`, minter.address);

  fs.writeFileSync(
    './tasks/address.json',
    JSON.stringify({
      ...address,
      minter: minter.address,
    }),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
