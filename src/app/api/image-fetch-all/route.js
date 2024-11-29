import AWS from 'aws-sdk';

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

export async function GET(req) {
  try {
    const { Items } = await dynamoDB
      .query({
        TableName: 'rahimi-invoices',
        KeyConditionExpression: 'invoice_partition = :partitionKey',
        ExpressionAttributeValues: {
          ':partitionKey': 'images',
        },
      })
      .promise();

    console.log('Fetched Data:', Items);

    // Generate signed URLs for each image
    const imagesWithSignedUrls = Items.map((item) => {
      const url = new URL(item.imageUrl);
      const s3Key = url.pathname.slice(1); // Extract the S3 key
      console.log('Extracted S3 Key:', s3Key);
      const signedUrl = s3.getSignedUrl('getObject', {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: s3Key,
        Expires: 3600, // URL expiry in seconds (1 hour)
      });

      return {
        ...item,
        signedUrl,
      };
    });

    console.log(imagesWithSignedUrls);

    return new Response(JSON.stringify({ images: imagesWithSignedUrls }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching images:', error);

    return new Response(JSON.stringify({ error: 'Failed to fetch images' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
