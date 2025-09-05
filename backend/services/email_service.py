from flask_mail import Mail, Message
from flask import current_app
import os

mail = Mail()

def send_password_reset_email(user_email, user_name, reset_token):
    """
    Send password reset email with reset link
    """
    try:
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
        reset_link = f"{frontend_url}/reset-password?token={reset_token}"
        
        subject = "🔐 Reset Your Password - Truth Tribunal"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset - Truth Tribunal</title>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background: linear-gradient(135deg, #dc2626, #b91c1c);
                    color: white;
                    padding: 30px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                }}
                .content {{
                    background: #f9fafb;
                    padding: 30px;
                    border-radius: 0 0 10px 10px;
                }}
                .button {{
                    display: inline-block;
                    background: #dc2626;
                    color: white;
                    padding: 12px 24px;
                    text-decoration: none;
                    border-radius: 6px;
                    margin: 20px 0;
                    font-weight: bold;
                }}
                .warning {{
                    background: #fef3c7;
                    border: 1px solid #f59e0b;
                    padding: 15px;
                    border-radius: 6px;
                    margin: 20px 0;
                }}
                .footer {{
                    text-align: center;
                    margin-top: 30px;
                    color: #6b7280;
                    font-size: 14px;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🔐 Password Reset Request</h1>
                <p>Hello {user_name}!</p>
            </div>
            
            <div class="content">
                <h2>Password Reset Request</h2>
                
                <p>We received a request to reset your password for your Truth Tribunal account.</p>
                
                <p>If you made this request, click the button below to reset your password:</p>
                
                <a href="{reset_link}" class="button">
                    🔐 Reset My Password
                </a>
                
                <div class="warning">
                    <strong>⚠️ Important Security Information:</strong>
                    <ul>
                        <li>This link will expire in 1 hour for security reasons</li>
                        <li>If you didn't request this password reset, please ignore this email</li>
                        <li>Your password will remain unchanged until you create a new one</li>
                    </ul>
                </div>
                
                <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace;">
                    {reset_link}
                </p>
                
                <p>If you have any questions or need assistance, please contact our support team.</p>
                
                <p>Best regards,<br>
                <strong>The Truth Tribunal Team</strong></p>
            </div>
            
            <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>&copy; 2024 Truth Tribunal. All rights reserved.</p>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
        Password Reset Request - Truth Tribunal
        
        Hello {user_name},
        
        We received a request to reset your password for your Truth Tribunal account.
        
        If you made this request, click the link below to reset your password:
        {reset_link}
        
        Important Security Information:
        - This link will expire in 1 hour for security reasons
        - If you didn't request this password reset, please ignore this email
        - Your password will remain unchanged until you create a new one
        
        If you have any questions, please contact our support team.
        
        Best regards,
        The Truth Tribunal Team
        """
        
        msg = Message(
            subject=subject,
            recipients=[user_email],
            body=text_body,
            html=html_body
        )
        
        mail.send(msg)
        return True
        
    except Exception as e:
        current_app.logger.error(f"Failed to send password reset email to {user_email}: {str(e)}")
        return False

def send_approval_email(reporter_email, reporter_name, license_key):
    """
    Send approval email with license key to the reporter
    """
    try:
        subject = "🎉 Your Reporter Account Has Been Approved!"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Account Approved - Truth Tribunal</title>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background: linear-gradient(135deg, #dc2626, #b91c1c);
                    color: white;
                    padding: 30px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                }}
                .content {{
                    background: #f9fafb;
                    padding: 30px;
                    border-radius: 0 0 10px 10px;
                }}
                .license-box {{
                    background: #1f2937;
                    color: #fbbf24;
                    padding: 20px;
                    border-radius: 8px;
                    text-align: center;
                    font-family: 'Courier New', monospace;
                    font-size: 18px;
                    font-weight: bold;
                    margin: 20px 0;
                    border: 2px solid #fbbf24;
                }}
                .button {{
                    display: inline-block;
                    background: #dc2626;
                    color: white;
                    padding: 12px 24px;
                    text-decoration: none;
                    border-radius: 6px;
                    margin: 20px 0;
                    font-weight: bold;
                }}
                .footer {{
                    text-align: center;
                    margin-top: 30px;
                    color: #6b7280;
                    font-size: 14px;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🎉 Account Approved!</h1>
                <p>Welcome to Truth Tribunal, {reporter_name}!</p>
            </div>
            
            <div class="content">
                <h2>Great News! Your reporter account has been approved.</h2>
                
                <p>Dear {reporter_name},</p>
                
                <p>We're excited to inform you that your reporter account has been reviewed and approved by our admin team. You can now access your reporter dashboard and start submitting news articles.</p>
                
                <h3>🔑 Your License Key</h3>
                <p>Use this license key to log in to your account:</p>
                
                <div class="license-box">
                    {license_key}
                </div>
                
                <p><strong>Important:</strong> Please keep this license key safe and secure. You'll need it every time you log in.</p>
                
                <h3>🚀 Next Steps</h3>
                <ol>
                    <li>Go to the Truth Tribunal login page</li>
                    <li>Enter your email and password</li>
                    <li>Enter the license key above</li>
                    <li>Start submitting your news articles!</li>
                </ol>
                
                <a href="{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/login" class="button">
                    🚀 Login to Your Dashboard
                </a>
                
                <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
                
                <p>Best regards,<br>
                <strong>The Truth Tribunal Team</strong></p>
            </div>
            
            <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>&copy; 2024 Truth Tribunal. All rights reserved.</p>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
        Account Approved - Truth Tribunal
        
        Dear {reporter_name},
        
        Great news! Your reporter account has been approved. You can now access your reporter dashboard and start submitting news articles.
        
        Your License Key: {license_key}
        
        Important: Please keep this license key safe and secure. You'll need it every time you log in.
        
        Next Steps:
        1. Go to the Truth Tribunal login page
        2. Enter your email and password
        3. Enter the license key above
        4. Start submitting your news articles!
        
        Login URL: {os.getenv('FRONTEND_URL', 'http://localhost:5173')}/login
        
        If you have any questions, please contact our support team.
        
        Best regards,
        The Truth Tribunal Team
        """
        
        msg = Message(
            subject=subject,
            recipients=[reporter_email],
            body=text_body,
            html=html_body
        )
        
        mail.send(msg)
        return True
        
    except Exception as e:
        current_app.logger.error(f"Failed to send approval email to {reporter_email}: {str(e)}")
        return False
