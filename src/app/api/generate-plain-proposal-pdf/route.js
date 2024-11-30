import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import nodemailer from 'nodemailer';
import fs from 'fs';
import Handlebars from 'handlebars';
import path from 'path';
import AWS from 'aws-sdk';

// File paths and Handlebars setup
const templatePath = path.join(
  process.cwd(),
  'src/templates/proposalTemplate.html'
);
const template = fs.readFileSync(templatePath, 'utf8');
const compiledTemplate = Handlebars.compile(template);
const logoPath = path.resolve('public/logo.jpg');
const logoBase64 = fs.readFileSync(logoPath, 'base64');

// AWS DynamoDB setup
const dynamoDb = new AWS.DynamoDB.DocumentClient({
  region: 'us-east-2',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const adminEmail = process.env.ADMIN_EMAIL;

export async function POST(req) {
  const invoice = await req.json();

  console.log(invoice);

  const latestId = await getLatestInvoiceId();
  const id = latestId + 1;
  console.log(`Generated ID: ${id}`);

  const date = new Date().toLocaleDateString();
  const secretCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Create the DynamoDB entry
  const params = {
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
      isProposal: true,
      status: 'open',
      description: invoice.description,
    },
  };

  await dynamoDb.put(params).promise();

  // Prepare the HTML for the PDF
  const paddedId = String(id).padStart(6, '0');
  const invoiceNumber = `PRO-${paddedId}`;
  const html = compiledTemplate({
    ...invoice,
    invoiceNumber,
    invoiceDate: date,
    lines: invoice.lines.map((line, index) => ({
      ...line,
      qty: invoice.hoursWorked,
      total_price: (line.price.unit_amount * invoice.hoursWorked).toFixed(2),
    })),
    logoPath: `data:image/jpeg;base64,${logoBase64}`,
    description: invoice.description,
  });

  // Generate the PDF using puppeteer-core and @sparticuz/chrome-aws-lambda
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
    from: adminEmail,
    to: invoice.customer_email,
    bcc: adminEmail,
    subject: `Proposal for ${invoice.customer_name}`,
    text: `Dear ${invoice.customer_name},\n\nPlease find attached your proposal.\n\nBest regards,\nRahimi Custom Construction LLC`,
    attachments: [
      {
        filename: 'proposal.pdf',
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
        message: 'Proposal created and sent via Email',
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to send proposal pdf',
      }),
      { status: 500 }
    );
  }
}

// Generate PDF using puppeteer-core and @sparticuz/chrome-aws-lambda
const generatePDF = async (html) => {
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdfBuffer = await page.pdf({ format: 'A4' });
  await browser.close();

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
