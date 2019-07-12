import { IPlayer, NodeMisrcon } from 'node-misrcon';
import { createAction, createAsyncAction } from 'typesafe-actions';

import { sendRCONAsyncThunk } from '../rcon/actions';
import { AsyncThunkResult } from '../redux-types';
import {
  activeServerCredentialsSelector,
  activeServerIDSelector,
  activeServerSelector
} from '../servers/selectors';
import { playersSelector } from './selectors';
import { Player } from './types';
import { getSteamAvatar } from './utils';

/*
 * Gets the players using rcon
 * Sends the IPlayer to SyncPlayer thunk to be synced and added to state
 */
export const getPlayersViaRCON = createAsyncAction(
  'players/GET_VIA_RCON_REQUEST',
  'players/GET_VIA_RCON_SUCCESS',
  'players/GET_VIA_RCON_FAILED'
)<void, void, string>();
export const getPlayersViaRCONThunk = (): AsyncThunkResult<any> => async (
  dispatch,
  getState
) => {
  dispatch(getPlayersViaRCON.request());
  try {
    await dispatch(markAllPlayersInactive());
    const activeServerCredentials = activeServerCredentialsSelector(getState());
    const { playersArray } = await new NodeMisrcon({
      ...activeServerCredentials
    }).getStatus();
    playersArray.forEach(async player => {
      await dispatch(syncPlayerThunk(player));
    });
    dispatch(getPlayersViaRCON.success());
  } catch (err) {
    dispatch(getPlayersViaRCON.failure(err.toString()));
  }
};

export const syncPlayer = createAsyncAction(
  'players/SYNC_PLAYER_REQUEST',
  'players/SYNC_PLAYER_SUCCESS',
  'players/SYNC_PLAYER_FAILED'
)<void, Player, string>();
export const syncPlayerThunk = (
  player: IPlayer
): AsyncThunkResult<void> => async (dispatch, getState) => {
  dispatch(syncPlayer.request());
  try {
    const storePlayers: Player[] = playersSelector(getState());
    const activeServerID = activeServerSelector(getState()).id;
    const storedPlayer = storePlayers.find(pl => pl.steam === player.steam);
    // If the player is stored update it's data
    if (storedPlayer) {
      dispatch(
        syncPlayer.success({
          ...storedPlayer,
          ...player,
          active: true,
          seenOn: [
            ...storedPlayer.seenOn.filter(id => id !== activeServerID),
            activeServerID
          ]
        })
      );
      return;
    }
    // If the player is not stored create new data
    const syncedPlayer: Player = await {
      ...player,
      avatarUrl: await getSteamAvatar(player.steam),
      active: true,
      serverID: activeServerID,
      color: '#fff',
      notes: '',
      banned: [],
      whitelisted: [],
      seenOn: [activeServerID]
    };
    dispatch(syncPlayer.success(syncedPlayer));
    return;
  } catch (err) {
    dispatch(syncPlayer.failure(err.toString()));
  }
};

/*
Ban a SteamID
 */
export const banSteamID = createAsyncAction(
  'players/BAN_STEAMID_REQUEST',
  'players/BAN_STEAMID_SUCCESS',
  'players/BAN_STEAMID_FAILED'
)<void, void, string>();
export const banSteamIDThunk = (
  steamid: string
): AsyncThunkResult<any> => async (dispatch, getState) => {
  dispatch(banSteamID.request());
  try {
    const request = {
      ...activeServerCredentialsSelector(getState()),
      command: `mis_ban_steamid ${steamid}`
    };
    const response = await dispatch(sendRCONAsyncThunk(request));
    if (response.completed) {
      dispatch(banSteamID.success());
    } else {
      dispatch(banSteamID.failure('REQUEST FAILED'));
    }
  } catch (err) {
    dispatch(banSteamID.failure(err.toString()));
  }
};

/*
Whitelist a player
 */
export const whitelistSteamID = createAsyncAction(
  'players/WHITELIST_REQUEST',
  'players/WHITELIST_SUCCESS',
  'players/WHITELIST_FAILED'
)<void, number, string>();
export const whitelistSteamIDThunk = (
  steamid: string
): AsyncThunkResult<any> => async (dispatch, getState) => {
  dispatch(whitelistSteamID.request());
  try {
    const request = {
      ...activeServerCredentialsSelector(getState()),
      command: `mis_whitelist_add ${steamid}`
    };
    await dispatch(sendRCONAsyncThunk(request));
    dispatch(whitelistSteamID.success(activeServerIDSelector(getState())));
  } catch (err) {
    dispatch(whitelistSteamID.failure(err.toString()));
  }
};

/*
Given some parameters about a player add them to the state
 */
export const banPlayer = createAsyncAction(
  'players/BAN_REQUEST',
  'players/BAN_SUCCESS',
  'players/BAN_FAILED'
)<void, number, string>();
export const banPlayerThunk = (player: Player): AsyncThunkResult<any> => async (
  dispatch,
  getState
) => {
  dispatch(banPlayer.request());
  try {
    const request = {
      ...activeServerCredentialsSelector(getState()),
      command: 'mis_ban_steamid ' + player.steam
    };
    await dispatch(sendRCONAsyncThunk(request));
    dispatch(banPlayer.success(activeServerIDSelector(getState())));
  } catch (err) {
    dispatch(banPlayer.failure(err.toString()));
  }
};

/*
Kick a player
 */
export const kickPlayer = createAsyncAction(
  'players/KICK_REQUEST',
  'players/KICK_SUCCESS',
  'players/KICK_FAILED'
)<void, Player, string>();
export const kickPlayerThunk = (
  player: Player
): AsyncThunkResult<any> => async (dispatch, getState) => {
  dispatch(kickPlayer.request());
  try {
    const request = {
      ...activeServerCredentialsSelector(getState()),
      command: 'mis_kick ' + player.steam
    };
    await dispatch(sendRCONAsyncThunk(request));
    dispatch(kickPlayer.success(player));
  } catch (err) {
    dispatch(kickPlayer.failure(err.toString()));
  }
};

export const setPlayerNote = createAction(
  'players/SET_NOTE',
  resolve => (steam: string, notes: string) => resolve({ steam, notes })
);

export const setPlayerColor = createAction(
  'players/SET_COLOR',
  resolve => (steam: string, color: string) => resolve({ steam, color })
);

export const markAllPlayersInactive = createAction(
  'players/MARK_ALL_PLAYERS_INACTIVE'
);