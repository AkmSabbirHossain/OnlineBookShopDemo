using System.Net;
using System.Net.Mail;
using OnlineBookShop.Server.Interfaces;
using Microsoft.Extensions.Configuration;

namespace OnlineBookShop.Server.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;

        public EmailService(IConfiguration config)
        {
            _config = config;
        }

        public async Task SendPasswordResetEmailAsync(string toEmail, string userName, string resetLink)
        {
            var smtpHost = _config["EmailSettings:SmtpHost"]!;
            var smtpPort = _config.GetValue<int>("EmailSettings:SmtpPort");
            var fromEmail = _config["EmailSettings:FromEmail"]!;
            var fromPass = _config["EmailSettings:SmtpKey"]!;
            var fromName = _config["EmailSettings:FromName"] ?? "Sabbir BookMall";
            var smtpLogin = _config["EmailSettings:SmtpLogin"]!;

            // Debug guard: if any of these come back empty, the env vars / config
            // are not being read at runtime — that alone causes "please authenticate first".
            Console.WriteLine($"[EmailDebug] Host={smtpHost}, Port={smtpPort}, Login={smtpLogin}, KeyLength={fromPass?.Length ?? 0}, From={fromEmail}");
            if (string.IsNullOrWhiteSpace(smtpHost) || string.IsNullOrWhiteSpace(smtpLogin) ||
                string.IsNullOrWhiteSpace(fromPass) || smtpPort == 0)
            {
                throw new InvalidOperationException(
                    "EmailSettings configuration is missing or not loaded (check environment variables in the hosting dashboard).");
            }

            var subject = "Reset Your Password — Sabbir BookMall";

            var body = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8' />
    <meta name='viewport' content='width=device-width, initial-scale=1.0' />
</head>
<body style='margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;'>
    <table width='100%' cellpadding='0' cellspacing='0' style='background:#f5f5f5;padding:40px 0;'>
        <tr>
            <td align='center'>
                <table width='560' cellpadding='0' cellspacing='0' style='background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);max-width:100%;'>
                    <!-- Header -->
                    <tr>
                        <td style='background:linear-gradient(135deg,#1a237e,#0d47a1);padding:32px 40px;text-align:center;'>
                            <h1 style='margin:0;color:#fff;font-size:24px;font-weight:800;letter-spacing:-0.5px;'>📚 Sabbir BookMall</h1>
                            <p style='margin:6px 0 0;color:rgba(255,255,255,0.6);font-size:13px;'>Your trusted online bookshop</p>
                        </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                        <td style='padding:40px 40px 32px;'>
                            <h2 style='margin:0 0 12px;color:#1e293b;font-size:20px;font-weight:700;'>Reset Your Password</h2>
                            <p style='margin:0 0 8px;color:#64748b;font-size:15px;line-height:1.6;'>Hi <strong style='color:#1e293b;'>{userName}</strong>,</p>
                            <p style='margin:0 0 28px;color:#64748b;font-size:15px;line-height:1.6;'>
                                We received a request to reset your password. Click the button below to create a new password.
                                This link will expire in <strong style='color:#e8401c;'>1 hour</strong>.
                            </p>
                            <!-- Button -->
                            <div style='text-align:center;margin-bottom:32px;'>
                                <a href='{resetLink}'
                                   style='display:inline-block;background:#e8401c;color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:700;box-shadow:0 4px 12px rgba(232,64,28,0.35);'>
                                    Reset My Password
                                </a>
                            </div>
                            <!-- Security note -->
                            <div style='background:#f8fafc;border-radius:8px;padding:16px 20px;border-left:4px solid #e8401c;'>
                                <p style='margin:0;color:#64748b;font-size:13px;line-height:1.6;'>
                                    🔒 <strong>Security tip:</strong> If you didn't request a password reset, please ignore this email.
                                </p>
                            </div>
                            <p style='margin:24px 0 0;color:#94a3b8;font-size:12px;'>
                                Or copy this link: <a href='{resetLink}' style='color:#0d47a1;word-break:break-all;'>{resetLink}</a>
                            </p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style='background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;'>
                            <p style='margin:0;color:#94a3b8;font-size:12px;'>&copy; {DateTime.UtcNow.Year} Sabbir BookMall. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>";

            try
            {
                using var client = new SmtpClient(smtpHost, smtpPort)
                {
                    // Brevo requires auth with the SMTP Login (e.g. xxxxx@smtp-brevo.com),
                    // NOT the "From" email address.
                    UseDefaultCredentials = false, // MUST be false, and set before/with Credentials
                    Credentials = new NetworkCredential(smtpLogin, fromPass),
                    DeliveryMethod = SmtpDeliveryMethod.Network,
                    EnableSsl = true,
                    Timeout = 20000
                };

                using var mail = new MailMessage
                {
                    From = new MailAddress(fromEmail, fromName),
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = true
                };
                mail.To.Add(toEmail);

                await client.SendMailAsync(mail);
                Console.WriteLine($"✅ Password reset email sent to: {toEmail}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Email Send Failed to {toEmail}: {ex.Message}");
                Console.WriteLine($"StackTrace: {ex.StackTrace}");
                throw;
            }
            //catch (Exception ex)
            //{
            //    Console.WriteLine($"❌ Email Send Failed to {toEmail}: {ex.Message}");

            //    // Walk the full inner exception chain — "Failure sending mail." hides the real cause
            //    var inner = ex.InnerException;
            //    while (inner != null)
            //    {
            //        Console.WriteLine($"   ↳ Inner: {inner.GetType().Name}: {inner.Message}");
            //        inner = inner.InnerException;
            //    }

            //    Console.WriteLine($"StackTrace: {ex.StackTrace}");
            //    throw;
            //}
        }
    }
}


