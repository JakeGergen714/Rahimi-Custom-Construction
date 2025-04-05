// backend/api/project-upload.js
import AWS from 'aws-sdk';
import { nanoid } from 'nanoid';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();
const dynamoDB = new AWS.DynamoDB.DocumentClient();

export async function POST(req) {
  const cookies = req.headers.get('cookie');
  const parsedCookies = parse(cookies || '');
  const token = parsedCookies.auth_token;

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized: No token provided' },
      { status: 401 }
    );
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  if (!decoded.isAdmin) {
    return NextResponse.json(
      { error: 'Unauthorized: Not an admin' },
      { status: 401 }
    );
  }

  try {
    const { title, description, mainImage, additionalImages } =
      await req.json();

    // Validate required fields
    if (!title || !description || !mainImage) {
      return new Response(
        JSON.stringify({
          error: 'Title, description, and main image are required.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique IDs for images and upload URLs
    const mainImageId = nanoid();
    const sanitizedMainImageName = `${mainImageId}-${mainImage.fileName}`;
    const mainImageS3Key = `projects/${sanitizedMainImageName}`;

    console.log('Main Image S3 Key:', mainImageS3Key);

    const additionalImageUploads = additionalImages.map((image) => {
      if (!image.fileName || !image.fileType) {
        throw new Error(
          'fileName and fileType are required for additional images.'
        );
      }
      const imageId = nanoid();
      const sanitizedFileName = `${imageId}-${image.fileName}`;
      return {
        id: imageId,
        s3Key: `projects/${sanitizedFileName}`,
        fileName: image.fileName,
      };
    });

    console.log('Additional Image Uploads:', additionalImageUploads);

    // Get presigned URLs for S3 uploads
    const mainImageUploadUrl = s3.getSignedUrl('putObject', {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: mainImageS3Key,
      ContentType: mainImage.fileType,
      Expires: 60, // URL expires in 60 seconds
    });

    const additionalImageUploadUrls = additionalImageUploads.map((image) => ({
      uploadUrl: s3.getSignedUrl('putObject', {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: image.s3Key,
        ContentType: image.fileType,
        Expires: 60, // URL expires in 60 seconds
      }),
      ...image,
    }));

    // Save project metadata in DynamoDB
    await dynamoDB
      .put({
        TableName: 'rahimi-invoices',
        Item: {
          id: Date.now(), // Using nanoid for unique project ID
          invoice_partition: 'projects',
          projectId: nanoid(),
          title,
          description,
          mainImage: {
            s3Key: mainImageS3Key,
            fileName: mainImage.fileName,
          },
          additionalImages: additionalImageUploads.map((img) => ({
            s3Key: img.s3Key,
            fileName: img.fileName,
          })),
          createdAt: new Date().toISOString(),
        },
      })
      .promise();

    return new Response(
      JSON.stringify({
        mainImageUploadUrl,
        additionalImageUploadUrls,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error uploading project:', error);

    return new Response(JSON.stringify({ error: 'Failed to upload project' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
