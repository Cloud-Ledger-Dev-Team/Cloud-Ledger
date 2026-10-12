package com.cloudledger.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.cloudledger.common.cache.CacheService;
import com.cloudledger.common.config.CacheProperties;
import com.cloudledger.common.exception.BusinessException;
import com.cloudledger.entity.Category;
import com.cloudledger.mapper.CategoryMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 分类模块业务逻辑
 * <p>
 * 分类分两类：
 * - 系统预设（user_id = NULL）：所有用户共享，不可删除；
 * - 用户自定义（user_id = userId）：可增删改。
 * </p>
 * <p>
 * 列表读取走 Redis 缓存（Cache Aside，TTL 60 min + 抖动）；
 * 写操作后主动失效全量分类缓存（通配删除）。
 * </p>
 */
@Slf4j
@Service
public class CategoryService {

    @Autowired
    private CategoryMapper categoryMapper;

    @Autowired
    private CacheService cacheService;

    @Autowired
    private CacheProperties cacheProperties;

    /**
     * 获取可用分类（系统预设 + 用户自定义），按 type, sort_order, id 排序
     * <p>
     * 防御性保障：
     * - userId 为 null 时仅查询预设分类，避免生成无意义的 user_id = NULL 比较条件；
     * - 读取结果统一经 {@link #dedup(List)} 按业务唯一键 (user_id, name, type) 去重，
     * 即使数据库或缓存中残留历史重复数据，接口返回仍保证唯一；
     * - 过滤 name/type 为空的异常行，避免脏数据导致前端渲染异常。
     *
     * @param userId 当前登录用户 UUID（可为 null → 仅返回系统预设）
     */
    public List<Category> listAvailable(String userId) {
        String cacheKey = cacheService.categoryListKey(userId);
        List<Category> cached = cacheService.get(cacheKey, new TypeReference<List<Category>>() {
        });
        if (cached != null) {
            return dedup(cached);
        }
        synchronized (this) {
            cached = cacheService.get(cacheKey, new TypeReference<List<Category>>() {
            });
            if (cached != null) {
                return dedup(cached);
            }
            // 系统预设（user_id IS NULL）+ 用户自定义（user_id = ?）
            LambdaQueryWrapper<Category> wrapper = new LambdaQueryWrapper<>();
            if (userId == null) {
                wrapper.isNull(Category::getUserId);
            } else {
                wrapper.and(w -> w.isNull(Category::getUserId).or().eq(Category::getUserId, userId));
            }
            wrapper.orderByAsc(Category::getType)
                    .orderByAsc(Category::getSortOrder)
                    .orderByAsc(Category::getId);
            List<Category> all = dedup(categoryMapper.selectList(wrapper));
            cacheService.put(cacheKey, all, cacheProperties.getTtlCategory());
            return all;
        }
    }

    /**
     * 防御性去重与脏数据过滤
     * <p>
     * - 以业务唯一键 (user_id, name, type) 去重，保留排序最靠前的一条（与唯一索引
     * uk_user_name_type 语义一致），兼容历史脏数据或旧版本缓存残留；
     * - 过滤 name/type 空白的异常行；
     * - LinkedHashMap 保持原有排序不变。
     */
    private List<Category> dedup(List<Category> list) {
        if (list == null || list.isEmpty()) {
            return new ArrayList<>();
        }
        Map<String, Category> seen = new LinkedHashMap<>(list.size());
        for (Category c : list) {
            if (c == null || c.getName() == null || c.getName().isBlank() || c.getType() == null
                    || c.getType().isBlank()) {
                log.warn("分类数据异常，已过滤: id={}, name={}, type={}, userId={}",
                        c == null ? null : c.getId(), c == null ? null : c.getName(),
                        c == null ? null : c.getType(), c == null ? null : c.getUserId());
                continue;
            }
            String key = c.getUserId() + "|" + c.getName() + "|" + c.getType();
            seen.putIfAbsent(key, c);
        }
        return new ArrayList<>(seen.values());
    }

