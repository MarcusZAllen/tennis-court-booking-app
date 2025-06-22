import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    // In production, this should fetch from your backend API
    // For now, we'll read from the JSON file
    const dataDirectory = path.join(process.cwd(), 'public', 'data');
    const fileContents = await fs.readFile(dataDirectory + '/locations.json', 'utf8');
    const data = JSON.parse(fileContents);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error reading locations:', error);
    return NextResponse.json(
      { error: 'Failed to load locations' },
      { status: 500 }
    );
  }
} 