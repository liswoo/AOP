package com.example.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Spring Boot 애플리케이션의 메인 진입점
 * 
 * @SpringBootApplication 어노테이션은 다음을 포함합니다:
 * - @Configuration: 설정 클래스로 인식
 * - @EnableAutoConfiguration: Spring Boot 자동 설정 활성화
 * - @ComponentScan: com.example.app 패키지 하위의 컴포넌트 스캔
 */
@SpringBootApplication
public class AppApplication {

    public static void main(String[] args) {
        SpringApplication.run(AppApplication.class, args);
    }
}

