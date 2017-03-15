import { RENAME_DIRECTORY, MOVE_DIRECTORY } from './actions';

function directoryReducer(directory, action) {
  switch (action.type) {
    case RENAME_DIRECTORY:
      return { ...directory, title: action.title };
    case MOVE_DIRECTORY:
      return { ...directory, directoryId: action.directoryId };
    default:
      return directory;
  }
}

export default function reducer(state: {}, action) {
  switch (action.type) {
    case RENAME_DIRECTORY:
    case MOVE_DIRECTORY:
      if (state[action.id]) {
        return {
          ...state,
          [action.id]: directoryReducer(state[action.id], action),
        };
      }
      return state;
    default:
      return state;
  }
}
