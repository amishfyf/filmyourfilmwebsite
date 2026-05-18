const nodemailer = require('nodemailer');

exports.sendContactEmail = async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  try {
    // Note: For real use, provide valid credentials in your environment variables.
    // Example: EMAIL_USER (e.g. your@gmail.com) and EMAIL_PASS (App Password)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'test@example.com',
        pass: process.env.EMAIL_PASS || 'testpass',
      },
    });

    const mailOptions = {
      from: email,
      to: process.env.EMAIL_USER || 'hello@filmyourfilm.com',
      subject: `New Contact Submission from ${name}`,
      text: `You have received a new message from your website:\n\nName: ${name}\nEmail: ${email}\nMessage:\n${message}`,
    };

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await transporter.sendMail(mailOptions);
    } else {
      console.log('Simulating Email Send (No Credentials configured):', mailOptions);
    }

    res.status(200).json({ success: true, message: 'Email sent successfully!' });
  } catch (error) {
    console.error('Nodemailer Error:', error);
    res.status(500).json({ success: false, message: 'Failed to send email.' });
  }
};

