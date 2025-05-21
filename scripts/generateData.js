const axios = require('axios');
const fs = require('fs').promises;

const bounds = {
    north: 41.0600, // Extended northward
    south: 40.5200, // Extended southward
    east: -73.8400, // Extended eastward
    west: -74.1100  // Extended westward
};
const distanceModifier = 0.070; 
                               // Adjusting this value will control density of sensors:
                               // - Larger value = fewer, more spread out sensors
                               // - Smaller value = more densely packed sensors

// Haversine formula to calculate distance between two lat/lon points
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const toRad = (angle) => (angle * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
}

// Fetch intersection data from OpenStreetMap
async function fetchIntersections(bounds) {
    const query = `
        [out:json];
        (
            // Query for main roads that are likely to have significant traffic
            way[highway~"^(primary|secondary|tertiary)$"]
                (${bounds.south},${bounds.west},${bounds.north},${bounds.east});
            >;
        );
        out body;
    `;

    const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

    try {
        const response = await axios.get(overpassUrl);
        const data = response.data;

        const nodeUsage = new Map();
        const nodeDetails = new Map();
        const streetNames = new Map();

        // Process ways and nodes
        data.elements.forEach(element => {
            if (element.type === 'way' && element.nodes) {
                const streetName = element.tags?.name || 'Unknown Street';
                element.nodes.forEach(nodeId => {
                    if (!streetNames.has(nodeId)) {
                        streetNames.set(nodeId, new Set());
                    }
                    streetNames.get(nodeId).add(streetName);
                    nodeUsage.set(nodeId, (nodeUsage.get(nodeId) || 0) + 1);
                });
            }
            if (element.type === 'node') {
                nodeDetails.set(element.id, {
                    lat: element.lat,
                    lon: element.lon
                });
            }
        });

        let filteredIntersections = [];
        let idCounter = 1;

        // Filter intersections based on number of connecting roads
        nodeUsage.forEach((count, nodeId) => {
            if (count >= 3) { // Only include intersections of 3 or more roads
                const details = nodeDetails.get(nodeId);
                const streets = streetNames.get(nodeId);

                if (details && streets) {
                    const newIntersection = {
                        id: `intersection-${idCounter++}`,
                        latitude: details.lat,
                        longitude: details.lon,
                        streets: Array.from(streets),
                        numberOfStreets: count
                    };

                    // Ensure new intersections are adequately spaced
                    if (
                        filteredIntersections.length === 0 ||
                        filteredIntersections.every(existing => getDistance(
                            existing.latitude, existing.longitude,
                            newIntersection.latitude, newIntersection.longitude
                        ) > distanceModifier * 100000) // Convert to meters
                    ) {
                        filteredIntersections.push(newIntersection);
                    }
                }
            }
        });

        return filteredIntersections;
    } catch (error) {
        console.error('Error fetching intersections:', error);
        throw error;
    }
}

function determineIntersectionType(streetCount) {
    if (streetCount >= 4) return "major";
    if (streetCount === 3) return "medium";
    return "minor";
}

function generateIntersectionName(streets) {
    return streets.length >= 2 ? `${streets[0]} & ${streets[1]}` : "Unknown Intersection";
}

function generateQueueCharacteristics(intersectionType) {
    const baseValues = {
        'major': { averageQueue: 40, peakQueue: 70, greenLightCycle: 60, redLightCycle: 80 },
        'medium': { averageQueue: 25, peakQueue: 45, greenLightCycle: 45, redLightCycle: 60 },
        'minor': { averageQueue: 15, peakQueue: 30, greenLightCycle: 30, redLightCycle: 50 }
    };

    const randomFactor = 0.8 + Math.random() * 0.4; // Add some randomness to the values
    const base = baseValues[intersectionType];

    return {
        averageQueue: Math.round(base.averageQueue * randomFactor),
        peakQueue: Math.round(base.peakQueue * randomFactor),
        greenLightCycle: Math.round(base.greenLightCycle * randomFactor),
        redLightCycle: Math.round(base.redLightCycle * randomFactor)
    };
}

// Create IoT device for a specific direction
function createIoTDevice(intersection, direction, idCounter,intersectionId) {
    const intersectionType = determineIntersectionType(intersection.numberOfStreets);
    const intersectionName = generateIntersectionName(intersection.streets);

    

    return {
        "deviceId": `sensor-${idCounter}`,
         "intersectionId": intersectionId,

        "location": {
            "latitude": intersection.latitude ,
            "longitude": intersection.longitude ,
            "intersectionType": intersectionType,
            "intersectionName": intersectionName,
            "direction": direction,
            "streetCount": intersection.numberOfStreets
        },
        "characteristics": generateQueueCharacteristics(intersectionType)
    };
}

// Generate devices for an area
async function generateAreaDevices(bounds) {
    try {
        const intersections = await fetchIntersections(bounds);
        console.log(`Found ${intersections.length} suitable intersections`);

        const directions = ["NORTH", "SOUTH", "EAST", "WEST"];
        let idCounter = 1;
        const allDevices = [];
        let intersectionIdCounter = 1;
        intersections.forEach(intersection => {
            const intersectionId = `int-${intersectionIdCounter++}`;

            directions.forEach(direction => {
                allDevices.push(createIoTDevice(intersection, direction, idCounter++,intersectionId));
            });
        });

        return allDevices;
    } catch (error) {
        console.error('Error generating devices:', error);
        throw error;
    }
}

// Main execution
async function main() {
    try {
        const devices = await generateAreaDevices(bounds);

        await fs.writeFile(
            'sensors.json',
            JSON.stringify(devices, null, 2)
        );

        console.log(`Generated ${devices.length} IoT devices`);
        console.log('\nExample device:');
        console.log(JSON.stringify(devices[0], null, 2));

    } catch (error) {
        console.error('Error in main execution:', error);
    }
}

// Run the program
main();