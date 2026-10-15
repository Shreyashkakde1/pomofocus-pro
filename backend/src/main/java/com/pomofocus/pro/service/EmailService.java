package com.pomofocus.pro.service;

import com.pomofocus.pro.exception.ApiException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${app.mail.from-address:onboarding@resend.dev}")
    private String fromAddress;

    @Value("${app.mail.from-name:Pomofocus Pro}")
    private String fromName;

    public boolean isMailConfigured() {
        return mailPassword != null && !mailPassword.trim().isEmpty() && !mailPassword.equals("resend-api-key-placeholder");
    }

    public void sendVerificationOtp(String toEmail, String username, String otpCode) {
        if (!isMailConfigured()) {
            log.warn("=================================================================");
            log.warn("⚠️ Resend SMTP credentials not configured (SPRING_MAIL_PASSWORD blank)");
            log.warn("👉 Generated Verification Passcode for {}: {}", toEmail, otpCode);
            log.warn("=================================================================");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress, fromName);
            helper.setTo(toEmail);
            helper.setSubject(otpCode + " is your Pomofocus Pro verification code");

            String htmlContent = buildOtpEmailTemplate(username, otpCode);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Verification OTP email dispatched via Resend to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to dispatch verification email to {}: {}", toEmail, e.getMessage());
            log.warn("👉 Fallback Verification Passcode for {}: {}", toEmail, otpCode);
            throw new ApiException("Failed to send verification email via Resend SMTP. Reason: " + e.getMessage() + ". Check server logs for OTP or set valid SPRING_MAIL_PASSWORD.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private String buildOtpEmailTemplate(String username, String otpCode) {
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Your Pomofocus Pro Verification Code</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f5f3ee; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #111318;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f5f3ee; padding: 40px 16px;">
                <tr>
                  <td align="center">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #ffffff; border-radius: 20px; border: 1px solid #e5e3dc; box-shadow: 0 4px 20px rgba(17, 19, 24, 0.05); overflow: hidden;">
                      
                      <!-- Brand Header -->
                      <tr>
                        <td style="padding: 36px 36px 20px 36px;">
                          <table border="0" cellspacing="0" cellpadding="0">
                            <tr>
                              <td style="width: 36px; height: 36px; background-color: #111318; border-radius: 10px; text-align: center; vertical-align: middle;">
                                <span style="font-size: 18px; font-weight: 800; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, sans-serif; line-height: 36px;">P</span><span style="display: inline-block; width: 3px; height: 16px; background-color: #c9f45b; border-radius: 2px; vertical-align: middle; margin-left: 2px;"></span>
                              </td>
                              <td style="padding-left: 12px; font-size: 20px; font-weight: 800; color: #111318; letter-spacing: -0.5px;">
                                Pomofocus<span style="font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-weight: normal; color: #3157f6; margin-left: 2px;">Pro</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Email Body -->
                      <tr>
                        <td style="padding: 8px 36px 32px 36px;">
                          <h1 style="font-size: 22px; font-weight: 700; color: #111318; margin: 0 0 12px 0; letter-spacing: -0.3px;">Verify your email address</h1>
                          <p style="font-size: 14px; line-height: 22px; color: #62666f; margin: 0 0 24px 0;">
                            Hi <strong style="color: #111318;">{{USERNAME}}</strong>, thanks for getting started with Pomofocus Pro! Enter this 6-digit passcode in your browser to activate your account and start your focus sessions:
                          </p>

                          <!-- Verification Code Card -->
                          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fcfbf8; border: 1.5px solid #3157f6; border-radius: 16px; margin: 0 0 24px 0;">
                            <tr>
                              <td align="center" style="padding: 24px 16px;">
                                <div style="font-family: 'SF Mono', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #3157f6; padding-left: 10px;">
                                  {{OTP_CODE}}
                                </div>
                                <div style="margin-top: 10px;">
                                  <span style="display: inline-block; background-color: #e8edff; color: #3157f6; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; border-radius: 20px; padding: 4px 12px; text-transform: uppercase;">
                                    Valid for 15 minutes
                                  </span>
                                </div>
                              </td>
                            </tr>
                          </table>

                          <p style="font-size: 13px; line-height: 20px; color: #8f94a0; margin: 0;">
                            If you did not request this verification code, you can safely ignore this email. No account will be activated without this passcode.
                          </p>
                        </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                        <td style="background-color: #fcfbf8; border-top: 1px solid #e5e3dc; padding: 20px 36px; text-align: center;">
                          <p style="font-size: 12px; color: #8f94a0; margin: 0; line-height: 18px;">
                            <strong>Pomofocus Pro</strong> — Dual-budget focus, tracked with precision.
                          </p>
                          <p style="font-size: 11px; color: #a1a6b2; margin: 6px 0 0 0;">
                            <a href="https://pomofocus.shreyashkakde.in" style="color: #3157f6; text-decoration: none; font-weight: 600;">pomofocus.shreyashkakde.in</a>
                          </p>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """
            .replace("{{USERNAME}}", username)
            .replace("{{OTP_CODE}}", otpCode);
    }
}

