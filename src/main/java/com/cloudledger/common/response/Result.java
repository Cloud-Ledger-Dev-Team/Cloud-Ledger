package com.cloudledger.common.response;

/**
 * 统一响应结果封装
 * <p>所有 Controller 层接口统一返回该结构，保证响应格式一致性：</p>
 * <pre>
 * {
 *   "code": 200,          // 业务状态码：200 成功，4xx/5xx 失败
 *   "msg":  "成功",        // 操作结果描述信息
 *   "data": { ... }       // 具体响应数据（泛型），失败时为 null
 * }
 * </pre>
 *
 * @param <T> 响应数据类型
 */
public class Result<T> {

    /** 业务状态码 */
    private Integer code;

    /** 操作结果信息 */
    private String msg;

    /** 响应数据 */
    private T data;

    /** 成功状态码 */
    public static final int CODE_SUCCESS = 200;

    // ==================== 构造方法 ====================

    public Result() {
    }

    public Result(Integer code, String msg, T data) {
        this.code = code;
        this.msg = msg;
        this.data = data;
    }

    // ==================== Getter / Setter ====================

    public Integer getCode() {
        return code;
    }

    public void setCode(Integer code) {
        this.code = code;
    }

    public String getMsg() {
        return msg;
    }

    public void setMsg(String msg) {
        this.msg = msg;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }

    // ==================== 静态工厂方法 ====================

    /**
     * 成功（无数据）
     */
    public static <T> Result<T> success() {
        return new Result<>(CODE_SUCCESS, "成功", null);
    }

    /**
     * 成功（携带数据）
     */
    public static <T> Result<T> success(T data) {
        return new Result<>(CODE_SUCCESS, "成功", data);
    }

    /**
     * 成功（自定义消息 + 数据）
     */
    public static <T> Result<T> success(String msg, T data) {
        return new Result<>(CODE_SUCCESS, msg, data);
    }

    /**
     * 失败（默认 500）
     */
    public static <T> Result<T> error() {
        return new Result<>(500, "服务器内部错误", null);
    }

    /**
     * 失败（自定义消息，默认 500）
     */
    public static <T> Result<T> error(String msg) {
        return new Result<>(500, msg, null);
    }

    /**
     * 失败（自定义状态码 + 消息）
     */
    public static <T> Result<T> error(int code, String msg) {
        return new Result<>(code, msg, null);
    }

    /**
     * 失败（自定义状态码 + 消息 + 数据）
     */
    public static <T> Result<T> error(int code, String msg, T data) {
        return new Result<>(code, msg, data);
    }
}
