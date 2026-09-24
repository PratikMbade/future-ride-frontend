
import { ethers } from 'ethers';
import dailyRoyaltyPoolContractAbi from './daily-royalty-pool-abi.json';

import { type Account } from 'thirdweb/wallets'
import { ethers5Adapter } from 'thirdweb/adapters/ethers5';
import { client, MainnetChain } from '@/lib/client';


export const DAILY_ROYALTY_POOL_CONTRACT_ADDRESS = "0xCD1eD6Ab717601b49583aeaBB43c822F08616c2e"
export async function dailyRoyaltyPoolContract (activeAccount: Account){
    try {
            const signerEthers = await ethers5Adapter.signer.toEthers({
            client: client,
            chain: MainnetChain,
            account: activeAccount,
        });

        const constractInst = new ethers.Contract(
           DAILY_ROYALTY_POOL_CONTRACT_ADDRESS ,
            dailyRoyaltyPoolContractAbi,
            signerEthers
        );


        return constractInst;


    } catch (error) {
        console.log('soemthing went wrong in the contractInstance',error);
    }
}