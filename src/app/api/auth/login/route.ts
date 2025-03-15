import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function fetchCanvasData(apiKey: string) {
  try {
    let allCourses: any[] = [];
    let page = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      const response = await fetch(
        `https://canvas.instructure.com/api/v1/courses?per_page=10&page=${page}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch Canvas data');
      }

      const courses = await response.json();
      
      if (courses.length === 0) {
        hasMorePages = false;
      } else {
        allCourses = [...allCourses, ...courses];
        page++;
      }
    }
    
    return allCourses;
  } catch (error) {
    console.error('Canvas API error:', error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        canvasApiKey: true,
        schoolName: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Fetch Canvas data
    const canvasData = await fetchCanvasData(user.canvasApiKey);

    // Remove sensitive data before sending response
    const { password: _, canvasApiKey: __, ...safeUser } = user;

    return NextResponse.json({
      user: safeUser,
      canvasData
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
} 