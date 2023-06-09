// @ts-ignore
import addresses from './address.json';
import {ethers} from "ethers";
import fs from "fs";
import readXlsxFile from "read-excel-file/node";
import writeXlsxFile from "write-excel-file/node";
import {MerkleTree} from 'merkletreejs';

async function showTxStatus(tx: any, hre: any) {
  console.log('[Transaction]', tx.hash);
  let receipt = await tx.wait();
  console.log(`[Cost] ${ethers.utils.formatEther(tx.gasPrice * receipt.gasUsed)} ETH`);
}

async function getMinter(hre) {
  return await hre.ethers.getContractAt('MinterProxy', addresses.minter);
}

async function getBattlePass(hre) {
    return await hre.ethers.getContractAt('BattlePass', addresses.battlePass);
}

async function getCollection(hre) {
    return await hre.ethers.getContractAt('BBots', addresses.collection);
}

export default function initTask(task: any) {

    task('withdraw', 'Withdraw ether from minter contract').setAction(async (arg: any, hre: any) => {
        let minter = await getMinter(hre);
        let tx = await minter.withdraw();
        await showTxStatus(tx);
    });

    task('balance', 'Get Balance').setAction(async (arg: any, hre: any) => {
        const accounts = await hre.ethers.getSigners();
        for (let i = 0; i < accounts.length; i++) {
            let balance = await hre.web3.eth.getBalance(accounts[i].address);
            console.log(accounts[i].address, balance / 1e18);
        }
    });


  task('start-public', 'Start The public sale').setAction(async (taskArgs: any, hre: any) => {
    let minter = await getMinter(hre);
    let tx = await minter.setSaleStat(2);
    await showTxStatus(tx);
  });

  task('sale-stop', 'stop all the sale').setAction(async (taskArgs: any, hre: any) => {
    let minter = await getMinter(hre);
      let tx = await minter.setSaleStat(0);
    await showTxStatus(tx);
  });

  task('sale-whitelist', 'start whitelist sale').setAction(async (taskArgs: any, hre: any) => {
        let minter = await getMinter(hre);
        let tx = await minter.setSaleStat(1);
        await showTxStatus(tx);
  });


  task('add-seeds', 'Add the generated seed for minting')
    .setAction(async (taskArgs: any, hre: any) => {
       let minter = await getMinter(hre);
       const seeds = JSON.parse(
           fs.readFileSync('./tasks/seeds.json').toString()
       )
        seeds.robots = seeds.robots.map(p => parseInt(p));
        const tx = await minter.addSeeds(
            seeds.robots
        );
      await showTxStatus(tx);
    });

   task('add-minter', 'Add the minter to collection')
       .setAction(async (taskArgs: any, hre: any) => {
           const collection = await getCollection(hre)
           const tx = await collection.setMinter(addresses.minter);
           await showTxStatus(tx);
       })

  task('update-collection-url', 'Update the base uri for the metadata')
    .addParam('url', 'New Base Url eg. ipfs ')
    .setAction(async (arg: any, hre: any) => {
      let minter = await getMinter(hre);
      let tx = await minter.updateBaseUri(arg.cid);
      await showTxStatus(tx);
    });

  task('update-battlepass-url', 'Update the base uri for the metadata')
      .addParam('url', 'New Base Url eg. ipfs ')
        .setAction(async (arg: any, hre: any) => {
            let minter = await getBattlePass(hre);
            let tx = await minter.updateBaseUri(arg.cid);
            await showTxStatus(tx);
        });

  task('add-whitelist', 'Add Users To Whitelist')
      .setAction(async (arg: any, hre: any) => {
            let accounts = JSON.parse(fs.readFileSync('./tasks/whitelist.json').toString())
            accounts = accounts.map(address => {
                  return ethers.utils.keccak256(address);
              });
            const tree = new MerkleTree(accounts, ethers.utils.keccak256, {sort: true});
            const root = tree.getHexRoot()

           const minter = await getMinter(hre);
           let tx = await minter.setWhitelistRoot(root);
           await showTxStatus(tx);
      })

  task('get-whitelist-proof', 'Get Whitelist Proofs')
      .addParam('address', 'Address to get proof')
      .setAction(async (arg: any, hre: any) => {

          let accounts = JSON.parse(fs.readFileSync('./tasks/whitelist.json').toString())
          accounts = accounts.map(address => {
              return ethers.utils.keccak256(address);
          });
          const tree = new MerkleTree(accounts, ethers.utils.keccak256, {sort: true});
          const proof = tree.getHexProof(ethers.utils.keccak256(arg));
          console.log(proof)
      });

  task('test', 'Add Random Scripts')
      .setAction(async (arg: any, hre: any) => {
          let benExcel = await readXlsxFile('./tasks/wl.xlsx');
          benExcel.shift()
          const fthContact = await hre.ethers.getContractAt('BBots', "0xde57e569c89194aaf25a36a61c8f1cf3be0f0262");
          const parsedData = benExcel.map(rows => rows[0])

          const ftbBalanceSchema = [
              {
                  column: "Address",
                  type: String,
                  value: (nft) => nft.address,
              },
              {
                  column: "Balance",
                  type: Number,
                  value: (nft) => nft.balance,
              },
          ]

          const list: any = []

          for(let i = 0; i < parsedData.length; i++) {
           const balance = await fthContact.balanceOf(parsedData[i]);
           list.push({
               address: parsedData[i],
               balance: balance.toNumber()
           })
          }

          await writeXlsxFile(list, {
              schema: ftbBalanceSchema,
              filePath: "./tasks/wlBalance.xlsx",
          });
      });
}
