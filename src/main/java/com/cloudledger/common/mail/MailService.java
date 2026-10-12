package com.cloudledger.common.mail;

import com.cloudledger.common.config.SecurityProperties;
import com.cloudledger.common.exception.BusinessException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;

/**
 * 邮件发送服务
 * - 当前仅用于忘记密码场景的验证码投递
 * - SMTP 未配置时抛出 503 业务异常，由全局异常处理器统一返回
 * - 发送失败不向上游泄漏 SMTP 细节，仅在服务端记录原因
 */
@Slf4j
@Service
public class MailService {

    private final JavaMailSender mailSender;
    private final SecurityProperties securityProperties;

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    public MailService(JavaMailSender mailSender, SecurityProperties securityProperties) {
        this.mailSender = mailSender;
        this.securityProperties = securityProperties;
    }

    /**
     * 发送密码重置验证码邮件
     *
     * @param toEmail 收件人邮箱
     * @param code    6 位数字验证码（仅允许出现在邮件正文这一投递通道中）
     */
    public void sendPasswordResetCode(String toEmail, String code) {
        if (!StringUtils.hasText(mailHost) || !StringUtils.hasText(mailUsername)) {
            log.warn("[安全审计] 操作=发送重置验证码 结果=失败 原因=SMTP未配置");
            throw new BusinessException(503, "邮件服务未配置，请联系管理员");
        }

        String fromAddress = StringUtils.hasText(securityProperties.getMail().getFrom())
                ? securityProperties.getMail().getFrom()
                : mailUsername;
        int expireMinutes = (int) Math.max(1, securityProperties.getResetCode().getTtlSeconds() / 60);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    message, true, StandardCharsets.UTF_8.name());
            helper.setFrom(fromAddress, securityProperties.getMail().getFromName());
            helper.setTo(toEmail);
            helper.setSubject("【Cloud-Ledger 云记账】密码重置验证码");
            helper.setText(buildHtml(code, expireMinutes), true);
            mailSender.send(message);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            // 不输出验证码；收件人邮箱属于投递目标，可记录用于排查
            log.error("[安全审计] 操作=发送重置验证码 结果=失败 to={} 原因={}",
                    toEmail, e.getMessage());
            throw new BusinessException(503, "验证码邮件发送失败，请稍后重试");
        }
    }

    /**
     * 构造 HTML 邮件正文（内联样式，兼容主流邮箱客户端）
     */
    private String buildHtml(String code, int expireMinutes) {
        return """
                <div style="margin:0;padding:24px;background:#f5f7fa;font-family:'Microsoft YaHei',Arial,sans-serif;">
                  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                    <div style="background:#409eff;padding:20px 24px;color:#ffffff;font-size:18px;font-weight:700;">
                      Cloud-Ledger 云记账
                    </div>
                    <div style="padding:24px;">
                      <p style="margin:0 0 16px;color:#303133;font-size:14px;">您好，</p>
                      <p style="margin:0 0 16px;color:#303133;font-size:14px;">
                        我们收到了您的密码重置请求。请在下方输入验证码以完成重置：
                      </p>
                      <div style="margin:0 0 16px;text-align:center;">
                        <span style="display:inline-block;font-size:30px;font-weight:700;letter-spacing:8px;color:#409eff;background:#ecf5ff;border-radius:6px;padding:12px 24px;">
                          %s
                        </span>
                      </div>
                      <p style="margin:0 0 8px;color:#f56c6c;font-size:13px;">
                        验证码 %d 分钟内有效，请勿泄露给他人。
                      </p>
                      <p style="margin:0;color:#909399;font-size:12px;">
                        如非本人操作，请忽略此邮件，您的账户安全不会受到影响。
                      </p>
                    </div>
                  </div>
                </div>
                """.formatted(code, expireMinutes);
    }
}
