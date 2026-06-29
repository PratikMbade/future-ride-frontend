import { type Account } from 'thirdweb/wallets'
import { ethers5Adapter } from 'thirdweb/adapters/ethers5';
import { client, MainnetChain } from '@/lib/client';
import { ethers } from 'ethers';
import USDT_CONTRACT_ABI from './usdtContract.abi.json'

// export const  USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955"
export const  USDT_ADDRESS ="0xBe9a1d75c68cfA6E558E597CAf538376708862c4"

export async function usdtContractInstance (activeAccount: Account){
    try {
            const signerEthers = await ethers5Adapter.signer.toEthers({
            client: client,
            chain: MainnetChain,
            account: activeAccount,
        });

        const constractInst = new ethers.Contract(
            USDT_ADDRESS,
            USDT_CONTRACT_ABI,
            signerEthers
        );


        return constractInst;


    } catch (error) {
        console.log('soemthing went wrong in the usdtContractInstance',error);
    }
}