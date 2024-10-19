exports.generateVerificationEmailHTML = (username, verificationCode) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your SaverSonic Account</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; text-align: center; padding: 10px; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .footer { text-align: center; margin-top: 20px; font-size: 0.8em; color: #777; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Verify Your SaverSonic Account</h1>
            </div>
            <div class="content">
                <p>Hello ${username},</p>
                <p>Thank you for signing up with SaverSonic! To complete your registration, please use the following verification code:</p>
                <h2 style="text-align: center; color: #4CAF50;">${verificationCode}</h2>
                <p>Enter this code on the verification page to activate your account.</p>
                <p>If you didn't create an account with SaverSonic, please ignore this email.</p>
            </div>
            <div class="footer">
                <p>This is an automated message, please do not reply to this email.</p>
                <p>&copy; 2023 SaverSonic. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

exports.generatePasswordResetEmailHTML = (username, resetURL) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your SaverSonic Password</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #3498db; color: white; text-align: center; padding: 10px; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .button { display: inline-block; padding: 10px 20px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px; }
            .footer { text-align: center; margin-top: 20px; font-size: 0.8em; color: #777; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Reset Your SaverSonic Password</h1>
            </div>
            <div class="content">
                <p>Hello ${username},</p>
                <p>We received a request to reset your SaverSonic account password. If you didn't make this request, you can safely ignore this email.</p>
                <p>To reset your password, click the button below:</p>
                <p style="text-align: center;">
                    <a href="${resetURL}" class="button">Reset Password</a>
                </p>
                <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
                <p>${resetURL}</p>
                <p>This link will expire in 1 hour for security reasons.</p>
            </div>
            <div class="footer">
                <p>This is an automated message, please do not reply to this email.</p>
                <p>&copy; 2023 SaverSonic. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

