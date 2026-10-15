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
            helper.setSubject("⚡ [POMOFOCUS PRO] Your Verification Passcode: " + otpCode);

            String htmlContent = buildCyberpunkOtpEmailTemplate(username, otpCode);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Verification OTP email dispatched via Resend to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to dispatch verification email to {}: {}", toEmail, e.getMessage());
            log.warn("👉 Fallback Verification Passcode for {}: {}", toEmail, otpCode);
            throw new ApiException("Failed to send verification email via Resend SMTP. Reason: " + e.getMessage() + ". Check server logs for OTP or set valid SPRING_MAIL_PASSWORD.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private String buildCyberpunkOtpEmailTemplate(String username, String otpCode) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { margin: 0; padding: 0; background-color: #08090d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace; color: #e2e8f0; }
                .container { max-width: 540px; margin: 40px auto; background: #0f131f; border: 1px solid #1e293b; border-radius: 12px; padding: 32px; box-shadow: 0 0 25px rgba(0, 243, 255, 0.15); }
                .logo { font-size: 20px; font-weight: 800; letter-spacing: 2px; color: #00f3ff; text-transform: uppercase; margin-bottom: 24px; }
                .title { font-size: 24px; font-weight: 700; margin-bottom: 12px; color: #f8fafc; }
                .desc { font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 24px; }
                .otp-box { background: rgba(0, 243, 255, 0.05); border: 2px solid #00f3ff; border-radius: 8px; padding: 20px; text-align: center; font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #00f3ff; margin-bottom: 24px; text-shadow: 0 0 10px rgba(0, 243, 255, 0.5); }
                .notice { font-size: 12px; color: #64748b; margin-top: 24px; border-top: 1px solid #1e293b; padding-top: 16px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="logo">⚡ POMOFOCUS PRO HUD</div>
                <div class="title">Verify Your Operator Terminal</div>
                <div class="desc">Greetings <strong>%s</strong>, enter the 6-digit authorization code below to verify your account and activate your target budget telemetry:</div>
                <div class="otp-box">%s</div>
                <div class="desc">This passcode will expire in <strong>15 minutes</strong>. If you did not initialize this request, no action is needed.</div>
                <div class="notice">POMOFOCUS PRO // Cyberpunk Productivity Engine // High-Precision Telemetry</div>
              </div>
            </body>
            </html>
            """.formatted(username, otpCode);
    }
}

