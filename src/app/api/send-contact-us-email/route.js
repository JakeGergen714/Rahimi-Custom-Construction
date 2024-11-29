import nodemailer from 'nodemailer';

export async function POST(req) {
  try {
    const body = await req.json(); // Parse the request body
    const { email, name, phone, message } = body;

    // Configure the transporter with your email provider details
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.GOOGLE_PASS,
      },
    });

    // Send the email
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.ADMIN_EMAIL,
      subject: 'New Message from Rahimi Custom Construction Contact Form',
      text: `Hello,\n\nYou have received a new message from your website contact form.\n\nFull Name: ${name}\nEmail: ${email}\nPhone: ${phone}\n\nMessage:\n${message}\n\nBest regards,\nGergen Software`,
    });

    return new Response(
      JSON.stringify({ message: 'Email sent successfully' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Email send error:', error);
    return new Response(JSON.stringify({ error: 'Failed to send email' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
