package com.cloudledger.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 微信登录请求 DTO
 * 小程序前端通过 wx.login() 获取临时凭证 code，发送到后端
 * 由后端调用微信 code2Session 接口换取 openid
 */
@Data
public class WxLoginRequest {

    @NotBlank(message = "微信登录凭证 code 不能为空")
    private String code;
}
