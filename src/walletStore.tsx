import { ethers } from "ethers"
import { createContext, useContext, PropsWithChildren } from "solid-js"
import { createStore } from "solid-js/store"

type ConnectedWallet = {
  loaded: true
  provider: ethers.providers.Web3Provider
  network: ethers.providers.Network
}
type DisconnectedWallet = { loaded: false; chainId?: undefined }

type WalletInfo = ConnectedWallet | DisconnectedWallet

type WalletStore = [
  WalletInfo,
  {
    connectWallet?: () => void
    disconnect?: () => void
    updateWalletDetails?: () => void
  }
]

const WalletContext = createContext<WalletStore>([{ loaded: false }, {}])

function WalletProvider(props: PropsWithChildren) {
  const [state, setState] = createStore<WalletInfo>({ loaded: false }),
    store: WalletStore = [
      state,
      {
        connectWallet: async () => {
          await window.ethereum.request({
            method: "eth_requestAccounts",
          })

          window.ethereum.on("chainChanged", store[1].updateWalletDetails)
          window.ethereum.on("disconnect", store[1].disconnect)

          const provider = new ethers.providers.Web3Provider(
            window.ethereum,
            "any"
          )
          const network = await provider.getNetwork()

          setState({
            loaded: true,
            network,
            provider,
          })
        },
        disconnect() {
          setState({ loaded: false })
        },
        async updateWalletDetails() {
          if (!state.loaded || !state.provider) {
            return
          }

          // check if account exists in case MetaMask is locked
          const account = (await state.provider.listAccounts())[0]
          const network = await state.provider.getNetwork()

          if (!account) {
            store[1].disconnect?.()
          }

          return setState((w) => ({ ...w, network }))
        },
      },
    ]

  return (
    <WalletContext.Provider value={store}>
      {props.children}
    </WalletContext.Provider>
  )
}

function useWallet() {
  return useContext(WalletContext)
}

export { WalletProvider, useWallet, ConnectedWallet }
