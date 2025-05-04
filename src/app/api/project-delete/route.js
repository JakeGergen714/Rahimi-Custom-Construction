// backend/api/project-upload.js
import AWS from 'aws-sdk';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();
const dynamoDB = new AWS.DynamoDB.DocumentClient();

export async function DELETE(req) {
  // 1️⃣ Auth
  const cookies = req.headers.get('cookie') || '';
  const { auth_token: token } = parse(cookies);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.isAdmin) throw new Error();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { projectId, mainImage, additionalImages } = await req.json();
    if (projectId == null) {
      return new Response(JSON.stringify({ error: 'projectId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const Objects = [];
    if (mainImage?.s3Key) Objects.push({ Key: mainImage.s3Key });
    if (Array.isArray(additionalImages)) {
      additionalImages.forEach((img) => {
        if (img.s3Key) Objects.push({ Key: img.s3Key });
      });
    }

    if (Objects.length) {
      await s3
        .deleteObjects({
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Delete: { Objects, Quiet: true },
        })
        .promise();
    }

    await dynamoDB
      .delete({
        TableName: 'rahimi-invoices',
        Key: {
          invoice_partition: 'projects',
          id: projectId,
        },
      })
      .promise();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error deleting project:', err);
    return new Response(JSON.stringify({ error: 'Failed to delete project' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
