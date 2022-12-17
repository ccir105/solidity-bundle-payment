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
    seller = await BubbleSale.deploy(signers[0].address, testToken.address, signers[0].address);
    await seller.deployed();

    await testToken.transfer(signers[1].address, BigInt(100e6));
    await testToken.transfer(signers[2].address, BigInt(100e6));

  });

  it('Should add some bundles', async () => {

    //id, price, beforeDiscount, gems, isActive, name, description
    await seller.saveBundles([1], [
        [
          BigInt(10e6),
          false,
          11,
          true,
          "Special",
          "Special Offers",
          0
      ]
    ]);

    const theBundle = await seller.getBundle(1);
    expect(theBundle.name).to.be.eq('Special');
  });

  it('Should purchase gems by bundle', async () => {

    const theBundle = await seller.getBundle(1);

    await testToken.connect(signers[1]).approve(seller.address, theBundle.price);
    const tx = await seller.connect(signers[1]).purchaseGemsByToken(1);

    const receipt = await tx.wait();
    const lastEvent = receipt.events[receipt.events.length - 1];
    expect(lastEvent.event).to.be.eq('GemsPurchased');
    expect(lastEvent.args[0]).to.be.eq(signers[1].address);
    expect(lastEvent.args[1].toString()).to.be.eq(BigInt(1).toString());
    expect(lastEvent.args[2].toString()).to.be.eq(BigInt(theBundle.gems).toString());

  });

  it('Should purchase bubbles by matic', async () => {

    const theBundle = await seller.getBundle(1);
    const amountInMatic = ethers.utils.parseEther('1.2').toString();
    const buyerAddress = signers[2].address;

    const message = ethers.utils.solidityKeccak256(['uint256', 'uint256', 'address'], [1, amountInMatic, buyerAddress]);
    const signature = await signers[0].signMessage(ethers.utils.arrayify(message));

    const tx = await seller.connect(signers[2]).purchaseGemsByEth(1, amountInMatic, signature, {
      value: amountInMatic
    });

    const receipt = await tx.wait();
    const lastEvent = receipt.events[receipt.events.length - 1];
    expect(lastEvent.event).to.be.eq('GemsPurchased');
    expect(lastEvent.args[0]).to.be.eq(signers[2].address);
    expect(lastEvent.args[1].toString()).to.be.eq(BigInt(1).toString());
    expect(lastEvent.args[2].toString()).to.be.eq(BigInt(theBundle.gems).toString());
  });

  it('should deactivate bundles', async () => {
    const bundles = await seller.getBundles();
    await seller.deleteBundle( bundles[0] );
    const bundle = await seller.getBundle(bundles[0]);
    expect(bundle.isActive).to.be.eq(false);
  });

  it('should update the bundle', async () => {
    const bundles = await seller.getBundles();
    await seller.updateABundle( bundles[0], [
      BigInt(10e6),
      false,
      11,
      true,
      "Special DK",
      "Special Offers",
      0
    ]);

    const bundle = await seller.getBundle(bundles[0]);
    expect(bundle.name).to.be.eq("Special DK");
  })
});
