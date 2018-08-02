import { PUSH_NOTIFICATION } from '../actions/actionTypes'

const notifications = (state = [], action) => {
  switch (action.type) {
    case PUSH_NOTIFICATION:
      return [
        {
          text: action.notification,
          timestamp: Date.now()
        },
        ...state
      ]
    default:
      return state
  }
}

export default notifications