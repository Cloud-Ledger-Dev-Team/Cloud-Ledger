package com.cloudledger.common.exception;

import lombok.Getter;

/**
 * 业务异常（可手动抛出，由 GlobalExceptionHandler 捕获）
 */
@Getter
public class BusinessException extends RuntimeException {

    /**
     * HTTP 状态码，默认 400
     */
    private final int code;

    public BusinessException(String message) {
        super(message);
        this.code = 400;
    }

    public BusinessException(int code, String message) {
        super(message);
        this.code = code;
    }

    public BusinessException(String message, Throwable cause) {
        super(message, cause);
        this.code = 400;
    }
}
