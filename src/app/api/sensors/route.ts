import { NextRequest } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
const SENSORS_FILE_PATH = join(process.cwd(), 'scripts', 'sensors.json');

export async function GET(request: NextRequest) {
  try {
       const sensors = JSON.parse(readFileSync(SENSORS_FILE_PATH, 'utf8'));
    
    return new Response(JSON.stringify(sensors), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Failed to get sensors:', error);
    return new Response(JSON.stringify({ error: 'Failed to load sensors' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
