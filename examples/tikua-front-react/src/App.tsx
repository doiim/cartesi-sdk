import { useEffect, useState } from 'react'
import './App.css'
import Onboard, { WalletState } from '@web3-onboard/core'
import injectedModule from '@web3-onboard/injected-wallets'
import { Tikua, Address } from '@doiim/tikua'
import ReactJson from '@vahagn13/react-json-view'
import logo from './assets/logo.png'

// Add property to allow JSON to be serialized on the frontend
// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() }

// Web3Onboard module for injected wallets
const injected = injectedModule()

// Instantiating Web3Onboard
const onboard = Onboard({
  wallets: [injected],
  chains: [
    {
      id: '0x7A69',
      token: 'ETH',
      label: 'Local Sunodo',
      rpcUrl: 'http://localhost:8545'
    }
  ]
})

// Defining Dapp ABI
const abi = [
  "struct Dragon { uint256 id; uint256 life; }",
  "function attackDragon(uint256 dragonId)",
  "function drinkPotion()",
  "function heroStatus(address player) returns (uint256)",
  "function dragonStatus(uint256 dragonId) returns (uint256)",
  "function dragonsList() returns (Dragon[])",
];

function App() {

  const [wallets, setWallets] = useState<WalletState[]>([])
  const [dragonId, setDragonId] = useState<number>(0)
  const [message, setMessage] = useState<object>({})
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false)

  useEffect(() => {
    const state = onboard.state.select()
    const { unsubscribe } = state.subscribe((update) => {
      setWallets(update.wallets)
    })
    // Add listener to update styles
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => setIsDarkMode(e.matches ? true : false));

    // Setup dark/light mode for the first time
    setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches ? true : false)

    // Remove listener
    return () => {
      // unsubscribe()
      window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', () => { })
    }
  }, [])

  const connectWallet = async () => {
    setWallets(await onboard.connectWallet())
    startSubscription();
  }

  const attackDragon = async (e: any) => {
    e.preventDefault()
    const tikua = new Tikua({
      provider: onboard.state.get().wallets[0].provider,
      appAddress: '0xab7528bb862fB57E8A2BCd567a2e929a0Be56a5e',
      signerAddress: wallets[0].accounts[0].address as Address,
      abi
    })
    await tikua.sendInput('attackDragon', [dragonId])
  }

  const drinkPotion = async () => {
    const tikua = new Tikua({
      provider: onboard.state.get().wallets[0].provider,
      appAddress: '0xab7528bb862fB57E8A2BCd567a2e929a0Be56a5e',
      signerAddress: wallets[0].accounts[0].address as Address,
      abi
    })
    await tikua.sendInput('drinkPotion', [])
  }

  const checkLife = async () => {
    const tikua = new Tikua({
      appEndpoint: 'http://localhost:8080',
      abi
    })
    const status = await tikua.fetchInspect('heroStatus', [wallets[0].accounts[0].address as Address])
    setMessage({
      life: status
    })
  }

  const checkDragon = async (e: any) => {
    e.preventDefault()
    const tikua = new Tikua({
      appEndpoint: 'http://localhost:8080',
      abi: abi
    })
    const status = await tikua.fetchInspect('dragonStatus', [dragonId])
    setMessage({
      dragonId: dragonId,
      status: status
    });
  }

  const dragonsList = async (e: any) => {
    e.preventDefault()
    const tikua = new Tikua({
      appEndpoint: 'http://localhost:8080',
      abi: abi
    })
    const status = await tikua.fetchInspect('dragonsList', []) as any[]
    setMessage(status);
  }

  /**
   * This function starts a subscription by creating a new CartesiSDK instance
   * and adding a notices listener that updates the message state.
   *
   * @return {Promise<void>} Returns a Promise that resolves when the notices listener is added.
   */
  const startSubscription = async () => {
    const tikua = new Tikua({
      appEndpoint: 'http://localhost:8080',
      abi: abi
    })
    return tikua.addMyNoticesListener(
      1000,
      onboard.state.get().wallets[0].accounts[0].address as Address,
      (e) => setMessage(e)
    )
  }

  return (
    <>
      <img src={logo} width={200} height={200}></img>
      <h1>Tikua</h1>
      <p>an isomorphic Cartesi SDK</p>
      <div className="card">
        {wallets.length == 0 ?
          <button onClick={connectWallet}>Connect Wallet</button>
          : <p>Wallet: <span className='orange'>{wallets[0].accounts[0].address}</span></p>}
        {wallets.length > 0 ? <>
          <div className='heroCommands'>
            <div>
              <button onClick={drinkPotion}>Drink Potion</button>
              <p>
                <strong>Drink Potion:</strong> This is a write request that sends an
                input to the dApp, triggering the advance execution, which will
                generate notices.
              </p>
            </div>
            <div>
              <button onClick={checkLife}>Check Hero Status</button>
              <p>
                <strong>Check Health:</strong> This is a read-only request that sends
                an inspect request to the dApp and retrieves a report on the health
                status.
              </p>
            </div>
          </div>
          <div className='dragonCommands'>
            <button onClick={dragonsList}>List Dragons</button>
            <p>
              <strong>List All Dragons and Check Health:</strong> This is a
              read-only request that sends an inspect request to the dApp and
              retrieves a report with all dragons.
            </p>

            <form>
              <label>
                <span>Dragon Id</span>
                <input type="number" onChange={(e) => setDragonId(Number(e.target.value))} />
              </label>
              {dragonId >= 0 ? <input type="submit" value="Dragon Status" onClick={checkDragon} /> : null}
              {dragonId >= 0 ? <input type="submit" value="Attack Dragon" onClick={attackDragon} /> : null}
            </form>
            <p>
              <strong>Attack:</strong> This is a write request that sends an input
              to the dApp, triggering the advance execution, which will generate
              notices.
            </p>
          </div>
          <div className='message'>
            <ReactJson theme={isDarkMode ? "monokai" : "bright:inverted"} displayDataTypes={false} src={message} style={{ color: 'rgb(253, 151, 31)' }} />
          </div>
        </> : null}
      </div>
    </>
  )
}

export default App