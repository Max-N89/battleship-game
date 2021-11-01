import {DEPLOYMENT_DIRECTIONS} from "../../constants";

const gridsDescriptionsMap = new WeakMap();

function createDeploymentMap(deploymentHistory, gridDescription) {
    if (
        gridsDescriptionsMap.has(gridDescription) &&
        gridsDescriptionsMap.get(gridDescription).has(deploymentHistory)
    ) {
        return gridsDescriptionsMap.get(gridDescription).get(deploymentHistory);
    }

    const map = new Array(gridDescription.height - 1)
        .fill(null)
        .map(row => (
            new Array(gridDescription.width - 1)
                .fill(null)
                .map(cell => (
                    {
                        isOccupied: false,
                    }
                ))
        ));

    deploymentHistory.forEach(deploymentDescription => {
        const {
            anchorCoords,
            direction: deploymentDirection,
            length: shipLength,
        } = deploymentDescription;

        const {
            x: anchorXCoord,
            y: anchorYCoord,
        } = anchorCoords;

        switch (deploymentDirection) {
            case DEPLOYMENT_DIRECTIONS.HORIZONTAL: {
                for (let x = anchorXCoord; x <= anchorXCoord + shipLength - 1; x++) {
                    map[anchorYCoord][x].isOccupied = true;
                }

                break;
            }
            case DEPLOYMENT_DIRECTIONS.VERTICAL: {
                for (let y = anchorYCoord; y <= anchorYCoord + shipLength - 1; y++) {
                    map[y][anchorXCoord].isOccupied = true;
                }

                break;
            }
        }
    });

    if (!gridsDescriptionsMap.has(gridDescription)) {
        gridsDescriptionsMap.set(gridDescription, new WeakMap());
    }

    gridsDescriptionsMap.get(gridDescription).set(deploymentHistory, map);

    return map;
}

export default createDeploymentMap;
