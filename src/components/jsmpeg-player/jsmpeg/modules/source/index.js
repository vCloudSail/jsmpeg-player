import AjaxSource from './ajax'
import AjaxProgressiveSource from './ajax-progressive'
import FetchSource from './fetch'
import WSSource from './websocket'

const Source = {
  Ajax: AjaxSource,
  AjaxProgressive: AjaxProgressiveSource,
  Fetch: FetchSource,
  WebSocket: WSSource
}

export default Source
