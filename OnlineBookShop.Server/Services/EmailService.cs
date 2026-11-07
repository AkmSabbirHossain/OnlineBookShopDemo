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
//            var fromPass = _config["EmailSettings:SmtpKey"]!;
//            var fromName = _config["EmailSettings:FromName"] ?? "Sabbir BookMall";
//            var smtpLogin = _config["EmailSettings:SmtpLogin"]!;

//            // Debug guard: if any of these come back empty, the env vars / config
//            // are not being read at runtime — that alone causes "please authenticate first".
//            Console.WriteLine($"[EmailDebug] Host={smtpHost}, Port={smtpPort}, Login={smtpLogin}, KeyLength={fromPass?.Length ?? 0}, From={fromEmail}");
//            if (string.IsNullOrWhiteSpace(smtpHost) || string.IsNullOrWhiteSpace(smtpLogin) ||
//                string.IsNullOrWhiteSpace(fromPass) || smtpPort == 0)
//            {
//                throw new InvalidOperationException(
//                    "EmailSettings configuration is missing or not loaded (check environment variables in the hosting dashboard).");
//            }

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
//                    // Brevo requires auth with the SMTP Login (e.g. xxxxx@smtp-brevo.com),
//                    // NOT the "From" email address.
//                    UseDefaultCredentials = false, // MUST be false, and set before/with Credentials
//                    Credentials = new NetworkCredential(smtpLogin, fromPass),
//                    DeliveryMethod = SmtpDeliveryMethod.Network,
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
//            //catch (Exception ex)
//            //{
//            //    Console.WriteLine($"❌ Email Send Failed to {toEmail}: {ex.Message}");

//            //    // Walk the full inner exception chain — "Failure sending mail." hides the real cause
//            //    var inner = ex.InnerException;
//            //    while (inner != null)
//            //    {
//            //        Console.WriteLine($"   ↳ Inner: {inner.GetType().Name}: {inner.Message}");
//            //        inner = inner.InnerException;
//            //    }

//            //    Console.WriteLine($"StackTrace: {ex.StackTrace}");
//            //    throw;
//            //}
//        }
//    }
//}


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
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using OnlineBookShop.Server.DTOs;
using OnlineBookShop.Server.Interfaces;
using Microsoft.Extensions.Configuration;

