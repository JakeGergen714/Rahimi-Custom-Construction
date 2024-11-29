import {
  PDFDocument,
  StandardFonts,
  rgb,
  degrees,
  PDFName,
  PDFString,
} from 'pdf-lib';
import nodemailer from 'nodemailer';
import AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';

// AWS DynamoDB setup
const dynamoDb = new AWS.DynamoDB.DocumentClient({
  region: 'us-east-2',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// Compile Handlebars template
const logoPath = path.resolve('public/logo.jpg');
const logoBase64 = fs.readFileSync(logoPath, 'base64');

export async function POST(req) {
  const invoice = await req.json();

  // Generate a unique invoice ID
  const latestId = await getLatestInvoiceId();
  const id = latestId + 1;

  const date = new Date().toLocaleDateString();
  const secretCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Save the invoice to DynamoDB
  const invoiceNumber = `PRO-${String(id).padStart(6, '0')}`;
  await dynamoDb
    .put({
      TableName: 'rahimi-invoices',
      Item: {
        invoice_partition: 'invoices',
        id,
        customer_email: invoice.customer_email,
        customer_name: invoice.customer_name,
        lines: invoice.lines,
        amount_due: invoice.amount_due,
        date,
        secretCode,
        isProposal: false,
        status: 'open',
        description: invoice.description,
      },
    })
    .promise();

  const hostUrl = `${
    req.headers.get('x-forwarded-proto') || 'http'
  }://${req.headers.get('host')}`;
  const invoiceLink = `${hostUrl}/api/generate-payment-link?id=${invoice.id}&secretCode=${secretCode}`;

  console.log(invoice);

  // Generate PDF
  const pdfBuffer = await generatePDF({
    description: invoice.description,
    invoiceNumber,
    date,
    customer_name: invoice.customer_name,
    customer_email: invoice.customer_email,
    lines: invoice.lines,
    amount_due: invoice.amount_due,
    invoiceLink,
    logoBase64,
  });

  // Send email with the generated PDF
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.GOOGLE_PASS,
    },
  });

  const mailOptions = {
    from: process.env.ADMIN_EMAIL,
    to: invoice.customer_email,
    bcc: process.env.ADMIN_EMAIL,
    subject: `Invoice for ${invoice.customer_name}`,
    text: `Dear ${invoice.customer_name},\n\nPlease find attached your invoice.\n\nBest regards,\nRahimi Custom Construction LLC`,
    attachments: [
      {
        filename: 'invoice.pdf',
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  };

  try {
    await transporter.sendMail(mailOptions);
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invoice created and sent via email',
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to send invoice pdf',
      }),
      { status: 500 }
    );
  }
}

const generatePDF = async ({
  description,
  invoiceNumber,
  date,
  customer_name,
  customer_email,
  lines,
  amount_due,
  invoiceLink,
  logoBase64,
}) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // Letter size (8.5 x 11 inches)
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Embed the logo
  const logo = await pdfDoc.embedJpg(Buffer.from(logoBase64, 'base64'));
  page.drawImage(logo, {
    x: 40,
    y: 700,
    width: 100,
    height: 100,
  });

  // Add invoice details
  page.drawText(`Invoice Number: ${invoiceNumber}`, {
    x: 200,
    y: 750,
    font: boldFont,
    size: 12,
  });
  page.drawText(`Date: ${date}`, { x: 200, y: 735, font: font, size: 12 });

  // Add customer details
  page.drawText(`BILL TO: ${customer_name}`, {
    x: 40,
    y: 700,
    font: boldFont,
    size: 12,
  });
  page.drawText(customer_email, { x: 40, y: 685, font: font, size: 12 });

  // Add table headers
  let y = 650;
  page.drawText('No', { x: 40, y, font: boldFont, size: 10 });
  page.drawText('Description', { x: 80, y, font: boldFont, size: 10 });
  page.drawText('QTY', { x: 300, y, font: boldFont, size: 10 });
  page.drawText('Unit Price', { x: 350, y, font: boldFont, size: 10 });
  page.drawText('Total Price', { x: 450, y, font: boldFont, size: 10 });

  const rowHeight = 15; // Height of each row
  y -= 15;
  // Add line items
  lines.forEach((line, index) => {
    console.log(line);
    let total_price =
      Number(line.price.unit_amount) * Number(line.price.unit_quantity);
    page.drawText(`${index + 1}`, { x: 40, y, font: font, size: 10 });
    page.drawText(
      line.description + line.description === 'Labor'
        ? ' - ' + description
        : '',
      { x: 80, y, font: font, size: 10 }
    );
    page.drawText(`${Number(line.price.unit_quantity)}`, {
      x: 300,
      y,
      font: font,
      size: 10,
    });
    page.drawText(`$${Number(line.price.unit_amount).toFixed(2)}`, {
      x: 350,
      y,
      font: font,
      size: 10,
    });
    page.drawText(`$${Number(total_price).toFixed(2)}`, {
      x: 450,
      y,
      font: font,
      size: 10,
    });
    y -= 15;
  });

  // Add total amount
  page.drawText(`Total Amount Due: $${Number(amount_due).toFixed(2)}`, {
    x: 350,
    y: y - 20,
    font: boldFont,
    size: 12,
  });

  // Add payment link with custom text
  const linkY = y - 50; // Position for the link
  const linkX = 40;
  const linkText = 'Click here to pay online'; // Custom text for the link

  page.drawText(linkText, {
    x: linkX,
    y: linkY,
    font: boldFont,
    size: 12,
    color: rgb(0, 0, 1), // Blue color to indicate it's clickable
  });

  // Create a link annotation for the payment link
  const createPageLinkAnnotation = (page, uri) =>
    page.doc.context.register(
      page.doc.context.obj({
        Type: 'Annot',
        Subtype: 'Link',
        Rect: [
          linkX,
          linkY - 12,
          linkX + boldFont.widthOfTextAtSize(linkText, 12),
          linkY,
        ], // [x1, y1, x2, y2]
        Border: [0, 0, 0],
        A: {
          Type: 'Action',
          S: 'URI',
          URI: PDFString.of(uri),
        },
      })
    );

  const linkAnnotation = createPageLinkAnnotation(page, invoiceLink);

  // Add the annotation to the page
  page.node.set(PDFName.of('Annots'), pdfDoc.context.obj([linkAnnotation]));

  // Serialize PDF to buffer
  return await pdfDoc.save();
};

// Fetch the latest invoice ID from DynamoDB
const getLatestInvoiceId = async () => {
  const params = {
    TableName: 'rahimi-invoices',
    Limit: 1,
    ScanIndexForward: false,
    KeyConditionExpression: '#partitionKey = :partitionValue',
    ExpressionAttributeNames: { '#partitionKey': 'invoice_partition' },
    ExpressionAttributeValues: { ':partitionValue': 'invoices' },
  };

  const result = await dynamoDb.query(params).promise();
  return result.Items.length > 0 ? result.Items[0].id : 0;
};
