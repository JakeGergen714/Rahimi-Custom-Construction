import AWS from 'aws-sdk';

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    // Fetch all projects from DynamoDB
    const { Items } = await dynamoDB
      .query({
        TableName: 'rahimi-invoices', // Assuming the table name is still 'rahimi-invoices'
        KeyConditionExpression: 'invoice_partition = :partitionKey', // Correct key
        ExpressionAttributeValues: {
          ':partitionKey': 'projects', // Correct partition key value for projects
        },
      })
      .promise();

    // Generate signed URLs for main image and additional images in each project
    const projectsWithSignedUrls = await Promise.all(
      Items.map(async (project) => {
        // Generate signed URL for the main image
        const mainImageSignedUrl = s3.getSignedUrl('getObject', {
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: project.mainImage.s3Key, // Directly use the s3Key
          Expires: 10, // URL expiry in seconds (1 hour)
        });

        // Generate signed URLs for additional images
        const additionalImagesWithSignedUrls = await Promise.all(
          project.additionalImages.map((image) => {
            const signedUrl = s3.getSignedUrl('getObject', {
              Bucket: process.env.AWS_S3_BUCKET_NAME,
              Key: image.s3Key, // Directly use the s3Key
              Expires: 3600,
            });

            return {
              ...image,
              signedUrl,
            };
          })
        );

        // Return the project with signed URLs
        return {
          ...project,
          mainImage: {
            ...project.mainImage,
            signedUrl: mainImageSignedUrl,
          },
          additionalImages: additionalImagesWithSignedUrls,
        };
      })
    );

    console.log('Projects with Signed URLs:', projectsWithSignedUrls);

    return new Response(JSON.stringify({ projects: projectsWithSignedUrls }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store', // Ensures no caching by Vercel or other intermediaries
      },
    });
  } catch (error) {
    console.error('Error fetching projects:', error);

    return new Response(JSON.stringify({ error: 'Failed to fetch projects' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store', // Ensures no caching by Vercel or other intermediaries
      },
    });
  }
}
