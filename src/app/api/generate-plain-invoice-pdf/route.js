import puppeteer from 'puppeteer';
import nodemailer from 'nodemailer';
import fs from 'fs';
import Handlebars from 'handlebars';
import path from 'path';
import AWS from 'aws-sdk';

const templatePath = path.join(
  process.cwd(),
  'src/templates/invoiceTemplate.html'
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
  const isNewInvoice = !invoice.id;
  const date = new Date().toLocaleDateString();
  const secretCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Determine ID for new invoice
  if (isNewInvoice) {
    console.log('Creating a new invoice.');
    const latestId = await getLatestInvoiceId();
    invoice.id = latestId + 1;
  } else {
    console.log(`Converting proposal to invoice with ID ${invoice.id}`);
  }

  // Prepare DynamoDB parameters for update
  const params = {
    TableName: 'rahimi-invoices',
    Key: { invoice_partition: 'invoices', id: invoice.id },
    UpdateExpression: `SET customer_email = :email, customer_name = :name, description = :description,
                     #linesAttr = :lines, amount_due = :amount_due, #dateAttr = :date, 
                     secretCode = :code, #statusAttr = :status, isProposal = :proposal`,
    ExpressionAttributeNames: {
      '#linesAttr': 'lines', // Alias for 'lines'
      '#dateAttr': 'date', // Alias for 'date'
      '#statusAttr': 'status', // Alias for 'status'
    },
    ExpressionAttributeValues: {
      ':email': invoice.customer_email,
      ':name': invoice.customer_name,
      ':lines': invoice.lines,
      ':amount_due': invoice.amount_due,
      ':description': invoice.description,
      ':date': date,
      ':code': secretCode,
      ':status': 'open',
      ':proposal': false,
    },
    ConditionExpression: isNewInvoice ? 'attribute_not_exists(id)' : undefined,
  };

  try {
    // Insert new invoice or update existing proposal
    if (isNewInvoice) {
      await dynamoDb
        .put({
          TableName: params.TableName,
          Item: {
            invoice_partition: 'invoices',
            id: invoice.id,
            customer_email: invoice.customer_email,
            customer_name: invoice.customer_name,
            description: invoice.description,
            lines: invoice.lines,
            amount_due: invoice.amount_due,
            date: date,
            secretCode: secretCode,
            status: 'open',
            isProposal: false,
          },
        })
        .promise();
      console.log('Created new invoice:', invoice.id);
    } else {
      await dynamoDb.update(params).promise();
      console.log('Updated proposal to invoice:', invoice.id);
    }

    // Generate PDF with Puppeteer and send email
    const paddedId = String(invoice.id).padStart(6, '0');
    const invoiceNumber = 'INV-' + paddedId;
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
        qty: invoice.hoursWorked,
        total_price: (line.price.unit_amount * invoice.hoursWorked).toFixed(2),
      })),
      logoPath: `data:image/jpeg;base64,${logoBase64}`,
      invoiceLink: invoiceLink,
      description: invoice.description,
    });

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4' });
    await browser.close();

    // Email setup
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

    await transporter.sendMail(mailOptions);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invoice created or updated and sent via Email',
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing invoice:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to process invoice',
      }),
      { status: 500 }
    );
  }
}

// Fetches the latest invoice ID
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
