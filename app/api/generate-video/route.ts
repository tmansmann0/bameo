import { NextResponse } from 'next/server';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';

if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

const SLIDE_WIDTH = 1280;
const SLIDE_HEIGHT = 720;
const SLIDE_DURATION_SECONDS = 2;

interface IncomingCard {
  id?: string;
  title?: string;
  image_url?: string | null;
}

function escapeForSvg(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeForConcatFile(filePath: string): string {
  return filePath.replace(/'/g, "'\\''");
}

async function createSlideImage(cardTitle: string, tempDir: string, index: number): Promise<string> {
  const truncatedTitle = cardTitle.length > 80 ? `${cardTitle.slice(0, 77)}…` : cardTitle;
  const safeTitle = escapeForSvg(truncatedTitle);
  const gradientId = `bg-${index}-${randomUUID()}`;

  // Compose a lightweight SVG slide with a simple gradient background and centered title text.
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${SLIDE_WIDTH}" height="${SLIDE_HEIGHT}" viewBox="0 0 ${SLIDE_WIDTH} ${SLIDE_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="${gradientId}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0ea5e9" />
      <stop offset="100%" stop-color="#8b5cf6" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#${gradientId})" rx="48" />
  <text
    x="50%"
    y="50%"
    text-anchor="middle"
    dominant-baseline="middle"
    font-family="'DejaVu Sans', 'Segoe UI', sans-serif"
    font-weight="700"
    font-size="64"
    fill="#ffffff"
  >${safeTitle}</text>
</svg>`;

  const slidePath = path.join(tempDir, `slide-${index}.png`);
  await sharp(Buffer.from(svg))
    .png()
    .toFile(slidePath);

  return slidePath;
}

export async function POST(request: Request) {
  let tempDir: string | null = null;

  try {
    const body = await request.json().catch(() => null);
    const cards: IncomingCard[] | null = Array.isArray(body?.cards) ? body.cards : null;

    if (!cards || cards.length === 0) {
      return NextResponse.json(
        { error: 'No cards were provided for video generation.' },
        { status: 400 }
      );
    }

    const normalizedCards = cards.map((card, index) => ({
      title: typeof card?.title === 'string' && card.title.trim() ? card.title.trim() : `Card ${index + 1}`
    }));

    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bameo-video-'));

    const slidePaths = await Promise.all(
      normalizedCards.map((card, index) => createSlideImage(card.title, tempDir as string, index))
    );

    const concatFileContent = slidePaths
      .map((slidePath) => `file '${escapeForConcatFile(slidePath)}'\nduration ${SLIDE_DURATION_SECONDS}`)
      .join('\n')
      .concat(`\nfile '${escapeForConcatFile(slidePaths[slidePaths.length - 1])}'\n`);

    const concatFilePath = path.join(tempDir, 'slides.txt');
    await fs.writeFile(concatFilePath, concatFileContent, 'utf8');

    const outputVideoPath = path.join(tempDir, `bameo-cards-${Date.now()}.mp4`);

    // Use ffmpeg to assemble the generated slides into a short MP4 slideshow.
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(concatFilePath)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .outputOptions([
          '-vf',
          `scale=${SLIDE_WIDTH}:${SLIDE_HEIGHT}:force_original_aspect_ratio=decrease,pad=${SLIDE_WIDTH}:${SLIDE_HEIGHT}:(ow-iw)/2:(oh-ih)/2,setsar=1`,
          '-pix_fmt',
          'yuv420p',
          '-r',
          '30'
        ])
        .on('end', () => resolve())
        .on('error', (error) => reject(error))
        .save(outputVideoPath);
    });

    const videoBuffer = await fs.readFile(outputVideoPath);

    return new NextResponse(videoBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="bameo-cards.mp4"`,
        'Content-Length': videoBuffer.length.toString()
      }
    });
  } catch (error) {
    console.error('Failed to generate video with ffmpeg.', error);
    return NextResponse.json(
      { error: 'Unable to generate the video at this time.' },
      { status: 500 }
    );
  } finally {
    if (tempDir) {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.warn('Failed to clean up temporary video assets.', cleanupError);
      }
    }
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ready' });
}
