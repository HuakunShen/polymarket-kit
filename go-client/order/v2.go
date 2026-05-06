// V2 EIP-712 typed data + signing for Polymarket CTF Exchange.
//
// The CLOB migrated to V2 orders; V1-shaped orders are rejected with
// `order_version_mismatch`. The V2 EIP-712 struct dropped taker / nonce /
// feeRateBps and added timestamp / metadata / builder. The domain version
// also bumped from "1" to "2".
//
// Reference (canonical):
//   vendors/polymarket-kit/vendors/clob-client-v2/src/order-utils/model/
//     ctfExchangeV2TypedData.ts
//   vendors/polymarket-kit/vendors/clob-client-v2/src/order-utils/
//     exchangeOrderBuilderV2.ts
package order

import (
	"crypto/ecdsa"
	"encoding/hex"
	"fmt"
	"math/big"
	"strings"

	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/polymarket/go-order-utils/pkg/eip712"
	"github.com/polymarket/go-order-utils/pkg/signer"
)

// V2 verifying contracts (same on Polygon mainnet and Amoy testnet).
// Distinct from the V1 CTF Exchange addresses returned by go-order-utils'
// utils.GetVerifyingContractAddress — using the V1 address as the V2
// EIP-712 verifyingContract produces a wrong domain separator and the CLOB
// rejects the order with HTTP 400 "invalid signature".
//
// Reference: vendors/polymarket-kit/vendors/clob-client-v2/src/config.ts
var (
	v2CTFExchange        = common.HexToAddress("0xE111180000d2663C0091e4f400237545B87B996B")
	v2NegRiskCTFExchange = common.HexToAddress("0xe2222d279d744050d28e00520010520000310F59")
)

// v2VerifyingContract returns the V2 exchange contract address for the given
// chain. Currently the V2 contracts are deployed at the same address on
// Polygon mainnet (137) and Amoy testnet (80002); we reject other chains
// rather than silently using a wrong address.
func v2VerifyingContract(chainID int64, negRisk bool) (common.Address, error) {
	if chainID != 137 && chainID != 80002 {
		return common.Address{}, fmt.Errorf("unsupported chain id %d for V2 (expected 137 or 80002)", chainID)
	}
	if negRisk {
		return v2NegRiskCTFExchange, nil
	}
	return v2CTFExchange, nil
}

// Bytes32Zero is the canonical 32-byte zero used for empty metadata / builder.
const Bytes32Zero = "0x0000000000000000000000000000000000000000000000000000000000000000"

var (
	v2ProtocolName    = crypto.Keccak256Hash([]byte("Polymarket CTF Exchange"))
	v2ProtocolVersion = crypto.Keccak256Hash([]byte("2"))
	v2OrderTypehash   = crypto.Keccak256Hash([]byte(
		"Order(uint256 salt,address maker,address signer,uint256 tokenId,uint256 makerAmount,uint256 takerAmount,uint8 side,uint8 signatureType,uint256 timestamp,bytes32 metadata,bytes32 builder)",
	))
	v2OrderStructure = []abi.Type{
		eip712.Bytes32, // typehash
		eip712.Uint256, // salt
		eip712.Address, // maker
		eip712.Address, // signer
		eip712.Uint256, // tokenId
		eip712.Uint256, // makerAmount
		eip712.Uint256, // takerAmount
		eip712.Uint8,   // side
		eip712.Uint8,   // signatureType
		eip712.Uint256, // timestamp
		eip712.Bytes32, // metadata
		eip712.Bytes32, // builder
	}
)

// v2OrderInputs is the fully-resolved set of inputs that go into both the
// EIP-712 hash and the wire body. Pulled out so tests can drive a
// deterministic golden vector without going through float math.
type v2OrderInputs struct {
	ChainID       int64
	NegRisk       bool
	Salt          *big.Int
	Maker         common.Address
	Signer        common.Address
	TokenID       *big.Int
	MakerAmount   *big.Int
	TakerAmount   *big.Int
	Side          uint8 // 0=BUY, 1=SELL
	SignatureType uint8
	Timestamp     *big.Int // unix milliseconds (matches TS Date.now())
	Metadata      [32]byte
	Builder       [32]byte
}

// hashV2Order returns (domainSeparator, orderHash) for the given inputs.
func hashV2Order(in *v2OrderInputs) (common.Hash, common.Hash, error) {
	verifyingContract, err := v2VerifyingContract(in.ChainID, in.NegRisk)
	if err != nil {
		return common.Hash{}, common.Hash{}, fmt.Errorf("verifying contract: %w", err)
	}

	domainSep, err := eip712.BuildEIP712DomainSeparator(
		v2ProtocolName, v2ProtocolVersion,
		big.NewInt(in.ChainID), verifyingContract,
	)
	if err != nil {
		return common.Hash{}, common.Hash{}, fmt.Errorf("domain separator: %w", err)
	}

	values := []interface{}{
		v2OrderTypehash,
		in.Salt,
		in.Maker,
		in.Signer,
		in.TokenID,
		in.MakerAmount,
		in.TakerAmount,
		in.Side,
		in.SignatureType,
		in.Timestamp,
		in.Metadata,
		in.Builder,
	}
	orderHash, err := eip712.HashTypedDataV4(domainSep, v2OrderStructure, values)
	if err != nil {
		return common.Hash{}, common.Hash{}, fmt.Errorf("hash typed data: %w", err)
	}
	return domainSep, orderHash, nil
}

// signV2Order signs the EIP-712 hash with the given private key and verifies
// the recovered address matches in.Signer. Returns the 65-byte signature.
func signV2Order(privateKey *ecdsa.PrivateKey, in *v2OrderInputs) (common.Hash, []byte, error) {
	_, orderHash, err := hashV2Order(in)
	if err != nil {
		return common.Hash{}, nil, err
	}
	sig, err := signer.Sign(privateKey, orderHash)
	if err != nil {
		return common.Hash{}, nil, fmt.Errorf("sign: %w", err)
	}
	ok, err := signer.ValidateSignature(in.Signer, orderHash, sig)
	if err != nil {
		return common.Hash{}, nil, fmt.Errorf("validate signature: %w", err)
	}
	if !ok {
		return common.Hash{}, nil, fmt.Errorf("signature validation failed: signer %s does not match recovered address", in.Signer.Hex())
	}
	return orderHash, sig, nil
}

// hexToBytes32 parses a 32-byte hex value (with optional 0x prefix).
func hexToBytes32(s string) ([32]byte, error) {
	var out [32]byte
	s = strings.TrimPrefix(strings.TrimPrefix(s, "0x"), "0X")
	if len(s) != 64 {
		return out, fmt.Errorf("expected 32-byte (64 hex chars) value, got %d", len(s))
	}
	b, err := hex.DecodeString(s)
	if err != nil {
		return out, fmt.Errorf("decode hex: %w", err)
	}
	copy(out[:], b)
	return out, nil
}
