import {expect} from 'chai';
import {ethers} from 'hardhat';

describe('GachaPack', function () {
    let collection;
    let signers;
    let gachaPack;

    before(async () => {
        signers = await ethers.getSigners();
        const GachaPack = await ethers.getContractFactory('GachaPack', signers[0]);

        gachaPack = await GachaPack.deploy();
        await gachaPack.deployed();

        const Collection = await ethers.getContractFactory('BBots', signers[0]);
        collection = await Collection.deploy(gachaPack.address);
        await collection.deployed();
    });

    it('should update the collection address', async () => {
        await gachaPack.updateCollection(collection.address);
    });

    it('Should add to whitelist', async () => {
       let users: any = [];
       for(let i = 0; i<10;i++) {
           users.push(
               signers[i + 1].address
           )
       }
       await gachaPack.addToWhitelist(users);
       const isAdded = await gachaPack.whiteListUsers(users[1]);
       expect(isAdded).to.be.eq(true);
    });

    it('Should start the whitelist sale', async () => {
        await gachaPack.updateSaleStat(1);
        const saleStat = await gachaPack.saleStat();
        expect(saleStat).to.be.eq(1);
    });

    it('should mint for whitelist', async () => {
        await gachaPack.connect(signers[2]).openPackForWl([]);
    });
});
