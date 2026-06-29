import { createThirdwebClient, defineChain } from "thirdweb";

// Replace this with your client ID string
// refer to https://portal.thirdweb.com/typescript/v5/client on how to get a client ID
const clientId = import.meta.env.VITE_THIRDWEB_CLIENT_ID;

if (!clientId) {
  throw new Error("No client ID provided");
}

export const client = createThirdwebClient({
  clientId: clientId,
});



export const MainnetChain = defineChain({
  id: 56, // BNB Mainnet chain ID
  rpc: "https://bsc-dataseed.binance.org/", // RPC URL for BNB Mainnet
  nativeCurrency: {
    name: "Binance Coin",
    symbol: "BNB",
    decimals: 18,
  },
});

export const TestnetChain = defineChain({
  id: 97, // BNB Testnet chain ID
  rpc: "https://data-seed-prebsc-1-s1.binance.org:8545/", // RPC URL for BNB Testnet
  nativeCurrency: {
    name: "Binance Coin",
    symbol: "BNB",
    decimals: 18,
  },
});


export const opBNBChain = defineChain({
  id: 204, // BNB Testnet chain ID
  rpc: "https://opbnb-mainnet-rpc.bnbchain.org/", // RPC URL for BNB Testnet
  nativeCurrency: {
    name: "op Binanc Coin",
    symbol: "BNB",
    decimals: 18,
  },
});

export const PolygonMainnetChain = defineChain({
  id: 137, // Polygon Mainnet chain ID
  rpc: 'https://polygon-rpc.com/', // RPC URL for Polygon Mainnet
  nativeCurrency: {
    name: 'Polygon',
    symbol: 'MATIC',
    decimals: 18,
  },
});


export const opBNBchainId = opBNBChain;


export const chainId = MainnetChain;


export const blockchainId = opBNBChain;
