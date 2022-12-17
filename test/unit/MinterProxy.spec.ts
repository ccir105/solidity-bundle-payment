import {expect} from 'chai';
import {ethers, web3} from 'hardhat';
import {MerkleTree} from 'merkletreejs';
import fs from 'fs';

describe.skip('MinterProxy', function () {
  this.timeout(100000000);
  let minterProxy;
  let signers;
  let bubbleBot;

  function getMerkleTree(elements) {
    elements = elements.map(address => {
      return web3.utils.sha3(address);
    });

    const tree = new MerkleTree(elements, web3.utils.sha3, {sort: true});

    return {tree, elements};
  }

  before(async () => {

    signers = await ethers.getSigners();

    const BubbleBot = await ethers.getContractFactory('BBots', signers[0]);
    bubbleBot = await BubbleBot.deploy(333, signers[0].address);
    await bubbleBot.deployed()

    const MinterProxy = await ethers.getContractFactory('MinterProxy', signers[0]);
    minterProxy = await MinterProxy.deploy(bubbleBot.address);
    await minterProxy.deployed();

    await bubbleBot.setMinter(minterProxy.address)
  });

  it('should get the total supply', async () => {
    const supply = await minterProxy.totalSupply();
    expect(supply).to.be.eq(0);
  });

  it('should add the seed', async () => {
    const seeds = JSON.parse(fs.readFileSync('./scripts/seeds.json').toString());
    seeds.robots = seeds.robots.map(p => parseInt(p));
    await minterProxy.addSeeds(seeds.robots);
  });

  describe('whitelist mint', () => {
    let users;
    let whitelistTree;
    let totalBotMints = 0;

    let transferSig = web3.utils.sha3("Transfer(address,address,uint256)");

    before(() => {
      users = signers.map((s) => s.address).slice(0, 10); //temp list: add first 10 people to whitelist
      whitelistTree = getMerkleTree(users);
    });

    it('should add users in the whitelist and test', async () => {

      await minterProxy.setWhitelistRoot(whitelistTree.tree.getHexRoot());

      let aWhitelistSigner: string = signers[0].address;

      let wlHexProofs = whitelistTree.tree.getHexProof(web3.utils.sha3(aWhitelistSigner));

      expect(await minterProxy.verifyIfWhiteListed(aWhitelistSigner, wlHexProofs)).to.be.eq(true);

      let noWlHexProofs = whitelistTree.tree.getHexProof(web3.utils.sha3(signers[11].address));

      expect(await minterProxy.verifyIfWhiteListed(signers[11].address, noWlHexProofs)).to.be.eq(false);

    });

    it('should mint as whitelist', async () => {

      await minterProxy.setSaleStat(1);

      await minterProxy.connect(signers[1]).mintForWhitelist(
          1,
          whitelistTree.tree.getHexProof(web3.utils.sha3(signers[1].address)),
          {
            value: BigInt(0.01 * 1e18),
          }
      );

      expect(await minterProxy.totalSupply()).to.be.eq(1);

      await minterProxy.setSaleStat(0);

      await expect(minterProxy.connect(signers[1]).mintForWhitelist(
          1,
          whitelistTree.tree.getHexProof(web3.utils.sha3(signers[1].address)),
          {
            value: BigInt(0.01 * 1e18),
          }
      )).to.be.revertedWith('WHITELIST_NOT_STARTED');

    });

    it('should test massive mint as normal user', async () => {
      await minterProxy.setSaleStat(2);

      //as 1 nft is minted when whitelist sale was opened
      for(let i = 0; i < 998; i++) {

        let _signer = signers[ Math.floor(Math.random() * signers.length) ];

        await minterProxy.connect(_signer).mintYourBot(
            1,
            {
              value: BigInt(0.02 * 1e18),
            }
        );
      }

      await expect(minterProxy.connect(signers[1]).mintYourBot(
          1,
          {
            value: BigInt(0.01 * 1e18),
          }
      )).to.be.revertedWith('EXCEEDS_MAX_SUPPLY');

      expect(await bubbleBot.totalSupply()).to.be.eq(333);

    })

  });
});
