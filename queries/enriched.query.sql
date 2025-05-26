WITH Aggregated AS (
 SELECT
     t.deviceId,
     System.Timestamp() AS windowEnd,
     AVG(t.cycleMetrics.queuedVehicles) AS avgQueuedVehicles,
     SUM(t.cycleMetrics.vehiclesPassed) AS totalVehiclesPassed,
     AVG(t.cycleMetrics.clearanceRate) AS avgClearanceRate,
     AVG(t.cycleMetrics.averageSpeed) AS avgSpeed,
     MAX(t.cycleMetrics.queuedVehicles) AS maxQueuedVehicles,
     MIN(t.cycleMetrics.averageSpeed) AS minSpeed
 FROM
     [traffic-hub] t
 GROUP BY
     t.deviceId,
     TumblingWindow(minute, 1)
)

SELECT
   a.deviceId,
   a.windowEnd,
   a.avgQueuedVehicles,
   a.totalVehiclesPassed,
   a.avgClearanceRate,
   a.avgSpeed,
   a.maxQueuedVehicles,
   a.minSpeed,
   r.eventString as events
INTO
   [TrafficProcessorFunction]
FROM
   Aggregated a
LEFT JOIN
   [trafficsensordata] r ON a.deviceId = r.deviceId
