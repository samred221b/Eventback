export const addFavorite = (item) => ({
  type: 'ADD_FAVORITE',
  payload: item,
});

export const removeFavorite = (itemId) => ({
  type: 'REMOVE_FAVORITE',
  payload: itemId,
});

export const fetchFavorites = () => ({
  type: 'FETCH_FAVORITES',
});
