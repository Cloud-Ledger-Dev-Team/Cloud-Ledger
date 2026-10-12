package com.cloudledger.controller;

import com.cloudledger.common.exception.BusinessException;
import com.cloudledger.common.response.Result;
import com.cloudledger.entity.Category;
import com.cloudledger.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 分类模块控制器
 * <p>
 * 分类分两类：
 * - 系统预设（user_id = NULL）：所有用户共享；
 * - 用户自定义（user_id = 具体 UUID）：可增删改。
 * </p>
 */
@Tag(name = "分类模块", description = "收支分类清单（系统预设 + 用户自定义）")
@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    /** Spring Security 匿名认证的固定 principal，等价于"未登录" */
    private static final String ANONYMOUS_PRINCIPAL = "anonymousUser";

    /** 字段长度上限（与表结构 VARCHAR 定义一致）与排序取值范围 */
    private static final int MAX_NAME_LEN = 50;
    private static final int MAX_ICON_LEN = 50;
    private static final int MAX_COLOR_LEN = 20;
    private static final int MAX_SORT_ORDER = 9999;

    @Autowired
    private CategoryService categoryService;

    /**
     * 判断是否未登录：Token 缺失或无效时 @AuthenticationPrincipal
     * 可能注入匿名 principal（"anonymousUser"）而非 null，需一并拦截，
     * 否则未登录写请求会以 user_id='anonymousUser' 落库。
     */
    private static boolean isAnonymous(String userId) {
        return userId == null || ANONYMOUS_PRINCIPAL.equals(userId);
    }

    /**
     * 解析并校验排序序号：
     * - null → 返回 null（由服务层自动生成默认排序）；
     * - 必须为 JSON 数字类型，非数字（如字符串）→ 400；
     * - 取值范围 0 ~ 9999，越界 → 400。
     */
    private static Integer parseSortOrder(Object raw) {
        if (raw == null) {
            return null;
        }
        if (!(raw instanceof Number n)) {
            throw new BusinessException(400, "排序序号必须为数字");
        }
        int v = n.intValue();
        if (v < 0 || v > MAX_SORT_ORDER) {
            throw new BusinessException(400, "排序序号必须在 0-" + MAX_SORT_ORDER + " 之间");
        }
        return v;
    }

    /** 校验可选字符串字段长度，超限 → 400 */
    private static void checkLength(String value, String field, int max) {
        if (value != null && value.length() > max) {
            throw new BusinessException(400, field + "长度不能超过 " + max + " 个字符");
        }
    }

    /**
     * 获取可用分类
     * <p>
     * 未登录：仅返回系统预设；已登录：返回系统预设 + 该用户自定义。
     * 响应同时包含完整对象列表（categories）和按 type 分组的 name 字符串列表（groups），
     * 后者兼容前端 el-select 下拉的直接字符串用法。
     * </p>
     */
    @Operation(summary = "获取可用分类")
    @GetMapping({"", "/"})
    public Result<Map<String, Object>> list(
            @AuthenticationPrincipal String userId) {
        // 匿名请求统一按未登录处理，与未登录共享 system 缓存键，避免缓存键膨胀
        List<Category> list = categoryService.listAvailable(isAnonymous(userId) ? null : userId);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("categories", list);
        Map<String, List<String>> groups = new LinkedHashMap<>();
        for (Category c : list) {
            groups.computeIfAbsent(c.getType(), k -> new ArrayList<>()).add(c.getName());
        }
        data.put("groups", groups);
        return Result.success(data);
    }

    /**
     * 创建用户自定义分类（需登录）
     */
    @Operation(summary = "创建分类")
    @PostMapping({"", "/"})
    public Result<Category> create(
            @AuthenticationPrincipal String userId,
            @RequestBody Map<String, Object> body) {
        if (isAnonymous(userId)) {
            return Result.error(401, "请先登录后创建自定义分类");
        }
        String name = (String) body.get("name");
        String type = (String) body.get("type");
        if (name == null || name.isBlank()) return Result.error(400, "分类名称不能为空");
        if (type == null || (!"income".equals(type) && !"expense".equals(type))) {
            return Result.error(400, "收支类型必须为 income 或 expense");
        }
        if (name.length() > MAX_NAME_LEN) return Result.error(400, "分类名称长度不能超过 " + MAX_NAME_LEN + " 个字符");
        String icon = (String) body.get("icon");
        String color = (String) body.get("color");
        checkLength(icon, "图标名称", MAX_ICON_LEN);
        checkLength(color, "颜色值", MAX_COLOR_LEN);
        Integer sortOrder = parseSortOrder(body.get("sort_order"));
        return Result.success(categoryService.create(userId, name.trim(), type, icon, color, sortOrder));
    }

    /**
     * 更新用户自定义分类（需登录，仅可更新自己创建的）
     */
    @Operation(summary = "更新分类")
    @PutMapping("/{id}")
    public Result<Category> update(
            @AuthenticationPrincipal String userId,
            @Parameter(description = "分类主键 id") @PathVariable Integer id,
            @RequestBody Map<String, Object> body) {
        if (isAnonymous(userId)) return Result.error(401, "未登录");
        String name = (String) body.get("name");
        String icon = (String) body.get("icon");
        String color = (String) body.get("color");
        if (name != null && name.length() > MAX_NAME_LEN) {
            return Result.error(400, "分类名称长度不能超过 " + MAX_NAME_LEN + " 个字符");
        }
        checkLength(icon, "图标名称", MAX_ICON_LEN);
        checkLength(color, "颜色值", MAX_COLOR_LEN);
        Integer sortOrder = parseSortOrder(body.get("sort_order"));
        return Result.success(categoryService.update(userId, id, name == null ? null : name.trim(), icon, color, sortOrder));
    }

    /**
     * 删除用户自定义分类（需登录，仅可删除自己创建的）
     */
    @Operation(summary = "删除分类")
    @DeleteMapping("/{id}")
    public Result<Void> delete(
            @AuthenticationPrincipal String userId,
            @Parameter(description = "分类主键 id") @PathVariable Integer id) {
        if (isAnonymous(userId)) return Result.error(401, "未登录");
        categoryService.delete(userId, id);
        return Result.success(null);
    }
}