namespace OnlineBookShop.Server.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;
        private readonly IHttpClientFactory _httpClientFactory;
        private const string BrevoApiUrl = "https://api.brevo.com/v3/smtp/email";
        private const string SiteUrl = "https://sabbirbookworld.vercel.app";

        public EmailService(IConfiguration config, IHttpClientFactory httpClientFactory)
        {
            _config = config;
            _httpClientFactory = httpClientFactory;
        }

        public async Task SendOrderConfirmationEmailAsync(OrderEmailInfoDto info)
        {
            var subject = $"অর্ডার কনফার্মেশন #{info.OrderId} — Sabbir BookMall";
            var itemRows = string.Join("", info.Items.Select(i => $@"
                    <tr>
                        <td style='padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#1e293b;font-size:14px;'>{i.Title}</td>
                        <td style='padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;text-align:center;'>{i.Quantity}</td>
                        <td style='padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#1e293b;font-size:14px;text-align:right;'>৳{i.Price:F0}</td>
                        <td style='padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#1e293b;font-size:14px;text-align:right;font-weight:700;'>৳{i.Price * i.Quantity:F0}</td>
                    </tr>"));

            var discountRow = info.DiscountAmount > 0
                ? $@"
                    <tr>
                        <td colspan='3' style='padding:8px 12px;color:#16a34a;font-size:14px;'>Coupon ছাড় {(!string.IsNullOrEmpty(info.CouponCode) ? $"({info.CouponCode})" : "")}</td>
                        <td style='padding:8px 12px;color:#16a34a;font-size:14px;text-align:right;font-weight:700;'>-৳{info.DiscountAmount:F0}</td>
                    </tr>"
                : "";

            var addressBlock = !string.IsNullOrWhiteSpace(info.ShippingAddress)
                ? $@"
                            <p style='margin:0 0 4px;color:#1e293b;font-size:14px;font-weight:700;'>ডেলিভারি ঠিকানা</p>
                            <p style='margin:0;color:#64748b;font-size:14px;line-height:1.6;'>{info.ShippingAddress}</p>"
                : "";

            var body = OrderEmailShell(info, $@"
                            <h2 style='margin:0 0 12px;color:#1e293b;font-size:20px;font-weight:700;'>অর্ডার সফল হয়েছে! 🎉</h2>
                            <p style='margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.6;'>
                                ধন্যবাদ <strong style='color:#1e293b;'>{info.UserName}</strong>! আপনার অর্ডার
                                <strong style='color:#1e293b;'>#{info.OrderId}</strong> গ্রহণ করা হয়েছে। আমরা শীঘ্রই এটি প্রসেস করব।
                            </p>
                            <table width='100%' cellpadding='0' cellspacing='0' style='border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:20px;'>
                                <tr style='background:#f8fafc;'>
                                    <td style='padding:10px 12px;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;'>বই</td>
                                    <td style='padding:10px 12px;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;text-align:center;'>পরিমাণ</td>
                                    <td style='padding:10px 12px;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;text-align:right;'>দাম</td>
                                    <td style='padding:10px 12px;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;text-align:right;'>মোট</td>
                                </tr>
                                {itemRows}
                                <tr>
                                    <td colspan='3' style='padding:10px 12px;color:#64748b;font-size:14px;'>সাবটোটাল</td>
                                    <td style='padding:10px 12px;color:#1e293b;font-size:14px;text-align:right;'>৳{info.SubtotalAmount:F0}</td>
                                </tr>
                                {discountRow}
                                <tr style='background:#fff7ed;'>
                                    <td colspan='3' style='padding:12px;color:#1e293b;font-size:15px;font-weight:800;'>সর্বমোট</td>
                                    <td style='padding:12px;color:#e8401c;font-size:16px;text-align:right;font-weight:800;'>৳{info.TotalAmount:F0}</td>
                                </tr>
                            </table>
                            {addressBlock}");

            await SendViaBrevoAsync(info.ToEmail, info.UserName, subject, body);
        }

        public async Task SendOrderStatusEmailAsync(OrderEmailInfoDto info)
        {
            var (title, accent, message) = info.Status switch
            {
                "Paid" => ("পেমেন্ট নিশ্চিত হয়েছে 💳", "#0d47a1", $"অর্ডার #{info.OrderId} এর পেমেন্ট সফলভাবে নিশ্চিত হয়েছে। আমরা শীঘ্রই অর্ডারটি প্রসেস করব।"),
                "Shipped" => ("অর্ডার পাঠানো হয়েছে 🚚", "#b45309", $"অর্ডার #{info.OrderId} কুরিয়ারে পাঠানো হয়েছে। শীঘ্রই আপনার কাছে পৌঁছে যাবে।"),
                "Delivered" => ("অর্ডার পৌঁছে গেছে 📦", "#16a34a", $"অর্ডার #{info.OrderId} সফলভাবে ডেলিভারি হয়েছে। আমাদের সাথে কেনাকাটা করার জন্য ধন্যবাদ!"),
                "Cancelled" => ("অর্ডার বাতিল হয়েছে ❌", "#dc2626", $"অর্ডার #{info.OrderId} বাতিল করা হয়েছে। পেইড থাকলে রিফান্ড প্রসেস হবে।"),
                _ => ("অর্ডার আপডেট 🔔", "#1a237e", $"অর্ডার #{info.OrderId} এর স্ট্যাটাস এখন: {info.Status}")
            };

            var subject = $"{title} — অর্ডার #{info.OrderId} — Sabbir BookMall";

            var body = OrderEmailShell(info, $@"
                            <div style='background:{accent};border-radius:8px;padding:16px 20px;margin-bottom:20px;'>
                                <p style='margin:0;color:#fff;font-size:16px;font-weight:700;'>{title}</p>
                            </div>
                            <p style='margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.6;'>
                                প্রিয় <strong style='color:#1e293b;'>{info.UserName}</strong>, {message}
                            </p>
                            <table width='100%' cellpadding='0' cellspacing='0' style='border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:20px;'>
                                <tr style='background:#f8fafc;'>
                                    <td style='padding:10px 12px;color:#64748b;font-size:12px;font-weight:700;'>বই</td>
                                    <td style='padding:10px 12px;color:#64748b;font-size:12px;font-weight:700;text-align:center;'>পরিমাণ</td>
                                    <td style='padding:10px 12px;color:#64748b;font-size:12px;font-weight:700;text-align:right;'>মোট</td>
                                </tr>
                                {string.Join("", info.Items.Select(i => $@"
                                <tr>
                                    <td style='padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#1e293b;font-size:14px;'>{i.Title}</td>
                                    <td style='padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;text-align:center;'>{i.Quantity}</td>
                                    <td style='padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#1e293b;font-size:14px;text-align:right;'>৳{i.Price * i.Quantity:F0}</td>
                                </tr>"))}
                                <tr style='background:#fff7ed;'>
                                    <td colspan='2' style='padding:12px;color:#1e293b;font-size:15px;font-weight:800;'>সর্বমোট</td>
                                    <td style='padding:12px;color:#e8401c;font-size:16px;text-align:right;font-weight:800;'>৳{info.TotalAmount:F0}</td>
                                </tr>
                            </table>");

            await SendViaBrevoAsync(info.ToEmail, info.UserName, subject, body);
        }

        private string OrderEmailShell(OrderEmailInfoDto info, string content)
        {
            var orderUrl = $"{SiteUrl}/orders/{info.OrderId}";
            return $@"
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
                    <tr>
                        <td style='background:linear-gradient(135deg,#1a237e,#0d47a1);padding:32px 40px;text-align:center;'>
                            <h1 style='margin:0;color:#fff;font-size:24px;font-weight:800;letter-spacing:-0.5px;'>📚 Sabbir BookMall</h1>
                            <p style='margin:6px 0 0;color:rgba(255,255,255,0.6);font-size:13px;'>আপনার বিশ্বস্ত অনলাইন বুকশপ</p>
                        </td>
                    </tr>
                    <tr>
                        <td style='padding:40px 40px 32px;'>
                            {content}
                            <div style='text-align:center;margin:8px 0 24px;'>
                                <a href='{orderUrl}'
                                   style='display:inline-block;background:#e8401c;color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:700;box-shadow:0 4px 12px rgba(232,64,28,0.35);'>
                                    অর্ডারটি দেখুন
                                </a>
                            </div>
                            <p style='margin:0;color:#94a3b8;font-size:12px;text-align:center;'>
                                অর্ডার নম্বর: #{info.OrderId} &nbsp;•&nbsp; তারিখ: {info.OrderDate:dd MMM yyyy}
                            </p>
                        </td>
                    </tr>
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
        }

        private async Task SendViaBrevoAsync(string toEmail, string userName, string subject, string html)
        {
            var apiKey = _config["EmailSettings:BrevoApiKey"]!;
            var fromEmail = _config["EmailSettings:FromEmail"]!;
            var fromName = _config["EmailSettings:FromName"] ?? "Sabbir BookMall";

            if (string.IsNullOrWhiteSpace(apiKey) || string.IsNullOrWhiteSpace(fromEmail))
            {
                throw new InvalidOperationException(
                    "EmailSettings configuration is missing or not loaded (check environment variables in the hosting dashboard).");
            }

            var payload = new
            {
                sender = new { name = fromName, email = fromEmail },
                to = new[] { new { email = toEmail, name = userName } },
                subject = subject,
                htmlContent = html
            };

            var json = JsonSerializer.Serialize(payload);

            try
            {
                var client = _httpClientFactory.CreateClient();
                using var request = new HttpRequestMessage(HttpMethod.Post, BrevoApiUrl)
                {
                    Content = new StringContent(json, Encoding.UTF8, "application/json")
                };
                request.Headers.Add("api-key", apiKey);
                request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                var response = await client.SendAsync(request);
                var responseBody = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    throw new InvalidOperationException(
                        $"Brevo API returned {(int)response.StatusCode} {response.StatusCode}: {responseBody}");
                }

                Console.WriteLine($"✅ Email sent to: {toEmail} — {subject}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Email Send Failed to {toEmail}: {ex.Message}");
                Console.WriteLine($"StackTrace: {ex.StackTrace}");
                throw;
            }
        }

        public async Task SendPasswordResetEmailAsync(string toEmail, string userName, string resetLink)
        {
            // Brevo API key (different from the SMTP key — grab this from
            // Brevo dashboard > SMTP & API > API Keys, and put it in
            // EmailSettings:BrevoApiKey as a Render env var).
            var apiKey = _config["EmailSettings:BrevoApiKey"]!;
            var fromEmail = _config["EmailSettings:FromEmail"]!;
            var fromName = _config["EmailSettings:FromName"] ?? "Sabbir BookMall";

            Console.WriteLine($"[EmailDebug] ApiKeyLength={apiKey?.Length ?? 0}, From={fromEmail}");
            if (string.IsNullOrWhiteSpace(apiKey) || string.IsNullOrWhiteSpace(fromEmail))
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

            var payload = new
            {
                sender = new { name = fromName, email = fromEmail },
                to = new[] { new { email = toEmail, name = userName } },
                subject = subject,
                htmlContent = body
            };

            var json = JsonSerializer.Serialize(payload);

            try
            {
                var client = _httpClientFactory.CreateClient();
                using var request = new HttpRequestMessage(HttpMethod.Post, BrevoApiUrl)
                {
                    Content = new StringContent(json, Encoding.UTF8, "application/json")
                };
                request.Headers.Add("api-key", apiKey);
                request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                var response = await client.SendAsync(request);
                var responseBody = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    throw new InvalidOperationException(
                        $"Brevo API returned {(int)response.StatusCode} {response.StatusCode}: {responseBody}");
                }

                Console.WriteLine($"✅ Password reset email sent to: {toEmail}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Email Send Failed to {toEmail}: {ex.Message}");
                Console.WriteLine($"StackTrace: {ex.StackTrace}");
                throw;
            }
        }
    }
}