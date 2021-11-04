export const STORE_ACTIONS_TYPES = {
    GAME_DEPLOY: "game/deploy",
    GAME_SHOOT: "game/shoot",
    GAME_RESET: "game/reset",
}
/* CLARIFICATION: DEPLOYMENT DIRECTION
    "horizontal" - a ship occupies grid cells from cell specified by anchor coordinates and in right direction
    "vertical" - a ship occupies grid cells from cell specified by anchor coordinates and in down direction
*/
export const DEPLOYMENT_DIRECTIONS = {
    HORIZONTAL: "horizontal",
    VERTICAL: "vertical",
}
