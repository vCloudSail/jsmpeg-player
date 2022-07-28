import BaseDecoder from './decoder'
import MPEG1 from './mpeg1'
import MPEG1WASM from './mpeg1-wasm'
import MP2 from './mp2'
import MP2WASM from './mp2-wasm'

const Decoder = {
  Base: BaseDecoder,
  MPEG1Video: MPEG1,
  MPEG1VideoWASM: MPEG1WASM,
  MP2Audio: MP2,
  MP2AudioWASM: MP2WASM
}

export default Decoder
