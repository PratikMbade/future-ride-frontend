
import { ethers } from 'ethers';
import royaltyContractAbi from './royalty-abi.json';

import { type Account } from 'thirdweb/wallets'
import { ethers5Adapter } from 'thirdweb/adapters/ethers5';
import { client, MainnetChain } from '@/lib/client';


export const ROYALTY_CONTRACT_ADDRESS = "0x95c1A8a724472725e37aaaB939c101eD0Ba9c84b"
export async function royaltyContract (activeAccount: Account){
    try {
            const signerEthers = await ethers5Adapter.signer.toEthers({
            client: client,
            chain: MainnetChain,
            account: activeAccount,
        });

        const constractInst = new ethers.Contract(
           ROYALTY_CONTRACT_ADDRESS ,
            royaltyContractAbi,
            signerEthers
        );


        return constractInst;


    } catch (error) {
        console.log('soemthing went wrong in the contractInstance',error);
    }
}