import {expect} from 'chai';
import {ethers, web3} from 'hardhat';

describe.only('BBots', function () {
  let minter;
  let signers;

  before(async () => {
    signers = await ethers.getSigners();
    const Minter = await ethers.getContractFactory('BBots', signers[0]);
    minter = await Minter.deploy(signers[0].address, signers[1].address);
    await minter.deployed();
  });

  it('Should mint some nfts', async () => {
    for (let i = 0; i < 10; i++) {

      await minter
        .connect(signers[0])
        .mintFor(signers[1].address, 1, web3.utils.asciiToHex(`{${i}}:{IPFSHASH${i},12.23.34.45}`));
    }

    const balance = await minter.balanceOf(signers[1].address);
    expect(balance).to.be.eq(10);
  });

  it('should transfer the nft', async () => {
    await minter.connect(signers[1]).transferFrom(signers[1].address, signers[0].address, 1);
    let isOwner = await minter.ownerOf(1);
    expect(isOwner).to.be.eql(signers[0].address);
  });

  it('should approve', async () => {
    await minter.connect(signers[1]).approve(signers[3].address, 2);
  });

  it('Should approve all', async () => {
    await minter.setApprovalForAll(signers[1].address, true);
  });

  it('Should return the proper base uri', async () => {
    await minter.updateBaseUri('https://dev.peanuthub.com/nft/');
    const tokenUri = await minter.tokenURI(1);
    expect(tokenUri).to.be.eq('https://dev.peanuthub.com/nft/1');
  });
});
