package com.cloudledger.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 登录态修改密码请求 DTO
 */
@Data
public class ChangePasswordRequest {

    @NotBlank(message = "原密码不能为空")
    @Size(max = 64, message = "密码长度不能超过 64 位")
    private String oldPassword;

    /**
     * 新密码：基线与注册一致（8-64 位，含字母和数字），Service 层再做 PasswordPolicy 防御性校验
     */
    @NotBlank(message = "新密码不能为空")
    @Size(min = 8, max = 64, message = "密码长度须为 8-64 位")
    @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$", message = "密码须同时包含字母和数字")
    private String newPassword;

    @NotBlank(message = "确认密码不能为空")
    @Size(max = 64, message = "密码长度不能超过 64 位")
    private String confirmPassword;
}
