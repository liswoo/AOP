package com.example.app.config;

import org.springframework.context.annotation.Configuration;

/**
 * Servlet Filter 등록 설정
 * 
 * ContentCachingFilter를 Servlet Filter로 등록하여
 * Spring Security 필터 체인보다 먼저 실행되도록 합니다.
 * 이렇게 하면 요청 본문이 Spring Security 필터들에 의해 소진되기 전에
 * 캐싱되어 컨트롤러에서 다시 읽을 수 있습니다.
 * 
 * 주의: RequestBodyCachingFilter도 @Component로 등록되어 있으므로,
 * 두 필터가 중복 실행될 수 있습니다. 하나만 사용하는 것을 권장합니다.
 */
@Configuration
public class FilterConfig {

    /**
     * ContentCachingFilter를 Servlet Filter로 등록
     * 
     * 주의: RequestBodyCachingFilter(@Component)와 중복될 수 있으므로
     * 필요에 따라 주석 처리하세요.
     */
    // @Bean
    // public FilterRegistrationBean<ContentCachingFilter> contentCachingFilterRegistration() {
    //     FilterRegistrationBean<ContentCachingFilter> registration = new FilterRegistrationBean<>();
    //     registration.setFilter(new ContentCachingFilter());
    //     registration.addUrlPatterns("/*");
    //     registration.setOrder(Ordered.HIGHEST_PRECEDENCE); // 가장 먼저 실행
    //     registration.setName("contentCachingFilter");
    //     return registration;
    // }
}

