const baseTemplate = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SaverSonic Email</title>
    <style>
        body {
            font-family: 'Roboto', Arial, sans-serif;
            line-height: 1.6;
            color: #374151;
            background-color: #f3f4f6;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
        }
        .header {
            text-align: center;
            padding: 20px 0;
        }
        .logo {
            max-width: 200px;
        }
        h1, h2 {
            font-family: 'Poppins', Arial, sans-serif;
            color: #312e81;
        }
        .content {
            padding: 20px 0;
        }
        .button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #4f46e5;
            color: #ffffff !important; /* Ensure text is white */
            text-decoration: none;
            border-radius: 9999px;
            font-weight: 500;
        }
        .verification-code {
            font-size: 24px;
            font-weight: bold;
            color: #4f46e5;
            text-align: center;
            padding: 10px;
            border: 2px solid #4f46e5;
            border-radius: 5px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            padding: 20px 0;
            font-size: 0.875rem;
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://saversonic.com/images/logo.png" alt="SaverSonic Logo" class="logo">
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>This is an automated message, please do not reply to this email.</p>
            <p>&copy; 2023 SaverSonic. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

exports.generateVerificationEmailHTML = (username, verificationCode) => {
  const content = `
    <h1>Verify Your SaverSonic Account</h1>
    <p>Hello ${username},</p>
    <p>Thank you for signing up with SaverSonic! To complete your registration, please use the following verification code:</p>
    <div class="verification-code">${verificationCode}</div>
    <p>Enter this code on the verification page to activate your account.</p>
    <p>This code will expire in 15 minutes.</p>
    <p><strong>Security Notice:</strong> If you didn't create an account with SaverSonic, please ignore this email and contact our support team.</p>
  `;
  return baseTemplate(content);
};

exports.generatePasswordResetEmailHTML = (username, resetURL) => {
  const content = `
    <h1>Reset Your SaverSonic Password</h1>
    <p>Hello ${username},</p>
    <p>We received a request to reset your SaverSonic account password. If you didn't make this request, you can safely ignore this email.</p>
    <p>To reset your password, click the button below:</p>
    <p style="text-align: center;">
        <a href="${resetURL}" class="button" style="color: #ffffff;">Reset Password</a>
    </p>
    <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
    <p>${resetURL}</p>
    <p>This link will expire in 1 hour for security reasons.</p>
  `;
  return baseTemplate(content);
};
