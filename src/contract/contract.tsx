import { type Account } from 'thirdweb/wallets'
import { ethers5Adapter } from 'thirdweb/adapters/ethers5';
import { client, MainnetChain } from '@/lib/client';
import { ethers } from 'ethers';
import FUTUR_RIDE_CONTRACT_ABI from './futurerideContract.abi.json'

export const  FUTURE_RIDE_CONTRACT_ADDRESS = "0x7380F66a88a8959F3877ee375573C3F3b1378EBe"

export async function contractInstance (activeAccount: Account){
    try {
            const signerEthers = await ethers5Adapter.signer.toEthers({
            client: client,
            chain: MainnetChain,
            account: activeAccount,
        });

        const constractInst = new ethers.Contract(
            FUTURE_RIDE_CONTRACT_ADDRESS,
            FUTUR_RIDE_CONTRACT_ABI,
            signerEthers
        );


        return constractInst;


    } catch (error) {
        console.log('soemthing went wrong in the contractInstance',error);
    }
}