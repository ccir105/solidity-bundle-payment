import {expect} from 'chai';
import {ethers} from 'hardhat';


describe('Contract Bubbles', function () {
  let seller;
  let signers;
  let testToken;

  before(async () => {
    signers = await ethers.getSigners();
    const BubbleSale = await ethers.getContractFactory('Bubbles', signers[0]);
    const TestToken = await ethers.getContractFactory('MyToken');
    testToken = await TestToken.deploy();
    seller = await BubbleSale.deploy(signers[0].address, testToken.address);
    await seller.deployed();
  });

  it('Should purchase bubbles', async () => {
    await testToken.transfer(signers[1].address, BigInt(100e6));
    await testToken.connect(signers[1]).approve(seller.address, BigInt(10e6));
    const tx = await seller.connect(signers[1]).purchaseBubblesByUSD(BigInt(10e6));
    const receipt = await tx.wait();
    expect(receipt.events[2].event).to.be.eq('BubbleBotPurchased');
    expect(receipt.events[2].args[0]).to.be.eq(signers[1].address);
    expect(receipt.events[2].args[1].toString()).to.be.eq(BigInt(10e6).toString());
    expect(receipt.events[2].args[2]).to.be.eq(true);
  });

  it('should purchase bubbles by matic', async () => {
    const tx = await seller.connect(signers[1]).purchaseBubblesWithMatic(BigInt(1 * 1e18), {
      value: BigInt(1 * 1e18)
    });
    const receipt = await tx.wait();
    expect(receipt.events[0].event).to.be.eq('BubbleBotPurchased');
    expect(receipt.events[0].args[0]).to.be.eq(signers[1].address);
    expect(receipt.events[0].args[1].toString()).to.be.eq(BigInt(1 * 1e18).toString());
    expect(receipt.events[0].args[2]).to.be.eq(false);
  });
});
