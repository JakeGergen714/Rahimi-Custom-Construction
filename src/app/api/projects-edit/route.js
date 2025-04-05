// backend/api/projects-edit.js
import AWS from 'aws-sdk';
import { nanoid } from 'nanoid';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

export async function PUT(req) {
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
    const projectData = await req.json();
    console.log('Received project data for update:', projectData);

    const { id, title, description, mainImage, additionalPictures } =
      projectData;

    // Validate required fields
    if (!id || !title || !description) {
      return new Response(
        JSON.stringify({ error: 'id, title, and description are required.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch existing project data
    const existingProject = await dynamoDB
      .get({
        TableName: 'rahimi-invoices',
        Key: { invoice_partition: 'projects', id },
      })
      .promise();

    if (!existingProject.Item) {
      return new Response(JSON.stringify({ error: 'Project not found.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const {
      mainImage: existingMainImage,
      additionalImages: existingAdditionalImages = [],
    } = existingProject.Item;

    // Determine images to delete
    const imagesToDelete = existingAdditionalImages.filter(
      (existingImage) =>
        !additionalPictures.some(
          (newImage) => newImage.fileName === existingImage.fileName
        )
    );

    // Delete these images from S3
    if (imagesToDelete.length > 0) {
      console.log('Deleting images from S3:', imagesToDelete);

      await Promise.all(
        imagesToDelete.map((image) =>
          s3
            .deleteObject({
              Bucket: process.env.AWS_S3_BUCKET_NAME,
              Key: image.s3Key,
            })
            .promise()
        )
      );
    }

    // Generate presigned URLs for updated main image if provided
    let mainImageUploadUrl = null;
    let newMainImage = existingMainImage;
    if (mainImage && mainImage.fileName !== existingMainImage.fileName) {
      console.log('Generating new id for new main image');
      const mainImageId = nanoid();
      const sanitizedMainImageName = `${mainImageId}-${mainImage.fileName}`;
      const mainImageS3Key = `projects/${sanitizedMainImageName}`;

      mainImageUploadUrl = s3.getSignedUrl('putObject', {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: mainImageS3Key,
        ContentType: mainImage.fileType,
        Expires: 60,
      });

      newMainImage = { s3Key: mainImageS3Key, fileName: mainImage.fileName };
    }

    // Generate presigned URLs for new additional images
    const additionalImageUploads = additionalPictures.map((image) => {
      if (!image.fileName) {
        throw new Error('fileName is required for additional images.');
      }

      const existingImage = existingAdditionalImages.find(
        (img) => img.fileName === image.fileName
      );

      if (existingImage) {
        return {
          s3Key: existingImage.s3Key,
          fileName: existingImage.fileName,
        };
      } else {
        const imageId = nanoid();
        const sanitizedFileName = `${imageId}-${image.fileName}`;
        const s3Key = `projects/${sanitizedFileName}`;
        return {
          s3Key: s3Key,
          fileName: image.fileName,
          fileType: image.fileType,
        };
      }
    });

    const newAdditionalImages = additionalImageUploads.filter(
      (image) =>
        !existingAdditionalImages.some(
          (existingImage) => existingImage.fileName === image.fileName
        )
    );

    const additionalImageUploadUrls = newAdditionalImages.map((image) => ({
      uploadUrl: s3.getSignedUrl('putObject', {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: image.s3Key,
        ContentType: image.fileType,
        Expires: 60,
      }),
      ...image,
    }));

    console.log('Existing Additional Images:', existingAdditionalImages);
    console.log('New Additional Images:', newAdditionalImages);
    console.log('Images to Delete:', imagesToDelete);

    // Combine existing and new additional images
    const updatedAdditionalImages = [
      ...(existingAdditionalImages || []),
      ...newAdditionalImages,
    ].filter(
      (image) =>
        !imagesToDelete.some(
          (deletedImage) => deletedImage.fileName === image.fileName
        )
    );

    console.log('Updated Additional Images:', updatedAdditionalImages);

    // Update project metadata in DynamoDB
    const updateParams = {
      TableName: 'rahimi-invoices',
      Key: {
        invoice_partition: 'projects',
        id,
      },
      UpdateExpression: `
        SET 
          title = :title,
          description = :description,
          mainImage = :mainImage,
          additionalImages = :additionalImages
      `,
      ExpressionAttributeValues: {
        ':title': title,
        ':description': description,
        ':mainImage': newMainImage,
        ':additionalImages': updatedAdditionalImages,
      },
      ReturnValues: 'ALL_NEW',
    };

    const updatedProject = await dynamoDB.update(updateParams).promise();
    console.log('Updated project:', updatedProject);

    return new Response(
      JSON.stringify({
        updatedProject: updatedProject.Attributes,
        mainImageUploadUrl,
        additionalImageUploadUrls,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error updating project:', error);

    return new Response(JSON.stringify({ error: 'Failed to update project' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
