import {STORE_ACTIONS_TYPES} from "./constants";

const {GAME_DEPLOY, GAME_SHOOT, GAME_RESET} = STORE_ACTIONS_TYPES;

export const gameDeploy = description => {
    const {
        playerId,
        anchorCoords: {x, y},
        direction,
        length,
    } = description;

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
    const {
        playerId,
        coords: {x, y},
    } = description;

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
