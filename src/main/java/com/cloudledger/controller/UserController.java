package com.cloudledger.controller;

import com.cloudledger.common.response.Result;
import com.cloudledger.dto.LoginRequest;
import com.cloudledger.dto.RegisterRequest;
import com.cloudledger.dto.WxLoginRequest;
import com.cloudledger.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 用户模块控制器（注册 / 登录 / 登出）
 */
@Tag(name = "用户模块", description = "注册、登录、登出")
@RestController
@RequestMapping("/api")
public class UserController {

    @Autowired
    private UserService userService;

    @Operation(summary = "用户注册", description = "创建新用户，同时生成名为「默认账户」、类型「现金」、余额 0 的初始账户。密码强度要求：≥8 位且含字母和数字。")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "注册成功"),
            @ApiResponse(responseCode = "200", description = "邮箱已注册（code=400）",
                    content = @Content(mediaType = "application/json",
                            examples = @ExampleObject(value = "{\"code\":400,\"msg\":\"该邮箱已被注册\",\"data\":null}")))
    })
    @PostMapping("/register")
    public Result<Map<String, Object>> register(@Valid @RequestBody RegisterRequest request) {
        String userId = userService.register(request.getName(), request.getEmail(), request.getPassword());
        Map<String, Object> user = new LinkedHashMap<>();
        user.put("user_id", userId);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("user", user);
        return Result.success(data);
    }

    @Operation(summary = "用户登录", description = "校验邮箱与密码，签发 JWT Token 并写入 Redis 会话。")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "登录成功，data 含 token/access_token/user"),
            @ApiResponse(responseCode = "200", description = "邮箱或密码错误（code=401）")
    })
    @PostMapping("/login")
    public Result<Map<String, Object>> login(@Valid @RequestBody LoginRequest request) {
        UserService.LoginResult result = userService.login(request.getEmail(), request.getPassword());
        Map<String, Object> user = new LinkedHashMap<>();
        user.put("user_id", result.user().getUserId());
        user.put("name", result.user().getName());
        user.put("email", result.user().getEmail());

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("token", result.token());
        data.put("access_token", result.token());
        data.put("user", user);
        return Result.success(data);
    }

    @Operation(summary = "用户登出", description = "将当前 Token 加入 JWT 黑名单并删除 Redis 会话。需携带 Bearer Token。")
    @PostMapping("/logout")
    public Result<Void> logout(Authentication authentication, HttpServletRequest request) {
        String userId = (String) authentication.getPrincipal();
        String token = extractToken(request);
        userService.logout(token, userId);
        return Result.success("登出成功", null);
    }

    @Operation(summary = "微信登录", description = "接收小程序 wx.login 返回的 code，后端调用微信 code2Session 接口获取 openid，" +
            "查找或创建用户后签发 JWT。符合微信官方授权规范，AppSecret 仅存于服务端，不暴露给前端。")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "登录成功，data 含 token/access_token/user"),
            @ApiResponse(responseCode = "200", description = "微信登录失败（code=401）")
    })
    @PostMapping("/wx-login")
    public Result<Map<String, Object>> wxLogin(@Valid @RequestBody WxLoginRequest request) {
        UserService.LoginResult result = userService.wxLogin(request.getCode());
        Map<String, Object> user = new LinkedHashMap<>();
        user.put("user_id", result.user().getUserId());
        user.put("name", result.user().getName());
        user.put("email", result.user().getEmail());

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("token", result.token());
        data.put("access_token", result.token());
        data.put("user", user);
        return Result.success(data);
    }

    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }
}
