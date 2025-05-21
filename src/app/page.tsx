import React from 'react';
import Link from 'next/link';
import { MapPin, Activity, CloudRain, Car, Gauge, Server, Database, LineChart, Cpu } from 'lucide-react';
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen p-8 pb-20 ">
      {/* Title Section - Stays at top */}
      <div className="text-center mb-16">
        <h1 className="text-4xl sm:text-5xl font-bold">
          Smart Traffic Monitoring with Azure Event Hubs
        </h1>
      </div>

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-[1fr_1fr] gap-12 mx-auto">
        {/* Left Column - Illustration and Action Cards */}
        <div className="space-y-8">
          {/* Illustration */}
          <div className="w-full max-w-xl mx-auto">
            <Image
              src="/traffic-illustration.svg" 
              alt="Traffic monitoring illustration"
              width={200}
              height={200}
              className="w-full h-auto dark:invert"  
            />
          </div>

          {/* Action Cards */}
          <div className="space-y-6">
            <Link href="/dashboard" 
              className="block group p-6 rounded-2xl border border-black/[.08] dark:border-white/[.145] hover:border-transparent 
                hover:shadow-lg transition-all duration-300 hover:bg-gradient-to-br from-blue-50 to-indigo-50 
                dark:hover:bg-gradient-to-br dark:from-gray-800/50 dark:to-gray-900/50">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <MapPin size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2">Live Sensor Map</h2>
                  <p className="text-foreground/70">
                    Experience Event Hubs in action as you monitor real-time data from IoT traffic sensors. 
                    Watch as the system processes live sensor data, demonstrating Event Hubs' capabilities 
                    in handling high-throughput event streams and real-time analytics.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 flex-wrap mt-6">
                <span className="px-3 py-1 rounded-full text-sm bg-black/[.05] dark:bg-white/[.06]">
                  <div className="flex items-center gap-1">
                    <Activity size={14} />
                    Real-time Processing
                  </div>
                </span>
                <span className="px-3 py-1 rounded-full text-sm bg-black/[.05] dark:bg-white/[.06]">
                  <div className="flex items-center gap-1">
                    <Gauge size={14} />
                    Live Analytics
                  </div>
                </span>
              </div>
            </Link>

            <Link href="/simulator"
              className="block group p-6 rounded-2xl border border-black/[.08] dark:border-white/[.145] hover:border-transparent 
                hover:shadow-lg transition-all duration-300 hover:bg-gradient-to-br from-purple-50 to-pink-50
                dark:hover:bg-gradient-to-br dark:from-gray-800/50 dark:to-gray-900/50">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                  <Car size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2">Traffic Simulator</h2>
                  <p className="text-foreground/70">
                    Hands-on practice with Event Hubs as you simulate traffic scenarios. Generate realistic 
                    event streams, learn about event ingestion patterns, and understand how Event Hubs scales 
                    to handle varying loads under different traffic and weather conditions.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 flex-wrap mt-6">
                <span className="px-3 py-1 rounded-full text-sm bg-black/[.05] dark:bg-white/[.06]">
                  <div className="flex items-center gap-1">
                    <Car size={14} />
                    Event Generation
                  </div>
                </span>
                <span className="px-3 py-1 rounded-full text-sm bg-black/[.05] dark:bg-white/[.06]">
                  <div className="flex items-center gap-1">
                    <CloudRain size={14} />
                    Scenario Testing
                  </div>
                </span>
              </div>
            </Link>
          </div>
        </div>

        {/* Right Column - Course Information */}
        <div className="space-y-8">
          <div className="space-y-6">
            <p className="text-lg text-foreground/70">
              Welcome to a hands-on course exploring Azure Event Hubs through real-world traffic monitoring. 
              Learn how to build and manage a scalable IoT data processing system that handles millions of events in real-time.
            </p>
            
            <div className="bg-black/[.02] dark:bg-white/[.02] p-6 rounded-2xl">
              <h2 className="text-xl font-semibold mb-4">Course Overview</h2>
              <p className="text-foreground/70 leading-relaxed">
                In this practical course, you'll master Azure Event Hubs by building a city-wide traffic monitoring system. 
                Learn how to ingest real-time data from thousands of IoT traffic sensors, process millions of events per second, 
                and create actionable insights through stream processing. You'll work with Event Hubs' key features including 
                partitioning for scalability, capture for data persistence, and integration with Azure Stream Analytics for 
                real-time processing. Through our interactive simulator and live map, you'll experience firsthand how Event Hubs 
                handles high-throughput event scenarios in a distributed system.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl bg-black/[.02] dark:bg-white/[.02]">
              <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400">
                <Server size={20} />
                <h3 className="font-semibold">Event Hub Architecture</h3>
              </div>
              <p className="text-sm text-foreground/70">
                Master Event Hubs' core concepts including partitioning, consumer groups, and throughput units. 
                Learn to design scalable architectures for handling massive event streams.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-black/[.02] dark:bg-white/[.02]">
              <div className="flex items-center gap-2 mb-2 text-purple-600 dark:text-purple-400">
                <Database size={20} />
                <h3 className="font-semibold">Data Management</h3>
              </div>
              <p className="text-sm text-foreground/70">
                Implement Event Hubs Capture for long-term storage, configure retention policies, 
                and integrate with Azure Storage and Data Lake for advanced analytics.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-black/[.02] dark:bg-white/[.02]">
              <div className="flex items-center gap-2 mb-2 text-green-600 dark:text-green-400">
                <LineChart size={20} />
                <h3 className="font-semibold">Real-time Analytics</h3>
              </div>
              <p className="text-sm text-foreground/70">
                Build end-to-end analytics pipelines using Event Hubs with Stream Analytics. 
                Create real-time dashboards and alerts for traffic monitoring.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-black/[.02] dark:bg-white/[.02]">
              <div className="flex items-center gap-2 mb-2 text-orange-600 dark:text-orange-400">
                <Cpu size={20} />
                <h3 className="font-semibold">IoT Integration</h3>
              </div>
              <p className="text-sm text-foreground/70">
                Connect IoT devices to Event Hubs, implement secure authentication, 
                and handle device telemetry at scale in real-world scenarios.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}