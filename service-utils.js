exports.auth = (fn, allowedRoles) => {
  return (payload, callbacks, id) => {
    const {send} = callbacks

    if(send) {
      callbacks.send = (m, p, cb) => {
        send(m, {...p, session: payload.session}, cb)
      }
    }
    fn(payload,callbacks, id)
  }
}
