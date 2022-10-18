import {expect} from 'chai';
import {ethers, web3} from 'hardhat';
import {MerkleTree} from 'merkletreejs';
import fs from 'fs';

describe('MinterProxy', function () {
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

      const mintTx = await minterProxy.connect(signers[1]).mintForWhitelist(
          4,
          whitelistTree.tree.getHexProof(web3.utils.sha3(signers[1].address)),
          {
            value: BigInt(0.01 * 4 * 1e18),
          }
      );

      const result = await mintTx.wait();

      const botMinted = result.events.filter(ev => ev.topics[0] == transferSig);

      if(botMinted.length) {
        console.log(`Bot Minted`, botMinted.length)
      }

      totalBotMints += botMinted.length;

      expect(await minterProxy.totalSupply()).to.be.eq(4);

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

      for(let i = 0; i < 199; i++) {
        const mintTx = await minterProxy.connect(signers[9]).mintYourBot(
            5,
            {
              value: BigInt(0.02 * 5 * 1e18),
            }
        );

        const result = await mintTx.wait();

        const botMinted = result.events.filter(ev => ev.topics[0] == transferSig);

        if(botMinted.length) {
          console.log(i, `Bot Minted`, botMinted.length)
        }

        totalBotMints += botMinted.length;
      }

      console.log("Out of total 999" ,totalBotMints, "Minted");

    })

  });
});
