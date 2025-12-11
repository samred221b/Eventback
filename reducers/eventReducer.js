const initialState = {
  events: [],
  favorites: [], 
};

const eventReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'SET_EVENTS':
      return {
        ...state,
        events: action.payload,
      };
    case 'ADD_FAVORITE':
      return {
        ...state,
        favorites: [...state.favorites, action.payload],
      };
    case 'REMOVE_FAVORITE':
      return {
        ...state,
        favorites: state.favorites.filter(item => item.id !== action.payload),
      };
    case 'FETCH_FAVORITES':
      return {
        ...state,
        favorites: state.favorites, 
      };
    default:
      return state;
  }
};

export default eventReducer;
