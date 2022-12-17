import addresses from './address.json';

async function showTxStatus(tx: any, hre: any, tag: any= '') {
    console.log('[Transaion]', tx.hash);
    let receipt = await tx.wait();
    console.log(`[Cost] ${hre.ethers.utils.formatEther(tx.gasPrice * receipt.gasUsed)} ETH`, tag);
}

async function getBubbleSale(hre) {
    return await hre.ethers.getContractAt('Bubbles', addresses[hre.network.name].bubbleSale);
}

async function getTestToken(hre) {
    return await hre.ethers.getContractAt('MyToken', addresses[hre.network.name].maticUsdc);
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
            if( hre.network.name == 'live' ) return;
            let testToken = await getTestToken(hre);
            const balance = await testToken.balanceOf(taskArgs.address);
            console.log(`Balance`, hre.ethers.utils.formatUnits(balance, 6));
        })

    task('transfer-test-token', 'Transfer test token to any address')
        .addParam('address', 'Address of receiver')
        .setAction(async (taskArgs: any, hre: any) => {
            if( hre.network.name == 'live' ) return;
            let testToken = await getTestToken(hre);
            const tx = await testToken.transfer(taskArgs.address, BigInt(1000e6))
            await showTxStatus(tx, hre);
        });

    task('approve-test-token', 'Transfer test token to any address')
        .addParam('address', 'Address of receiver')
        .setAction(async (taskArgs: any, hre: any) => {
            if( hre.network.name == 'live' ) return;
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
            if( hre.network.name == 'live' ) return;
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

                const serverBundles = [{
                    "expiredAt": null,
                    "_id": "6391d3b2c8c2f5389bc4f875",
                    "name": "light pack",
                    "description": "1usd and get 1gems",
                    "position": 0,
                    "isActive": true,
                    "isPromotion": false,
                    "price": 1,
                    "gems": 1,
                    "bundleId": 139305626
                },
                {
                    "expiredAt": null,
                    "_id": "6391d3e6c8c2f5389bc4f876",
                    "name": "medium pack",
                    "description": "4.99usd and get 6gems",
                    "position": 1,
                    "isActive": true,
                    "isPromotion": false,
                    "price": 4.99,
                    "gems": 6,
                    "bundleId": 715726682
                },
                {
                    "expiredAt": null,
                    "_id": "6391d43dc8c2f5389bc4f877",
                    "name": "pre pack",
                    "description": "19.99usd and get 25gems",
                    "position": 2,
                    "isActive": true,
                    "isPromotion": false,
                    "price": 19.99,
                    "gems": 25,
                    "bundleId": 701594013
                },
                {
                    "expiredAt": null,
                    "_id": "639ca38b29650c1c0cab7777",
                    "name": "pro pack",
                    "description": "49.99usd and get 70gems",
                    "position": 5,
                    "isActive": true,
                    "isPromotion": false,
                    "price": 49.99,
                    "gems": 70,
                    "bundleId": 701894013
                }]

            const ids = serverBundles.map(bundle => BigInt(bundle.bundleId))
            const bundleData = serverBundles.map(bundle => ([
                BigInt(bundle.price * 1e6),
                false,
                bundle.gems,
                true,
                bundle.name,
                bundle.description,
                bundle.expiredAt ? bundle.expiredAt : 0
            ]))

            let tx = await bubbleSale.saveBundles(ids, bundleData);

            await showTxStatus(tx, hre, 'bundleAdded');

        });

    task('get-bundels', 'GEt All bundles')
        .setAction(async (taskArgs: any, hre: any) => {
            let bubbleSale = await getBubbleSale(hre);
            console.log(await bubbleSale.getBundles());
        })

    task('delete-bundles', 'Delete All BUndles')
        .addParam('bundleId', 'Bundle Id')
        .setAction(async (taskArgs: any, hre:any) => {
            let bubbleSale = await getBubbleSale(hre);
            const tx = await bubbleSale.deleteBundle(taskArgs.bundleId);
            await showTxStatus(tx, hre, 'bundleAdded');
        });

    task('get-bundle-info', 'Get BUndle Info')
        .addParam('bundle', 'Bundle Id')
        .setAction(async (taskArgs: any, hre:any) => {
            let bubbleSale = await getBubbleSale(hre);
            const info = await bubbleSale.getBundle(taskArgs.bundle);
           console.log(info)
        });
};