    /**
     * 创建用户自定义分类
     *
     * @return 插入后的完整分类对象（含 id）
     */
    @Transactional(rollbackFor = Exception.class)
    public Category create(String userId, String name, String type, String icon, String color, Integer sortOrder) {
        // 1. 同一用户 + 同一类型下不允许重名（触发唯一索引 uk_user_name_type）
        Category existing = categoryMapper.selectOne(
                new LambdaQueryWrapper<Category>()
                        .eq(Category::getUserId, userId)
                        .eq(Category::getName, name)
                        .eq(Category::getType, type)
                        .last("LIMIT 1"));
        if (existing != null) {
            throw new BusinessException(409, "该类型下已存在同名分类「" + name + "」");
        }
        // 2. 填充默认值：来源固定为当前登录用户（用户自定义，非系统预设）；
        // 排序未指定时自动排到该用户同类型末尾（max+1），保证 sort_order 恒为有效数字
        Category c = new Category();
        c.setUserId(userId);
        c.setName(name);
        c.setType(type);
        c.setIcon(icon == null || icon.isBlank() ? "Grid" : icon);
        c.setColor(color == null || color.isBlank() ? "#409EFF" : color);
        c.setSortOrder(sortOrder != null ? sortOrder : nextSortOrder(userId, type));
        try {
            categoryMapper.insert(c);
        } catch (DataIntegrityViolationException e) {
            // 并发创建同名分类时由唯一索引 uk_user_name_type 兜底，转换为业务冲突提示
            throw new BusinessException(409, "该类型下已存在同名分类「" + name + "」");
        }
        // 3. 失效用户分类缓存
        cacheService.evictByPattern(cacheService.categoryListPattern(userId));
        return c;
    }

    /**
     * 计算新分类的默认排序值：该用户同类型下当前最大 sort_order + 1，
     * 使新分类默认排在末尾；同类型无数据时从 1 开始。
     */
    private Integer nextSortOrder(String userId, String type) {
        Category last = categoryMapper.selectOne(
                new LambdaQueryWrapper<Category>()
                        .eq(Category::getUserId, userId)
                        .eq(Category::getType, type)
                        .orderByDesc(Category::getSortOrder)
                        .last("LIMIT 1"));
        return (last == null || last.getSortOrder() == null) ? 1 : last.getSortOrder() + 1;
    }

    /**
     * 更新分类（仅允许修改用户自定义分类，系统预设不可修改）
     */
    @Transactional(rollbackFor = Exception.class)
    public Category update(String userId, Integer id, String name, String icon, String color, Integer sortOrder) {
        Category target = categoryMapper.selectById(id);
        if (target == null) {
            throw new BusinessException(404, "分类不存在");
        }
        if (target.getUserId() == null) {
            throw new BusinessException(403, "系统预设分类不可修改");
        }
        if (!target.getUserId().equals(userId)) {
            throw new BusinessException(403, "无权修改该分类");
        }
        // 同类型下不允许与其他自定义分类重名
        if (name != null && !name.equals(target.getName())) {
            Category dup = categoryMapper.selectOne(
                    new LambdaQueryWrapper<Category>()
                            .eq(Category::getUserId, userId)
                            .eq(Category::getName, name)
                            .eq(Category::getType, target.getType())
                            .ne(Category::getId, id)
                            .last("LIMIT 1"));
            if (dup != null) {
                throw new BusinessException(409, "该类型下已存在同名分类「" + name + "」");
            }
            target.setName(name);
        }
        if (icon != null && !icon.isBlank())
            target.setIcon(icon);
        if (color != null && !color.isBlank())
            target.setColor(color);
        if (sortOrder != null)
            target.setSortOrder(sortOrder);
        categoryMapper.updateById(target);
        cacheService.evictByPattern(cacheService.categoryListPattern(userId));
        return target;
    }

    /**
     * 删除分类（仅允许删除用户自定义分类，且 bill 表无引用）
     */
    @Transactional(rollbackFor = Exception.class)
    public void delete(String userId, Integer id) {
        Category target = categoryMapper.selectById(id);
        if (target == null) {
            throw new BusinessException(404, "分类不存在");
        }
        if (target.getUserId() == null) {
            throw new BusinessException(403, "系统预设分类不可删除");
        }
        if (!target.getUserId().equals(userId)) {
            throw new BusinessException(403, "无权删除该分类");
        }
        categoryMapper.deleteById(id);
        cacheService.evictByPattern(cacheService.categoryListPattern(userId));
    }
}
