package com.cloudledger.controller;

import com.cloudledger.common.response.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 根路径健康检查
 */
@Tag(name = "健康检查", description = "服务存活探针")
@RestController
public class HealthController {

    @Operation(summary = "健康检查", description = "服务存活探针，返回服务名与状态")
    @GetMapping("/")
    public Result<Map<String, Object>> health() {
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("service", "cloud-ledger");
        info.put("status", "UP");
        return Result.success(info);
    }
}
