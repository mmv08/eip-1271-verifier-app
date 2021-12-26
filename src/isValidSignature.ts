import { ethers } from "ethers"
import { Buffer } from "buffer"

const MAGIC_VALUE = "0x1626ba7e"
const MAGIC_VALUE_BYTES = "0x20c13b0b"

const check1271Signature = async (
  signerAddress: string,
  msgBytes: Uint8Array,
  signature: string,
  provider: ethers.providers.Provider
) => {
  const fragment = ethers.utils.FunctionFragment.from({
    constant: true,
    inputs: [
      {
        name: "message",
        type: "bytes32",
      },
      {
        name: "signature",
        type: "bytes",
      },
    ],
    name: "isValidSignature",
    outputs: [
      {
        name: "magicValue",
        type: "bytes4",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  })
  const ifc = new ethers.utils.Interface([])

  // Convert message to ETH signed message hash and call isValidSignature
  try {
    const msgHash = ethers.utils.hashMessage(msgBytes)
    const isValidSignatureData = ifc.encodeFunctionData(fragment, [
      msgHash,
      signature,
    ])
    const returnValue = (
      await provider.call({
        to: signerAddress,
        data: isValidSignatureData,
      })
    ).slice(0, 10)
    if (returnValue.toLowerCase() === MAGIC_VALUE) return true
  } catch (err) {
    console.error(err)
  }

  // If the message is a 32 bytes, try without any conversion
  if (msgBytes.length === 32) {
    try {
      const isValidSignatureData = ifc.encodeFunctionData(fragment, [
        msgBytes,
        signature,
      ])
      const returnValue = (
        await provider.call({
          to: signerAddress,
          data: isValidSignatureData,
        })
      ).slice(0, 10)
      if (returnValue.toLowerCase() === MAGIC_VALUE) return true
    } catch (err) {
      console.error(err)
    }
  }

  // Try taking a regular hash of the message
  try {
    const msgHash = ethers.utils.keccak256(msgBytes)
    const isValidSignatureData = ifc.encodeFunctionData(fragment, [
      msgHash,
      signature,
    ])
    const returnValue = (
      await provider.call({
        to: signerAddress,
        data: isValidSignatureData,
      })
    ).slice(0, 10)
    if (returnValue.toLowerCase() === MAGIC_VALUE) return true
  } catch (err) {
    console.error(err)
  }

  return false
}

const check1271SignatureBytes = async (
  signerAddress: string,
  msgBytes: Uint8Array,
  signature: string,
  provider: ethers.providers.Provider
) => {
  const fragment = ethers.utils.FunctionFragment.from({
    constant: true,
    inputs: [
      {
        name: "message",
        type: "bytes",
      },
      {
        name: "signature",
        type: "bytes",
      },
    ],
    name: "isValidSignature",
    outputs: [
      {
        name: "magicValue",
        type: "bytes4",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  })
  const ifc = new ethers.utils.Interface([])

  try {
    const isValidSignatureData = ifc.encodeFunctionData(fragment, [
      msgBytes,
      signature,
    ])
    const returnValue = (
      await provider.call({
        to: signerAddress,
        data: isValidSignatureData,
      })
    ).slice(0, 10)
    if (returnValue.toLowerCase() === MAGIC_VALUE_BYTES) return true
  } catch (err) {
    console.error(err)
  }

  return false
}

const isValidSignature = async (
  signerAddress: string,
  message: string,
  signature: string,
  provider: ethers.providers.Provider
) => {
  let msgBytes = null
  if (ethers.utils.isHexString(message)) {
    msgBytes = Buffer.from(message.substring(2), "hex")
  } else {
    msgBytes = Buffer.from(message)
  }

  // Convert Buffer to ethers bytes array
  msgBytes = ethers.utils.arrayify(msgBytes)
  const bytecode = await provider.getCode(signerAddress)

  if (
    !bytecode ||
    bytecode === "0x" ||
    bytecode === "0x0" ||
    bytecode === "0x00"
  ) {
    const sigBytes = ethers.utils.arrayify(signature)
    const msgSigner = ethers.utils.verifyMessage(msgBytes, sigBytes)
    return msgSigner.toLowerCase() === signerAddress.toLowerCase()
  } else {
    if (await check1271Signature(signerAddress, msgBytes, signature, provider))
      return true
    if (
      await check1271SignatureBytes(
        signerAddress,
        msgBytes,
        signature,
        provider
      )
    )
      return true

    return false
  }
}

export { isValidSignature }
