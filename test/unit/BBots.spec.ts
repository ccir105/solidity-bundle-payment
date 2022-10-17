import {expect} from 'chai';
import {ethers, web3} from 'hardhat';

describe('BattlePass', function () {
  let battlePass;
  let signers;

  before(async () => {
    signers = await ethers.getSigners();

    const BubbleBot = await ethers.getContractFactory('BBots', signers[0]);

    battlePass = await BubbleBot.deploy(100, signers[0].address, signers[1].address);

    await battlePass.deployed();
  });

  it('should get the total supply', async () => {
    const supply = await battlePass.totalSupply();
    expect(supply).to.be.eq(0);
  });

  it('Should mint some nfts', async () => {
    for (let i = 0; i < 100; i++) {
      await battlePass
        .connect(signers[0])
        .mintFor(signers[1].address, 1, web3.utils.asciiToHex(`{${i}}:{SOME_DATA}`));
    }

    const balance = await battlePass.balanceOf(signers[1].address);
    expect(balance).to.be.eq(100);

    await expect(battlePass
        .connect(signers[0])
        .mintFor(signers[1].address, 1, web3.utils.asciiToHex(`{1000}:{SOME_DATA}`)))
        .to.be.revertedWith("INVALID MINT");

  });

  it('should transfer the nft', async () => {
    await battlePass.connect(signers[1]).transferFrom(signers[1].address, signers[0].address, 1);
    let isOwner = await battlePass.ownerOf(1);
    expect(isOwner).to.be.eql(signers[0].address);
  });

  it('should approve', async () => {
    await battlePass.connect(signers[1]).approve(signers[3].address, 2);
  });

  it('Should approve all', async () => {
    await battlePass.setApprovalForAll(signers[1].address, true);
  });

  it('Should return the proper base uri', async () => {
    await battlePass.updateBaseUri('https://dev.peanuthub.com/nft/');
    const tokenUri = await battlePass.tokenURI(1);
    expect(tokenUri).to.be.eq('https://dev.peanuthub.com/nft/1');
  });
});
