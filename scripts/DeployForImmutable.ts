import {ethers} from 'hardhat';
import fs from 'fs';

const imxDevContract = `0x7917eDb51ecD6CdB3F9854c3cc593F33de10c623`;

async function main() {
  const signers = await ethers.getSigners();
  const Minter = await ethers.getContractFactory('BBots');
  const minter = await Minter.deploy(imxDevContract, signers[1].address); //royalty

  await minter.deployed();

  console.log('Deployed to:', minter.address, signers[0].address, signers[1].address);

  fs.writeFileSync(
    './tasks/address.json',
    JSON.stringify({
      genesis: minter.address,
    }),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
