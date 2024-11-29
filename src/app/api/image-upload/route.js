import AWS from 'aws-sdk';
import { nanoid } from 'nanoid';

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();
const dynamoDB = new AWS.DynamoDB.DocumentClient();

export async function POST(req) {
  try {
    const { fileName, fileType } = await req.json();

    console.log('Original File Name:', fileName, fileType);

    // Generate a unique ID for the image
    const imageId = nanoid();

    // Sanitize the filename
    const sanitizedFileName = `${imageId}-${fileName}`;

    // Define S3 bucket and key
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    const s3Key = `images/${sanitizedFileName}`;

    console.log('S3 Key:', s3Key);

    // Get a signed URL for upload (PUT)
    const uploadUrl = s3.getSignedUrl('putObject', {
      Bucket: bucketName,
      Key: s3Key,
      ContentType: fileType,
      Expires: 60, // URL expiry in seconds
    });

    // Get a signed URL for accessing the object (GET)
    const imageUrl = s3.getSignedUrl('getObject', {
      Bucket: bucketName,
      Key: s3Key,
      Expires: 86400, // URL expiry in seconds
    });

    console.log('Image URL:', imageUrl);

    // Save metadata in DynamoDB
    await dynamoDB
      .put({
        TableName: 'rahimi-invoices',
        Item: {
          invoice_partition: 'images', // Partition key
          id: Date.now(), // Sort key (or unique identifier)
          fileName,
          imageUrl,
          s3Key, // Store the s3Key for deletion purposes
          createdAt: new Date().toISOString(),
        },
      })
      .promise();

    return new Response(JSON.stringify({ uploadUrl, imageUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error uploading image:', error);

    return new Response(JSON.stringify({ error: 'Failed to upload image' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
