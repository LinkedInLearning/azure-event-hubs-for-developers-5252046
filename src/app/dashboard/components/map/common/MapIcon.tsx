// MapIcon.tsx
'use client';

import { Angry, Annoyed, Smile, MessageCircle } from "lucide-react";
import { renderToString } from "react-dom/server";
import L from "leaflet";
import { SensorTraficStatus } from "@/services/types";

export const createSensorStatusIcon = (
  worstStatus: SensorTraficStatus | null,
  isSelected: boolean = false
) => {
  let IconComponent;
  let iconColor;

  if (!worstStatus) {
    IconComponent = MessageCircle;
    iconColor = "#9CA3AF"; // Gray
  } else if (worstStatus.avgClearanceRate < 70) {
    IconComponent = Angry;
    iconColor = "#EF4444"; // Red
  } else if (worstStatus.avgClearanceRate < 90) {
    IconComponent = Annoyed;
    iconColor = "#F59E0B"; // Yellow
  } else {
    IconComponent = Smile;
    iconColor = "#10B981"; // Green
  }

  const iconSVG = renderToString(<IconComponent color="white" size={20} />);

  return L.divIcon({
    className: "sensor-cluster-marker",
    html: `
      <div 
        style="
          background-color: ${iconColor};
          width: ${isSelected ? '40px' : '32px'};
          height: ${isSelected ? '40px' : '32px'};
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          color: white;
          box-shadow: ${isSelected ? '0px 0px 10px #FFF' : '0px 2px 5px rgba(0,0,0,0.3)'};
          transition: all 0.3s ease;
          transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'};
        "
      >
        ${iconSVG} 
      </div>
    `,
    iconSize: [isSelected ? 40 : 32, isSelected ? 40 : 32],
    iconAnchor: [isSelected ? 20 : 16, isSelected ? 20 : 16],
  });
};