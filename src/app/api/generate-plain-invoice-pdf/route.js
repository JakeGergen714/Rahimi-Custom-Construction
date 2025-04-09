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
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server'; // Use NextResponse for handling server responses

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

  const invoice = await req.json();

  // Generate a unique invoice ID
  const latestId = await getLatestInvoiceId();
  const id = latestId + 1;

  const date = new Date().toLocaleDateString();
  const secretCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Save the invoice to DynamoDB
  const invoiceNumber = `INV-${String(id).padStart(6, '0')}`;
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
  const invoiceLink = `${hostUrl}/api/generate-payment-link?id=${id}&secretCode=${secretCode}`;

  console.log(invoiceLink);

  // Generate PDF
  const pdfBuffer = await generatePDF({
    workDescription: invoice.description,
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
  workDescription,
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
  y -= 15; // Adjust initial y position

  // Add line items
  lines.forEach((line, index) => {
    let total_price =
      Number(line.price.unit_amount) * Number(line.price.unit_quantity);

    // Draw the line index
    page.drawText(`${index + 1}`, { x: 40, y, font: font, size: 10 });

    let descriptionY = y; // Track the Y position for the description
    const descriptionLineLength = 40; // Max characters per line
    let description =
      line.description === 'Labor'
        ? 'Labor - ' + workDescription
        : line.description; // Prepare description
    let descriptionLines = []; // Array to hold wrapped lines
    const descriptionWords = description.split(' '); // Split the description into words

    let currentLine = ''; // To accumulate words for each line

    descriptionWords.forEach((word) => {
      // Check if adding the word would exceed the line length
      if ((currentLine + word).length <= descriptionLineLength) {
        currentLine += (currentLine ? ' ' : '') + word; // Add word with a space if not the first word
      } else {
        // Push the current line to the array and start a new line
        descriptionLines.push(currentLine);
        currentLine = word; // Start new line with the current word
      }
    });

    // Push the last line if it exists
    if (currentLine) {
      descriptionLines.push(currentLine);
    }

    // Draw each line of the wrapped description
    descriptionLines.forEach((descLine, i) => {
      page.drawText(descLine, {
        x: 80,
        y: descriptionY,
        font: font,
        size: 10,
      });
      descriptionY -= rowHeight; // Move Y position for the next line
    });

    // Draw unit quantity, unit amount, and total price
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

    // Update `y` for the next line item
    y = descriptionY - rowHeight; // Add extra row height for spacing
  });

  // Add total amount
  page.drawText(`Total Amount Due: $${Number(amount_due).toFixed(2)}`, {
    x: 350,
    y: y - 20,
    font: boldFont,
    size: 12,
  });

  // Add payment link with custom text
  // Add payment section
  const paymentY = y - 50; // Position for the payment section
  const paymentX = 40;

  page.drawText('Pay Online:', {
    x: paymentX,
    y: paymentY,
    font: boldFont,
    size: 12,
  });

  const linkText =
    'Click here to pay online (A 3.5% card processing fee applies):';
  page.drawText(linkText, {
    x: paymentX,
    y: paymentY - 15,
    font: boldFont,
    size: 10,
    color: rgb(0, 0, 1), // Blue color for the clickable link
  });

  // Add the clickable annotation for the link
  const linkWidth = boldFont.widthOfTextAtSize(linkText, 10);
  const linkAnnotation = pdfDoc.context.register(
    pdfDoc.context.obj({
      Type: 'Annot',
      Subtype: 'Link',
      Rect: [paymentX, paymentY - 10, paymentX + linkWidth, paymentY - 30], // [x1, y1, x2, y2]
      Border: [0, 0, 0],
      A: {
        Type: 'Action',
        S: 'URI',
        URI: PDFString.of(invoiceLink),
      },
    })
  );
  page.node.set(PDFName.of('Annots'), pdfDoc.context.obj([linkAnnotation]));

  page.drawText(
    'Other Payments accepted: Cash, Check or Payment Apps (Paypal, Venmo, etc...)',
    {
      x: paymentX,
      y: paymentY - 75,
      font: boldFont,
      size: 12,
    }
  );

  // Add footer text at the bottom of the page
  const footerY = paymentY - 200; // Y-position near the bottom of the page
  const footerX = 40; // X-position for the text alignment

  page.drawText('Please let me know if you have any questions or concerns.', {
    x: footerX,
    y: footerY + 40,
    font: font,
    size: 10,
  });

  page.drawText('Sincerely,', {
    x: footerX,
    y: footerY + 25,
    font: font,
    size: 10,
  });

  page.drawText('Farzad Rahimi', {
    x: footerX,
    y: footerY + 10,
    font: boldFont,
    size: 10,
  });

  page.drawText('Rahimi Custom Construction LLC', {
    x: footerX,
    y: footerY - 5,
    font: font,
    size: 10,
  });

  page.drawText('rahimillc123@gmail.com', {
    x: footerX,
    y: footerY - 20,
    font: font,
    size: 10,
  });

  page.drawText('(703) 341-9507', {
    x: footerX,
    y: footerY - 35,
    font: font,
    size: 10,
  });

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
