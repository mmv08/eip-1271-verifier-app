import { Show } from "solid-js"
import { ethers } from "ethers"
import { Container, Row, Col, Button, Card, Form } from "solid-bootstrap"
import { createStore } from "solid-js/store"

import { ConnectedWallet, useWallet } from "./walletStore"
import { isValidSignature } from "./isValidSignature"

const App = () => {
  const [wallet, { connectWallet }] = useWallet()
  const [state, setState] = createStore({
    signatureValid: false,
    formError: "",
  })

  const onSubmit = async (e: SubmitEvent) => {
    setState((s) => ({ signatureValid: false, formError: "" }))
    e.preventDefault()

    const {
      message: { value: message },
      signature: { value: signature },
      signerAddress: { value: signerAddress },
      // @ts-expect-error not sure why this is not working
    } = e.target?.elements

    if (!message) {
      setState((s) => ({ ...s, formError: "Message is required" }))
      return
    }

    if (!ethers.utils.getAddress(signerAddress)) {
      setState((s) => ({ ...s, formError: "Invalid signer address" }))
      return
    }

    if (!ethers.utils.isHexString(signature)) {
      setState((s) => ({ ...s, formError: "Signature must be a hex string" }))
      return
    }

    const signatureValid = await isValidSignature(
      signerAddress,
      message,
      signature,
      (wallet as ConnectedWallet).provider
    )
    alert(`The signature is ${signatureValid ? "valid" : "invalid"}`)
  }

  return (
    <Container fluid>
      <Row className="flex-xl-nowrap">
        <Col md={{ span: 6, offset: 3 }} as="main">
          <Card>
            <Card.Header as="h1">Validate EIP-1271 signature</Card.Header>
            <Card.Body>
              <Show
                when={wallet.loaded}
                fallback={
                  <Button onClick={connectWallet}>Connect wallet</Button>
                }
              >
                <p>
                  Connected to <b>{(wallet as ConnectedWallet).network.name}</b>{" "}
                  network with chain id{" "}
                  <b>{(wallet as ConnectedWallet).network?.chainId}</b>
                </p>
                <Form onSubmit={onSubmit}>
                  <Form.Group className="mb-3" controlId="signerAddress">
                    <Form.Label>Signer address</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter signer address"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="message">
                    <Form.Label>Message</Form.Label>
                    <Form.Control type="text" placeholder="Enter message" />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="signature">
                    <Form.Label>Signature</Form.Label>
                    <Form.Control type="text" placeholder="Enter signature" />
                  </Form.Group>
                  <Button variant="primary" type="submit">
                    Submit
                  </Button>
                  {state.formError && <p>{state.formError}</p>}
                </Form>
              </Show>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default App
