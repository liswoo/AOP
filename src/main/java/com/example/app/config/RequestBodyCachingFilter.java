package com.example.app.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;

import java.io.IOException;

/**
 * 요청 본문을 캐싱하는 필터 (대안 구현)
 * 
 * ContentCachingFilter가 작동하지 않는 경우를 대비한 대안 필터입니다.
 * @Component로 등록하여 Spring이 자동으로 필터로 인식하도록 합니다.
 */
@Slf4j
@Component
@Order(1)
public class RequestBodyCachingFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String method = request.getMethod();
        String requestURI = request.getRequestURI();

        // POST, PUT, PATCH 요청만 본문 캐싱
        if ("POST".equalsIgnoreCase(method) 
                || "PUT".equalsIgnoreCase(method) 
                || "PATCH".equalsIgnoreCase(method)) {
            
            log.debug("RequestBodyCachingFilter: 요청 본문 캐싱 시작 - {} {}", method, requestURI);
            
            // ContentCachingRequestWrapper로 래핑
            ContentCachingRequestWrapper wrappedRequest = new ContentCachingRequestWrapper(request);
            
            // 필터 체인을 통해 래핑된 요청 전달
            filterChain.doFilter(wrappedRequest, response);
            
            // 캐싱 확인
            byte[] content = wrappedRequest.getContentAsByteArray();
            if (content.length > 0) {
                log.debug("RequestBodyCachingFilter: 요청 본문 캐싱 완료 - {} bytes", content.length);
            } else {
                log.warn("RequestBodyCachingFilter: 요청 본문이 캐싱되지 않음 - {} {}", method, requestURI);
            }
        } else {
            // GET, DELETE 등은 그대로 전달
            filterChain.doFilter(request, response);
        }
    }
}