//using System.Net;
//using System.Net.Mail;
//using OnlineBookShop.Server.Interfaces;
//using Microsoft.Extensions.Configuration;

//namespace OnlineBookShop.Server.Services
//{
//    public class EmailService : IEmailService
//    {
//        private readonly IConfiguration _config;

//        public EmailService(IConfiguration config)
//        {
//            _config = config;
//        }

//        public async Task SendPasswordResetEmailAsync(string toEmail, string userName, string resetLink)
//        {
//            var smtpHost = _config["EmailSettings:SmtpHost"]!;
//            var smtpPort = _config.GetValue<int>("EmailSettings:SmtpPort");
//            var fromEmail = _config["EmailSettings:FromEmail"]!;
//            var fromPass = _config["EmailSettings:SmtpKey"]!;     // ← Changed to SmtpKey
//            var fromName = _config["EmailSettings:FromName"] ?? "Sabbir BookMall";
//            var smtpLogin = _config["EmailSettings:SmtpLogin"]!;

//            var subject = "Reset Your Password — Sabbir BookMall";


//            var body = $@"
//<!DOCTYPE html>
//<html>
//<head>
//    <meta charset='UTF-8' />
//    <meta name='viewport' content='width=device-width, initial-scale=1.0' />
//</head>
//<body style='margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;'>
//    <table width='100%' cellpadding='0' cellspacing='0' style='background:#f5f5f5;padding:40px 0;'>
//        <tr>
//            <td align='center'>
//                <table width='560' cellpadding='0' cellspacing='0' style='background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);max-width:100%;'>
//                    <!-- Header -->
//                    <tr>
//                        <td style='background:linear-gradient(135deg,#1a237e,#0d47a1);padding:32px 40px;text-align:center;'>
//                            <h1 style='margin:0;color:#fff;font-size:24px;font-weight:800;letter-spacing:-0.5px;'>📚 Sabbir BookMall</h1>
//                            <p style='margin:6px 0 0;color:rgba(255,255,255,0.6);font-size:13px;'>Your trusted online bookshop</p>
//                        </td>
//                    </tr>
//                    <!-- Body -->
//                    <tr>
//                        <td style='padding:40px 40px 32px;'>
//                            <h2 style='margin:0 0 12px;color:#1e293b;font-size:20px;font-weight:700;'>Reset Your Password</h2>
//                            <p style='margin:0 0 8px;color:#64748b;font-size:15px;line-height:1.6;'>Hi <strong style='color:#1e293b;'>{userName}</strong>,</p>
//                            <p style='margin:0 0 28px;color:#64748b;font-size:15px;line-height:1.6;'>
//                                We received a request to reset your password. Click the button below to create a new password. 
//                                This link will expire in <strong style='color:#e8401c;'>1 hour</strong>.
//                            </p>
//                            <!-- Button -->
//                            <div style='text-align:center;margin-bottom:32px;'>
//                                <a href='{resetLink}' 
//                                   style='display:inline-block;background:#e8401c;color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:700;box-shadow:0 4px 12px rgba(232,64,28,0.35);'>
//                                    Reset My Password
//                                </a>
//                            </div>
//                            <!-- Security note -->
//                            <div style='background:#f8fafc;border-radius:8px;padding:16px 20px;border-left:4px solid #e8401c;'>
//                                <p style='margin:0;color:#64748b;font-size:13px;line-height:1.6;'>
//                                    🔒 <strong>Security tip:</strong> If you didn't request a password reset, please ignore this email.
//                                </p>
//                            </div>
//                            <p style='margin:24px 0 0;color:#94a3b8;font-size:12px;'>
//                                Or copy this link: <a href='{resetLink}' style='color:#0d47a1;word-break:break-all;'>{resetLink}</a>
//                            </p>
//                        </td>
//                    </tr>
//                    <!-- Footer -->
//                    <tr>
//                        <td style='background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;'>
//                            <p style='margin:0;color:#94a3b8;font-size:12px;'>&copy; {DateTime.UtcNow.Year} Sabbir BookMall. All rights reserved.</p>
//                        </td>
//                    </tr>
//                </table>
//            </td>
//        </tr>
//    </table>
//</body>
//</html>";

//            try
//            {
//                using var client = new SmtpClient(smtpHost, smtpPort)
//                {
//                    //  Credentials = new NetworkCredential(fromEmail, fromPass),
//                    Credentials = new NetworkCredential(smtpLogin, fromPass),
//                    EnableSsl = true,
//                    Timeout = 20000
//                };

//                using var mail = new MailMessage
//                {
//                    From = new MailAddress(fromEmail, fromName),
//                    Subject = subject,
//                    Body = body,
//                    IsBodyHtml = true
//                };
//                mail.To.Add(toEmail);

//                await client.SendMailAsync(mail);
//                Console.WriteLine($"✅ Password reset email sent to: {toEmail}");
//            }
//            catch (Exception ex)
//            {
//                Console.WriteLine($"❌ Email Send Failed to {toEmail}: {ex.Message}");
//                Console.WriteLine($"StackTrace: {ex.StackTrace}");
//                throw;
//            }
//        }
//    }
//}
