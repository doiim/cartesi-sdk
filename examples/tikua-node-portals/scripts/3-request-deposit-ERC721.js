
import {
    createPublicClient, createWalletClient, http, isAddress, parseAbi, stringToHex
} from 'viem'
import { hardhat } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import { Tikua, getCartesiContractAbi } from '@doiim/tikua'

// Grab counter address from command line arguments
const tokenAddress = process.argv[2]
if (!tokenAddress) throw new Error('Please provide a valid address for ERC721 Token contract')
if (!isAddress(tokenAddress)) throw new Error('Token contract address is not correctly formatted. Use it like: 0x59b670e9fa9d0a427751af201d676719a970857b')

// Setup private key for local test account
const testPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
const account = privateKeyToAccount(testPrivateKey)

// Defining Dapp ABI
const abi = [
    "function approve(address, uint256)",
    "function transferFrom(address, address, uint256)",
    "function ownerOf(uint256) returns (address)",
    "function getApproved(uint256) returns (address)"
];

// Create the client for local test wallet
const client = createWalletClient({
    account,
    chain: hardhat,
    transport: http(),
})

const publicClient = createPublicClient({
    chain: hardhat,
    transport: http(),
})

// Create the Tikua instance
const tikua = new Tikua({
    appEndpoint: 'http://localhost:8080',
    appAddress: '0xab7528bb862fB57E8A2BCd567a2e929a0Be56a5e',
    provider: client,
    abi: abi
})

const hashApprove = await tikua.approveERC721(tokenAddress, 0);
await publicClient.waitForTransactionReceipt({ hash: hashApprove });
console.log('Approved')

const hash = await tikua.depositERC721(tokenAddress, 0, stringToHex('test'), stringToHex('test2'));
await publicClient.waitForTransactionReceipt({ hash });
console.log('Deposit ERC721 request sent.')

console.log('Approval:',
    await publicClient.readContract({
        address: tokenAddress,
        abi: parseAbi(abi),
        functionName: 'getApproved',
        args: ['0']
    })
)

console.log('Token 0 Owner:',
    await publicClient.readContract({
        address: tokenAddress,
        abi: parseAbi(abi),
        functionName: 'ownerOf',
        args: ['0']
    })
)