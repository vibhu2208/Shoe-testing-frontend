import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;
    const clientId = formData.get('clientId') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, error: 'Only PDF files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.name);
    const uniqueFileName = `document-${uniqueSuffix}${fileExtension}`;
    const filePath = path.join(uploadDir, uniqueFileName);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create document record in database via backend API
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Authorization required' },
        { status: 401 }
      );
    }

    const dbResponse = await fetch(`${backendUrl}/api/documents/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({
        clientId,
        fileName: fileName || file.name,
        filePath,
        fileSize: file.size,
        mimeType: file.type
      })
    });

    if (!dbResponse.ok) {
      let errorResult;
      try {
        errorResult = await dbResponse.json();
      } catch (parseError) {
        // If response is not JSON, get text instead
        const errorText = await dbResponse.text();
        console.error('Backend returned non-JSON response:', errorText);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Backend server error',
            message: 'Backend is not responding correctly. Please ensure the Express server is running on port 5000.'
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorResult.error || 'Failed to create document record',
          message: errorResult.message || 'Database operation failed'
        },
        { status: dbResponse.status }
      );
    }

    let dbResult;
    try {
      dbResult = await dbResponse.json();
    } catch (parseError) {
      console.error('Failed to parse backend response:', parseError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid backend response',
          message: 'Backend returned non-JSON response'
        },
        { status: 500 }
      );
    }
    
    const documentId = dbResult.documentId;

    return NextResponse.json({
      success: true,
      documentId: documentId,
      filePath: filePath,
      fileName: file.name,
      fileSize: file.size,
      message: 'Document uploaded successfully'
    });

  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to upload document',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
