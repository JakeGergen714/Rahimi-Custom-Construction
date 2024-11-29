// app/api/image-storage-remaining/route.js
import AWS from 'aws-sdk';
import { verifyAdmin } from '../utils/authUtil'; // Adjust the import path as needed

const s3 = new AWS.S3({
  region: process.env.AWS_REGION, // e.g., 'us-east-1'
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const MAX_STORAGE_LIMIT = 1 * 1024 * 1024 * 1024; // 5 GB in bytes

export async function GET(req) {
  // Authenticate the request
  const authResult = verifyAdmin(req);

  // If authentication fails, verifyAdmin returns a Response object
  if (authResult instanceof Response) {
    // Return the error response
    return authResult;
  }

  // Proceed with your API logic
  try {
    // Calculate total storage used
    const totalStorageUsed = await getTotalStorageUsed();

    // Calculate remaining storage
    const remainingStorage = MAX_STORAGE_LIMIT - totalStorageUsed;

    // Return the remaining storage as JSON
    return new Response(JSON.stringify({ remainingStorage }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error calculating remaining storage:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Function to calculate total storage used in the S3 bucket
async function getTotalStorageUsed() {
  let totalSize = 0;
  let continuationToken = null;

  do {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Prefix: 'images/', // Adjust the prefix if needed
      ContinuationToken: continuationToken,
    };

    const response = await s3.listObjectsV2(params).promise();
    console.log('storage:', response);

    response.Contents.forEach((object) => {
      totalSize += object.Size;
    });

    continuationToken = response.IsTruncated
      ? response.NextContinuationToken
      : null;
  } while (continuationToken);

  console.log(totalSize);
  return totalSize;
}
