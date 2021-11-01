export function getGameGridDescription(state) {
    return state.game?.settings?.grid;
}

export function getPlayerDeploymentHistory(state, playerId) {
    return state.game?.players?.entities?.[playerId]?.deploymentHistory;
}

export function getPlayerShotsHistory(state, playerId) {
    return state.game?.players?.entities?.[playerId]?.shotsHistory;
}
