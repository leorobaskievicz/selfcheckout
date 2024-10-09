import { createStore } from 'redux';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { ParamState } from './ducks/param/types';
import { CartState } from './ducks/cart/types';
import rootReducer from './ducks/rootReducer';

export interface ApplicationState {
  param: ParamState;
  cart: CartState;
}

const persistConfig = {
  key: 'rootv1.0.1e',
  storage,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = createStore(persistedReducer);
const persistor = persistStore(store);
export { store, persistor };
