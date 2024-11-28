import AWS from 'aws-sdk';

const dynamoDb = new AWS.DynamoDB.DocumentClient({
  region: 'us-east-2',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

export async function PUT(req) {
  try {
    const invoice = await req.json();

    if (!invoice || !invoice.id) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invoice ID is required.' }),
        { status: 400 }
      );
    }

    const params = {
      TableName: 'rahimi-invoices',
      Key: { invoice_partition: 'invoices', id: invoice.id },
      UpdateExpression: 'SET #statusAttr = :status',
      ExpressionAttributeNames: { '#statusAttr': 'status' },
      ExpressionAttributeValues: { ':status': 'paid' },
    };

    await dynamoDb.update(params).promise();
    console.log(`Invoice ${invoice.id} marked as paid.`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Invoice ${invoice.id} marked as paid.`,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error marking invoice as paid:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to mark invoice as paid.',
      }),
      { status: 500 }
    );
  }
}
