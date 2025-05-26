
SELECT
   deviceId ,
   System.Timestamp() AS windowEnd,
   AVG(cycleMetrics.queuedVehicles) AS avgQueuedVehicles,
   SUM(cycleMetrics.vehiclesPassed) AS totalVehiclesPassed,
   AVG(cycleMetrics.clearanceRate) AS avgClearanceRate,
   AVG(cycleMetrics.averageSpeed) AS avgSpeed,
   MAX(cycleMetrics.queuedVehicles) AS maxQueuedVehicles,
   MIN(cycleMetrics.averageSpeed) AS minSpeed
INTO
   [TrafficProcessorFunction]
FROM
   [traffic-hub]
GROUP BY
   deviceId,
   TumblingWindow(minute, 1)