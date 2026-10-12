package com.cloudledger;

import lombok.extern.slf4j.Slf4j;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Cloud-Ledger 云记账应用主启动类
 *
 * @author Cloud-Ledger Team
 * @version 1.0.0
 */
@Slf4j
@SpringBootApplication
@MapperScan("com.cloudledger.mapper")
public class CloudLedgerApplication {

    public static void main(String[] args) {
        SpringApplication.run(CloudLedgerApplication.class, args);
        log.info("======================================");
        log.info(" Cloud-Ledger 云记账系统启动成功!");
        log.info(" API Docs : http://localhost:8080/doc.html");
        log.info(" Druid    : http://localhost:8080/druid/");
        log.info("======================================");
    }
}
