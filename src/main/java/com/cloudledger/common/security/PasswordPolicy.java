package com.cloudledger.common.security;

import com.cloudledger.common.exception.BusinessException;

import java.util.regex.Pattern;

/**
 * 密码强度策略（前后端基线一致：8-64 位且同时包含字母和数字）
 * - {@link #validate} Service 层防御性校验，不合规抛 BusinessException(400)
 * - {@link #strengthScore} 强度评分（0-4），供前端强度条与后续扩展参考；后端不强制高于基线
 */
public final class PasswordPolicy {

    /** 最小长度 */
    public static final int MIN_LENGTH = 8;

    /** 最大长度 */
    public static final int MAX_LENGTH = 64;

    /** 基线：同时包含字母和数字 */
    private static final Pattern LETTER_AND_DIGIT = Pattern.compile("^(?=.*[A-Za-z])(?=.*\\d).+$");

    private static final Pattern LOWER_CASE = Pattern.compile(".*[a-z].*");
    private static final Pattern UPPER_CASE = Pattern.compile(".*[A-Z].*");
    private static final Pattern SPECIAL_CHAR = Pattern.compile(".*[^A-Za-z0-9].*");

    private PasswordPolicy() {
    }

    /**
     * 基线校验：非空、长度 8-64、含字母和数字
     *
     * @throws BusinessException 不合规时 code=400，msg 为具体中文原因
     */
    public static void validate(String rawPassword) {
        if (rawPassword == null || rawPassword.isBlank()) {
            throw new BusinessException(400, "密码不能为空");
        }
        int length = rawPassword.length();
        if (length < MIN_LENGTH || length > MAX_LENGTH) {
            throw new BusinessException(400, "密码长度须为 " + MIN_LENGTH + "-" + MAX_LENGTH + " 位");
        }
        if (!LETTER_AND_DIGIT.matcher(rawPassword).matches()) {
            throw new BusinessException(400, "密码须同时包含字母和数字");
        }
    }

    /**
     * 强度评分
     * <ul>
     *   <li>0：不满足基线</li>
     *   <li>1：满足基线（≥8 位含字母和数字）</li>
     *   <li>2：再满足长度 ≥12 / 大小写混合 / 含特殊字符 中的 1 项</li>
     *   <li>3：满足其中 2 项</li>
     *   <li>4：3 项全部满足（很强）</li>
     * </ul>
     */
    public static int strengthScore(String rawPassword) {
        if (rawPassword == null || rawPassword.isBlank()
                || rawPassword.length() < MIN_LENGTH
                || rawPassword.length() > MAX_LENGTH
                || !LETTER_AND_DIGIT.matcher(rawPassword).matches()) {
            return 0;
        }
        int score = 1;
        if (rawPassword.length() >= 12) {
            score++;
        }
        if (LOWER_CASE.matcher(rawPassword).matches() && UPPER_CASE.matcher(rawPassword).matches()) {
            score++;
        }
        if (SPECIAL_CHAR.matcher(rawPassword).matches()) {
            score++;
        }
        return Math.min(score, 4);
    }
}
