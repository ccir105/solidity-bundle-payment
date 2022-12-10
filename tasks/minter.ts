// @ts-ignore
import addresses from './address.json';
var keccak256 = require('keccak256');

async function showTxStatus(tx: any, hre: any) {
  console.log('[Transaction]', tx.hash);
  let receipt = await tx.wait();
  console.log(`[Cost] ${hre.ethers.utils.formatEther(tx.gasPrice * receipt.gasUsed)} ETH`);
}

async function getMinter(hre) {
  return await hre.ethers.getContractAt('BubbleBots', addresses.minter);
}

export default function initTask(task: any) {
  task('pause', 'Pause all transfers ').setAction(async (taskArgs: any, hre: any) => {
    let minter = await getMinter(hre);
    var tx = await minter.pause();
    await showTxStatus(tx, hre);
  });

  task('unpause', 'UnPause all transfers ').setAction(async (taskArgs: any, hre: any) => {
    let minter = await getMinter(hre);
    var tx = await minter.unpause();
    await showTxStatus(tx, hre);
  });

  task('set-minter', 'Assign the role minter')
    .addParam('address', 'Address of new minter')
    .setAction(async (taskArgs: any, hre: any) => {
      let minter = await getMinter(hre);
      var tx = await minter.grantRole(keccak256('MINTER_ROLE'), taskArgs.address);
      await showTxStatus(tx, hre);
    });

  task('withdraw', 'Withdraw ether from minter contract').setAction(async (arg: any, hre: any) => {
    let minter = await getMinter(hre);
    var tx = await minter.withdraw();
    await showTxStatus(tx, hre);
  });

  task('balance', 'Get Balance').setAction(async (arg: any, hre: any) => {
    const accounts = await hre.ethers.getSigners();
    for (var i = 0; i < accounts.length; i++) {
      var balance = await hre.web3.eth.getBalance(accounts[i].address);
      console.log(accounts[i].address, balance / 1e18);
    }
  });

  task('migrate-ipfs', 'Update the base uri')
    .addParam('url', 'New Base Url eg. ipfs ')
    .setAction(async (arg: any, hre: any) => {
      let minter = await getMinter(hre);
      var tx = await minter.updateBaseUri(arg.cid);
      await showTxStatus(tx, hre);
    });

  task('pre-mint', 'Mint collection by a minter')
    .addParam('num', 'Total number of nft')
    .setAction(async (taskArgs: any, hre: any) => {
      let minter = await getMinter(hre);
      var tx = await minter.mintBubbleBots(taskArgs.num);
      await showTxStatus(tx, hre);
    });
}
