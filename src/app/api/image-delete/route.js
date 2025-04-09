import AWS from 'aws-sdk';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server'; // Use NextResponse for handling server responses

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();
const dynamoDB = new AWS.DynamoDB.DocumentClient();

export async function DELETE(req) {
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
    const { id, s3Key } = await req.json();

    if (!id || !s3Key) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: Missing id or s3Key' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const decodedS3Key = decodeURIComponent(s3Key);
    console.log('Decoded S3 Key:', decodedS3Key);

    // Delete from S3
    await s3
      .deleteObject({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: decodedS3Key,
      })
      .promise();

    console.log(`Deleted from S3: ${s3Key}`);

    // Delete from DynamoDB
    await dynamoDB
      .delete({
        TableName: 'rahimi-invoices',
        Key: {
          invoice_partition: 'images', // Partition key
          id, // Sort key
        },
      })
      .promise();

    console.log(`Deleted from DynamoDB: ${id}`);

    return new Response(
      JSON.stringify({ message: 'Image deleted successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error deleting image:', error);

    return new Response(JSON.stringify({ error: 'Failed to delete image' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
