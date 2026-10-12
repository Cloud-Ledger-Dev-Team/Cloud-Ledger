package com.cloudledger.controller;

import com.cloudledger.common.response.Result;
import com.cloudledger.entity.Feedback;
import com.cloudledger.mapper.FeedbackMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 反馈模块控制器（强制 JWT 鉴权，user_id 取自 Token identity）
 */
@Slf4j
@Tag(name = "反馈模块", description = "用户反馈提交")
@RestController
@RequestMapping("/api")
public class FeedbackController {

    @Autowired
    private FeedbackMapper feedbackMapper;

    @Operation(summary = "提交用户反馈", description = "已登录用户向系统提交 Bug 或建议反馈；user_id 从 JWT identity 解析，不可伪造")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "反馈提交成功，data 含 feedback_id"),
            @ApiResponse(responseCode = "200", description = "反馈内容不能为空（code=400）"),
            @ApiResponse(responseCode = "200", description = "未授权（code=401）")
    })
    @PostMapping("/feedback")
    @PreAuthorize("isAuthenticated()")
    public Result<Map<String, Object>> submit(Authentication authentication,
            @RequestBody Map<String, Object> request) {
        String userId = (String) authentication.getPrincipal();
        String content = request.get("content") == null ? "" : request.get("content").toString().trim();
        if (content.isEmpty()) {
            return Result.error(400, "反馈内容不能为空");
        }
        String type = request.get("type") == null ? null : request.get("type").toString();
        String contact = request.get("contact") == null ? null : request.get("contact").toString();

        Feedback feedback = new Feedback();
        feedback.setUserId(userId);
        feedback.setType(type);
        feedback.setContent(content);
        feedback.setContact(contact);
        feedbackMapper.insert(feedback);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("message", "反馈提交成功");
        data.put("feedback_id", feedback.getId());
        return Result.success(data);
    }
}
