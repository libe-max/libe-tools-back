import {
  FETCH_BUNDLES_REQUEST,
  FETCH_BUNDLES_SUCCESS,
  FETCH_BUNDLES_FAILURE,
  CREATE_BUNDLE_REQUEST,
  CREATE_BUNDLE_SUCCESS,
  CREATE_BUNDLE_FAILURE,
  PUSH_IN_BUNDLES,
  SET_TOOLS_FILTER,
  SET_BUNDLES_FILTER,
  PUSH_NOTIFICATION
} from './actionTypes'

/* * * * * * * * * * * * * * * * * * * * 
 *
 *  BUNDLES
 *
 * * * * * * * * * * * * * * * * * * * */

/* Fetching */
export const fetchBundlesRequest = () => ({
  type: FETCH_BUNDLES_REQUEST
})

export const fetchBundlesSuccess = list => ({
  type: FETCH_BUNDLES_SUCCESS,
  list
})

export const fetchBundlesError = error => ({
  type: FETCH_BUNDLES_FAILURE,
  error
})

/* Creating */
export const createBundleRequest = () => ({
  type: CREATE_BUNDLE_REQUEST
})

export const createBundleSuccess = bundle => ({
  type: CREATE_BUNDLE_SUCCESS,
  bundle
})

export const createBundleError = error => ({
  type: CREATE_BUNDLE_FAILURE,
  error
})

/* Push */
export const pushInBundles = bundle => ({
  type: PUSH_IN_BUNDLES,
  bundle
})

/* * * * * * * * * * * * * * * * * * * * 
 *
 *  FILTERS
 *
 * * * * * * * * * * * * * * * * * * * */

/* Tools */
export const setToolsFilter = filter => ({
  type: SET_TOOLS_FILTER,
  filter
})

/* Bundles */
export const setBundlesFilter = filter => {
  document
    .querySelector('.home-page__bundles-panel')
    .querySelector('.search-field')
    .querySelector('input')
    .value = filter
  return {
    type: SET_BUNDLES_FILTER,
    filter
  }
}

/* * * * * * * * * * * * * * * * * * * * 
 *
 *  NOTIFICATIONS
 *
 * * * * * * * * * * * * * * * * * * * */

/* Push */
export const pushNotification = (notification, level) => ({
  type: PUSH_NOTIFICATION,
  notification,
  level
})
