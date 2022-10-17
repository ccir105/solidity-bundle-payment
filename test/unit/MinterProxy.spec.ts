import {expect} from 'chai';
import {ethers, web3} from 'hardhat';
import {MerkleTree} from 'merkletreejs';

describe.only('MinterProxy', function () {
  let minterProxy;
  let signers;

  function getMerkleTree(elements) {
    elements = elements.map((addr) => {
      return web3.utils.sha3(addr);
    });

    const tree = new MerkleTree(elements, web3.utils.sha3, {sort: true});

    return {tree, elements};
  }

  before(async () => {
    signers = await ethers.getSigners();
    const MinterProxy = await ethers.getContractFactory('MinterProxy', signers[0]);
    minterProxy = await MinterProxy.deploy();
    await minterProxy.deployed();
  });

  it('should get the total supply', async () => {
    const supply = await minterProxy.totalSupply();
    expect(supply).to.be.eq(0);
  });

  describe('whitelist mint', () => {
    let users;
    let whitelistTree;

    before(() => {
      users = signers.map((s) => s.address).slice(0, 10); //temp list: add first 10 people to whitelist
      whitelistTree = getMerkleTree(users);
    });

    it('should add users the the whitelist feature and check', async () => {
      await minterProxy.setWhitelistRoot(whitelistTree.tree.getHexRoot());

      let aWhitelistSigner: string = signers[0].address;
      let wlHexProofs = whitelistTree.tree.getHexProof(web3.utils.sha3(aWhitelistSigner));
      expect(await minterProxy.verifyIfWhiteListed(aWhitelistSigner, wlHexProofs)).to.be.eq(true);

      let noWlHexProofs = whitelistTree.tree.getHexProof(web3.utils.sha3(signers[11].address));
      expect(await minterProxy.verifyIfWhiteListed(signers[11].address, noWlHexProofs)).to.be.eq(false);
    });

    it('should mint as whitelist', async () => {

      await minterProxy.setSaleStat(1);

      const mintTx = await minterProxy.connect(signers[1]).mintForWhitelist(
          5,
          whitelistTree.tree.getHexProof(web3.utils.sha3(signers[1].address)),
          {
            value: BigInt(0.01 * 5 * 1e18),
          }
      );

      const result = await mintTx.wait();
      expect(result.events[0].args.minter).to.equal(signers[1].address);
      expect(result.events[0].args.quantity).to.equal(5);

      expect(await minterProxy.totalSupply()).to.be.eq(5);

      await minterProxy.setSaleStat(0);

      await expect(minterProxy.connect(signers[1]).mintForWhitelist(
          5,
          whitelistTree.tree.getHexProof(web3.utils.sha3(signers[1].address)),
          {
            value: BigInt(0.01 * 5 * 1e18),
          }
      )).to.be.revertedWith('WHITELIST_NOT_STARTED');

    });

    it('should mint as normal user', async () => {
      await minterProxy.setSaleStat(2);

      const mintTx = await minterProxy.connect(signers[9]).mintYourBot(
          5,
          {
            value: BigInt(0.02 * 5 * 1e18),
          }
      );

      const result = await mintTx.wait();
      expect(result.events[0].args.minter).to.equal(signers[9].address);
      expect(result.events[0].args.quantity).to.equal(5);

      expect(await minterProxy.totalSupply()).to.be.eq(10);
    })

  });
});
