exports.auth = (fn, allowedRoles) => {
  return (payload, callbacks, id) => {
    const {send, reply} = callbacks
    const {session} = payload

    if(!session){
      reply('message unauthorized')
      return
    }

    if(allowedRoles && allowedRoles.length && !allowedRoles.includes(session.role)) {
      reply('message unauthorized')
      return
    }

    if(send) {
      callbacks.send = (m, p, cb) => {
        send(m, {...p, session: payload.session}, cb)
      }
    }
    fn(payload,callbacks, id)
  }
}

exports.createCRUDHandlers = ({ modelName, sequelizeModel, sequelizeInstance, allowedRoles }) => {
  return {
    beforeAll: async done => {
      try {
        await sequelizeInstance.authenticate()
        console.log('Connected to postgres database') // eslint-disable-line no-console
      } catch (error) {
        console.error('Unable to connect to the postgres database:', error) // eslint-disable-line no-console
      }
      done()
    },

    [`get ${modelName}`]: exports.auth(async ({ id }, { reply }) => {
      try {
        const instance = await sequelizeModel.findById(id)
        if (instance) {
          reply(`${modelName} details`, instance)
        } else {
          reply(`${modelName} not-found`, instance)
        }
      } catch (error) {
        console.error('Error getting: ', error) // eslint-disable-line no-console
      }
    }, allowedRoles),

    [`list ${modelName}`]: exports.auth(async (_, { reply }) => {
      try {
        const instances = await sequelizeModel.findAll()
        reply(`${modelName} list`, instances)
      } catch (error) {
        console.error('Error listing: ', error) // eslint-disable-line no-console
      }
    }, allowedRoles),

    [`create ${modelName}`]: exports.auth(async (data, { reply }) => {
      try {
        const instance = await sequelizeModel.create(data)
        reply(`${modelName} created`, instance)
      } catch (error) {
        console.error('Error creating: ', error) // eslint-disable-line no-console
      }
    }, allowedRoles),

    [`update ${modelName}`]: exports.auth(async (data, { reply }) => {
      try {
        const instance = await sequelizeModel.findById(data.id)
        if (instance) {
          await instance.update(data)
          reply(`${modelName} updated`, instance)
        } else {
          reply(`${modelName} not-found`)
        }
      } catch (error) {
        console.error('Error updating: ', error) // eslint-disable-line no-console
      }
    }, allowedRoles),

    [`delete ${modelName}`]: exports.auth(async ({ id }, { reply }) => {
      try {
        const instance = await sequelizeModel.findById(id)
        if (instance) {
          await instance.destroy()
          reply(`${modelName} deleted`, instance)
        } else {
          reply(`${modelName} not-found`)
        }
      } catch (error) {
        console.error('Error deleting: ', error) // eslint-disable-line no-console
      }
    }, allowedRoles),
  }
}