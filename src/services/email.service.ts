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
        subject: 'Invitation to Join Hirelyze',
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
