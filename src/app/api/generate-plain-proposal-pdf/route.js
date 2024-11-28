import puppeteer from 'puppeteer';
import nodemailer from 'nodemailer';
import fs from 'fs';
import Handlebars from 'handlebars';
const path = require('path');
import AWS from 'aws-sdk';

const templatePath = path.join(
  process.cwd(),
  'src/templates/proposalTemplate.html'
);
let template = fs.readFileSync(templatePath, 'utf8');
const compiledTemplate = Handlebars.compile(template);
const logoPath = path.resolve('public/logo.jpg');
const logoBase64 = fs.readFileSync(logoPath, 'base64');

const adminEmail = process.env.ADMIN_EMAIL;

const dynamoDb = new AWS.DynamoDB.DocumentClient({
  region: 'us-east-2',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

export async function POST(req) {
  const invoice = await req.json();

  console.log(invoice);

  const latestId = await getLatestInvoiceId();
  console.log('fetched id', latestId);
  const id = latestId + 1;
  console.log(id);

  const date = new Date().toLocaleDateString();
  const secretCode = Math.floor(100000 + Math.random() * 900000).toString();
  // Create the DynamoDB entry
  const params = {
    TableName: 'rahimi-invoices',
    Item: {
      invoice_partition: 'invoices', // Static partition key value
      id,
      customer_email: invoice.customer_email,
      customer_name: invoice.customer_name,
      lines: invoice.lines,
      amount_due: invoice.amount_due,
      date: date,
      secretCode: secretCode,
      isProposal: true,
      status: 'open',
      description: invoice.description,
    },
  };

  // Store the email and code in DynamoDB
  await dynamoDb.put(params).promise();

  // Load the HTML template
  const paddedId = String(id).padStart(6, '0'); // Adjust the '6' to your desired total length
  const invoiceNumber = 'PRO-' + paddedId;

  const html = compiledTemplate({
    ...invoice,
    invoiceNumber: invoiceNumber,
    invoiceDate: new Date().toLocaleDateString(),
    lines: invoice.lines.map((line, index) => ({
      ...line,
      qty: invoice.hoursWorked,
      total_price: (line.price.unit_amount * invoice.hoursWorked).toFixed(2),
    })),
    logoPath: `data:image/jpeg;base64,${logoBase64}`,
    description: invoice.description,
  });

  // Launch Puppeteer to render the HTML and generate PDF
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdfBuffer = await page.pdf({ format: 'A4' });
  await browser.close();

  // Set up Nodemailer to send the PDF
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

const getLatestInvoiceId = async () => {
  const params = {
    TableName: 'rahimi-invoices',
    // Limit to 1 item to get only the latest
    Limit: 1,
    ScanIndexForward: false, // Sorts in descending order to get the highest id
    KeyConditionExpression: '#partitionKey = :partitionValue',
    ExpressionAttributeNames: {
      '#partitionKey': 'invoice_partition', // Use 'invoice_partition' as the partition key name
    },
    ExpressionAttributeValues: {
      ':partitionValue': 'invoices', // Static value for 'invoice_partition' when inserting records
    },
  };

  const result = await dynamoDb.query(params).promise();
  return result.Items.length > 0 ? result.Items[0].id : 0; // Return the latest invoice ID or 0 if no items exist
};
