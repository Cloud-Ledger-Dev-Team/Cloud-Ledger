package com.cloudledger.common.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Knife4j / SpringDoc OpenAPI 配置
 */
@Configuration
public class Knife4jConfig {

    @Bean
    public OpenAPI cloudLedgerOpenAPI() {
        String schemeName = "Bearer Token";
        return new OpenAPI()
                .info(new Info()
                        .title("Cloud-Ledger 云记账 API")
                        .version("1.0.0")
                        .description("云记账系统后端 RESTful API 文档，基于 Spring Boot 3 + SpringDoc + Knife4j")
                        .contact(new Contact()
                                .name("Cloud-Ledger Team")
                                .email("dev@cloud-ledger.local"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")))
                .addSecurityItem(new SecurityRequirement().addList(schemeName))
                .schemaRequirement(schemeName, new SecurityScheme()
                        .name("Authorization")
                        .type(SecurityScheme.Type.HTTP)
                        .bearerFormat("JWT")
                        .scheme("bearer")
                        .description("请输入 JWT Token，格式：Bearer <token>"));
    }
}
