import {STORE_ACTIONS_TYPES} from "./constants";

const {GAME_DEPLOY, GAME_SHOOT, GAME_RESET} = STORE_ACTIONS_TYPES;

export const gameDeploy = description => {
    const {playerId, anchorCoords, direction, length} = description;
    const {x, y} = anchorCoords;

    return {
        type: GAME_DEPLOY,
        payload: {
            playerId,
            anchorCoords: {x, y},
            direction,
            length,
        },
    };
};

export const gameShoot = description => {
    const {playerId, coords} = description;
    const {x, y} = coords;

    return {
        type: GAME_SHOOT,
        payload: {
            playerId,
            coords: {x, y},
        },
    };
};

export const gameReset = () => ({
    type: GAME_RESET,
});
