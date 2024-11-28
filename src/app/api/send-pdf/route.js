import nodemailer from 'nodemailer';

export async function POST(req, res) {
  const { customer_email, customer_name, pdfData } = await req.json(); // Parse the JSON body

  const adminEmail = process.env.ADMIN_EMAIL;

  // Set up Nodemailer transport
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // Replace with your SMTP server if needed
    port: 587, // 587 for TLS or 465 for SSL
    secure: false, // Use TLS (false), SSL (true) would require port 465
    auth: {
      user: process.env.SMTP_USER, // Your email address (from environment variables)
      pass: process.env.GOOGLE_PASS, // Your email password or app-specific password (from environment variables)
    },
  });

  // Convert the base64 PDF data back to a Buffer
  const pdfBuffer = Buffer.from(pdfData, 'base64');

  // Define the email options
  const mailOptions = {
    from: process.env.SMTP_USER, // Sender address
    to: customer_email, // Email sent to the customer
    bcc: adminEmail, // BCC the admin (invisible to the customer)
    subject: `Invoice for ${customer_name}`, // Subject line
    text: `Dear ${customer_name},\n\nPlease find attached your invoice.\n\nBest regards,\nYour Company`, // Plain text body
    attachments: [
      {
        filename: 'invoice.pdf',
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  };

  try {
    // Send the email
    await transporter.sendMail(mailOptions);
    return res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ error: 'Error sending email' });
  }
}
