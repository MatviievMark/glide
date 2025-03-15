import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { name, email, password, school, canvasApiKey } = await request.json();

    // Basic validation
    if (!name || !email || !password || !school || !canvasApiKey) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and only return selected fields (excludes password)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        schoolName: school,
        canvasApiKey,
      },
      select: {
        id: true,
        name: true,
        email: true,
        schoolName: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
} 