import addresses from './address.json';

async function showTxStatus(tx: any, hre: any, tag: any= '') {
    console.log('[Transaion]', tx.hash);
    let receipt = await tx.wait();
    console.log(`[Cost] ${hre.ethers.utils.formatEther(tx.gasPrice * receipt.gasUsed)} ETH`, tag);
}

async function getBubbleSale(hre) {
    return await hre.ethers.getContractAt('Bubbles', addresses.bubbleSale);
}

async function getTestToken(hre) {
    return await hre.ethers.getContractAt('MyToken', addresses.testToken);
}

export default function initTask(task: any) {
    task('pause', 'Pause all transfers ').setAction(async (taskArgs: any, hre: any) => {
        let minter = await getBubbleSale(hre);
        let tx = await minter.pause();
        await showTxStatus(tx, hre);
    });

    task('unpause', 'UnPause all transfers ').setAction(async (taskArgs: any, hre: any) => {
        let minter = await getBubbleSale(hre);
        let tx = await minter.unpause();
        await showTxStatus(tx, hre);
    });

    task('balance', 'Get Balance').setAction(async (arg: any, hre: any) => {
        const accounts = await hre.ethers.getSigners();
        for (let i = 0; i < accounts.length; i++) {
            let balance = await hre.web3.eth.getBalance(accounts[i].address);
            console.log(accounts[i].address, balance / 1e18);
        }
    });

    task('test-balance', 'Get the balance of test token')
        .addParam('address', 'Address of owner')
        .setAction(async (taskArgs: any, hre: any) => {
            let testToken = await getTestToken(hre);
            const balance = await testToken.balanceOf(taskArgs.address);
            console.log(`Balance`, hre.ethers.utils.formatUnits(balance, 6));
        })

    task('transfer-test-token', 'Transfer test token to any address')
        .addParam('address', 'Address of receiver')
        .setAction(async (taskArgs: any, hre: any) => {
            let testToken = await getTestToken(hre);
            const tx = await testToken.transfer(taskArgs.address, BigInt(1000e6))
            await showTxStatus(tx, hre);
        });

    task('approve-test-token', 'Transfer test token to any address')
        .addParam('address', 'Address of receiver')
        .setAction(async (taskArgs: any, hre: any) => {
            const accounts = await hre.ethers.getSigners();
            let singer = accounts.find(a => a.address.toLowerCase() === taskArgs.address.toLowerCase() );
            if( !singer ){
                return
            }
            let bubbleSale = await getBubbleSale(hre);
            let testToken = await getTestToken(hre);
            const approveTxs = await testToken.connect(singer).approve(bubbleSale.address, BigInt(1000000e6));
            await showTxStatus(approveTxs, hre, 'approved');
        });

    task('purchase-bubble', 'Purchase the bubble')
        .addParam('address', 'Address of buyer')
        .addParam('bundle', 'Bundle Id')
        .setAction(async (taskArgs: any, hre: any) => {
            const accounts = await hre.ethers.getSigners();
            let singer = accounts.filter(a => a.address.toLowerCase() === taskArgs.address.toLowerCase() );
            if( singer.length === 0 ){
                return
            }
            singer = singer[0];

            let bubbleSale = await getBubbleSale(hre);

            const tx = await bubbleSale.connect(singer).purchaseGemsByToken(1);
            await showTxStatus(tx, hre, 'purchased');
        });

    task('add-bundle', 'Add New Bundle')
        .setAction(async (taskArgs: any, hre: any) => {
            let bubbleSale = await getBubbleSale(hre);
            const tx = await bubbleSale.saveBundle(1, [
                BigInt(10e6),
                0,
                11,
                true,
                "Special",
                "Special Offers"
            ]);
            await showTxStatus(tx, hre, 'purchased');
        });
};
