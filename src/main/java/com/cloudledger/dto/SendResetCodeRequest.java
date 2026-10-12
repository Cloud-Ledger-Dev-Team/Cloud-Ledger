package com.cloudledger.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 发送密码重置验证码请求 DTO
 */
@Data
public class SendResetCodeRequest {

    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不合法")
    @Size(max = 100, message = "邮箱长度不能超过 100")
    private String email;
}
