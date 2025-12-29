import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail', // Or use host/port from env
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendOtpEmail = async (email: string, otp: string) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your Verification Code',
        text: `Your verification code is: ${otp}. It expires in 10 minutes.`,
        html: `<p>Your verification code is: <strong>${otp}</strong></p><p>It expires in 10 minutes.</p>`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`OTP sent to ${email}`);
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send verification email');
    }
};

export const sendConnectionRequestEmail = async (email: string, senderName: string) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'New Connection Request',
        text: `You have received a connection request from ${senderName}. Log in to Hirelyze to accept.`,
        html: `<p>You have received a connection request from <strong>${senderName}</strong>.</p><p><a href="${frontendUrl}/dashboard/connections">Log in to Hirelyze</a> to accept.</p>`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Connection request email sent to ${email}`);
    } catch (error) {
        console.error('Error sending connection request email:', error);
        // Don't throw error to avoid blocking the request
    }
};

export const sendInvitationEmail = async (email: string, senderName: string) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Invitation to Join',
        text: `${senderName} has invited you to connect . Register now to accept the request.`,
        html: `<p><strong>${senderName}</strong> has invited you to connect.</p><p><a href="${frontendUrl}/auth?view=register">Register now</a> to accept the request.</p>`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Invitation email sent to ${email}`);
    } catch (error) {
        console.error('Error sending invitation email:', error);
        // Don't throw error to avoid blocking the request
    }
};

export const sendAdminInvitationEmail = async (email: string, name: string, tempPassword: string) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Welcome to Hirelyze - Your Login Details',
        text: `Hello ${name},\n\nYou have been invited to join Hirelyze. Here are your login details:\n\nEmail: ${email}\nTemporary Password: ${tempPassword}\n\nPlease log in at ${frontendUrl}/auth and change your password immediately.`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2>Welcome to Hirelyze!</h2>
                <p>Hello <strong>${name}</strong>,</p>
                <p>You have been invited to join the platform. Here are your temporary login credentials:</p>
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
                    <p style="margin: 5px 0;"><strong>Temporary Password:</strong> ${tempPassword}</p>
                </div>
                <p>Please log in immediately and change your password.</p>
                <a href="${frontendUrl}/auth" style="display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Log In Now</a>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Admin invitation email sent to ${email}`);
    } catch (error) {
        console.error('Error sending admin invitation email:', error);
        throw new Error('Failed to send invitation email');
    }
};
