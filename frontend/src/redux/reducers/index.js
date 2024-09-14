import { combineReducers } from 'redux';

// Define your individual reducers here
const exampleReducer = (state = {}, action) => {
  switch (action.type) {
    case 'EXAMPLE_ACTION':
      return { ...state, ...action.payload };
    default:
      return state;
  }
};

const rootReducer = combineReducers({
  example: exampleReducer,
  // Add more reducers here as needed
});

export default rootReducer;