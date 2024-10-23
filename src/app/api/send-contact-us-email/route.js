import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { email, full_name, phone, message } = req.body;

    // Configure the transporter with your email provider details
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', // Replace with your SMTP server (e.g., smtp.gmail.com for Gmail)
      port: 587, // Use 465 for secure, or 587/2525 for non-secure
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER, // Your SMTP user (e.g., email address)
        pass: process.env.GOOGLE_PASS, // Your SMTP password or app-specific password
      },
    });

    try {
      // Send the email
      await transporter.sendMail({
        from: process.env.SMTP_USER, // Sender address
        to: process.env.SMTP_USER, // Receiver's email address
        subject: 'New Message from Your Website Contact Form',
        text: `Hello,\n\nYou have received a new message from your website contact form.\n\nFull Name: ${full_name}\nEmail: ${email}\nPhone: ${phone}\n\nMessage:\n${message}\n\nBest regards,\nYour Website Team`,
      });

      res.status(200).json({ message: 'Email sent successfully' });
    } catch (error) {
      console.error('Email send error:', error);
      res.status(500).json({ error: 'Failed to send email' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
