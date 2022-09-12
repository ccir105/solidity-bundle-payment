import {ethers,hardhatArguments} from 'hardhat';
import fs from 'fs';
import {getIMXAddress} from './utils'

async function main() {
    const signers = await ethers.getSigners();
    const Minter = await ethers.getContractFactory('Test');
    const minter = await Minter.deploy();
    await minter.deployed();

    console.log('Deployed to:', minter.address, signers[0].address);

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
