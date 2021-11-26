/* CLARIFICATION: DEPLOYMENT DIRECTION
    "horizontal" - a ship occupies grid cells from cell specified by anchor coordinates and in right direction
    "vertical" - a ship occupies grid cells from cell specified by anchor coordinates and in down direction
*/
export const DIRECTIONS = {
    HORIZONTAL: "horizontal",
    VERTICAL: "vertical",
    UP: "top",
    DOWN: "bottom",
    LEFT: "left",
    RIGHT: "right",
}

export const GAME_STATUSES = {
    IDLE: "idle",
    IN_PROGRESS: "in progress",
}
