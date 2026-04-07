import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientDocumentId: string }> }
) {
  try {
    const { clientDocumentId } = await params;

    if (!clientDocumentId) {
      return NextResponse.json(
        { success: false, error: 'clientDocumentId is required' },
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
    const response = await fetch(`${backendUrl}/api/extraction/status/${clientDocumentId}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader
      }
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Failed to get extraction status'
        },
        { status: response.status }
      );
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Get extraction status error:', error);
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
