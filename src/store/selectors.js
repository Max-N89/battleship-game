export function selectGameGridDescription(state) {
    return state.game?.settings?.grid;
}

export function selectPlayerDeploymentHistory(state, playerId) {
    return state.game?.players?.entities?.[playerId]?.deploymentHistory;
}

export function selectPlayerShotsHistory(state, playerId) {
    return state.game?.players?.entities?.[playerId]?.shotsHistory;
}
