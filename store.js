import { createStore, combineReducers } from 'redux';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import eventReducer from './reducers/eventReducer';

// Example reducer
const rootReducer = combineReducers({
  event: eventReducer,
  // Add other reducers here
});

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = createStore(persistedReducer);
const persistor = persistStore(store);

// Web render example removed to avoid import cycle with App.js

export { store, persistor };
