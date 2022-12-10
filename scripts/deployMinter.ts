import {ethers} from 'hardhat';
import fs from 'fs';
async function main() {

  const signers = await ethers.getSigners();

  const BubbleSale = await ethers.getContractFactory('Bubbles');
  const TestToken = await ethers.getContractFactory('MyToken');

  const testToken = await TestToken.deploy();
  await testToken.deployed();

  const bubbleSale = await BubbleSale.deploy(signers[0].address, testToken.address);
  await bubbleSale.deployed();

  console.log('Bubble Sale deployed to:', bubbleSale.address);
  console.log('Test Token Deployed to:', testToken.address)

  fs.writeFileSync(
    './tasks/address.json',
    JSON.stringify({
      bubbleSale: bubbleSale.address,
      testToken: testToken.address,
    }),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
