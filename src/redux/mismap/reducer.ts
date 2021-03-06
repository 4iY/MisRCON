import { ActionType, getType } from 'typesafe-actions';
import * as misMapActions from './actions';
import { default as defaultState } from './state';
import { MisMapState } from './types';

export type MisMapActions = ActionType<typeof misMapActions>;

export default (
  state: MisMapState = defaultState,
  action: MisMapActions
): MisMapState => {
  switch (action.type) {
    case getType(misMapActions.addMapMarker):
      return {
        ...state,
        markers: [...state.markers, { ...action.payload, id: Date.now() }]
      };

    case getType(misMapActions.deleteMapMarker):
      return {
        ...state,
        markers: state.markers.filter(marker => marker.id !== action.payload)
      };

    default:
      return state;
  }
};
