import * as pdf from 'html-pdf-node';
import nodemailer from 'nodemailer';
import AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';

// AWS DynamoDB setup
const dynamoDb = new AWS.DynamoDB.DocumentClient({
  region: 'us-east-2',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// Compile Handlebars template
const templatePath = path.join(
  process.cwd(),
  'src/templates/invoiceTemplate.html'
);
const templateContent = fs.readFileSync(templatePath, 'utf8');
const compiledTemplate = Handlebars.compile(templateContent);
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

  const html = compiledTemplate({
    ...invoice,
    invoiceNumber: invoiceNumber,
    invoiceDate: date,
    lines: invoice.lines.map((line) => ({
      ...line,
      description:
        line.description === 'Labor'
          ? `${line.description} - ${invoice.description}`
          : line.description,
      qty: invoice.hoursWorked,
      total_price: (line.price.unit_amount * invoice.hoursWorked).toFixed(2),
    })),
    logoPath: `data:image/jpeg;base64,${logoBase64}`,
    invoiceLink: invoiceLink,
  });

  // Generate PDF from HTML
  const pdfBuffer = await generatePDF(html);

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

// Generate PDF from HTML
const generatePDF = async (html) => {
  const options = { format: 'A4' }; // PDF page format
  const file = { content: html }; // Pass the HTML content
  const pdfBuffer = await pdf.generatePdf(file, options);
  return pdfBuffer;
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
