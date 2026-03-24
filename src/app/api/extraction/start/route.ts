import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientDocumentId, filePath } = body;

    if (!clientDocumentId || !filePath) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'clientDocumentId and filePath are required' 
        },
        { status: 400 }
      );
    }

    // Get authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Authorization required' },
        { status: 401 }
      );
    }

    // Forward the request to the backend Express server
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const response = await fetch(`${backendUrl}/api/extraction/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({
        clientDocumentId,
        filePath
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Extraction failed',
          message: result.message || 'Failed to start extraction'
        },
        { status: response.status }
      );
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Extraction start error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
