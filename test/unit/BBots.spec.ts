import {expect} from 'chai';
import {ethers} from 'hardhat';

describe('BBots', function () {
  let minter;
  let signers;

  before(async () => {
    signers = await ethers.getSigners();
    const Minter = await ethers.getContractFactory('BBots', signers[0]);
    minter = await Minter.deploy(signers[0].address);
    await minter.deployed();
  });

  it('Should have the total nft supply', async () => {
    var totalSupply = await minter.totalSupply();
    expect(totalSupply).to.be.eq(0);
  });

  it('Should mint some nfts', async () => {
    await minter.connect(signers[0]).mintBBots(5, signers[1].address);
    const balance = await minter.balanceOf(signers[1].address);
    expect(balance).to.be.eq(5);
  });

  it('should transfer the nft', async () => {
    let myTokens = await minter.tokensOfOwner(signers[1].address);
    await minter.connect(signers[1]).transferFrom(signers[1].address, signers[0].address, myTokens[0].toNumber());
    let isOwner = await minter.ownerOf(myTokens[0].toNumber());
    expect(isOwner).to.be.eql(signers[0].address);
  });

  it('should approve', async () => {
    let myTokens = await minter.tokensOfOwner(signers[1].address);
    await minter.connect(signers[1]).approve(signers[3].address, myTokens[1].toString());
  });

  it('Should approve all', async () => {
    await minter.setApprovalForAll(signers[1].address, true);
  });

  it('Should return the proper base uri', async () => {
    await minter.updateBaseUri('https://dev.peanuthub.com/nft/');
    const tokenUri = await minter.tokenURI(1);
    expect(tokenUri).to.be.eq('https://dev.peanuthub.com/nft/1.json');
  });
});
