import { render } from "solid-js/web"
import { WalletProvider } from "./walletStore"

import "./index.css"
import App from "./App"

render(
  () => (
    <WalletProvider>
      <App />
    </WalletProvider>
  ),
  document.getElementById("root") as HTMLElement
)
