package com.example.app.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;

/**
 * 요청/응답 본문을 캐싱하는 필터
 * 
 * 이 필터는 요청 본문을 캐싱하여 여러 번 읽을 수 있도록 합니다.
 * Spring Security 필터 체인에서 요청 본문을 읽으면 InputStream이 소진되어
 * 컨트롤러에서 다시 읽을 수 없기 때문에 필요합니다.
 * 
 * 특히 CORS 프리플라이트 요청이나 필터에서 요청 본문을 읽는 경우에 유용합니다.
 * 
 * Servlet Filter로 등록하여 Spring Security 필터 체인보다 먼저 실행되도록 합니다.
 * FilterRegistrationBean을 통해 등록됩니다.
 */
@Slf4j
public class ContentCachingFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String requestURI = request.getRequestURI();
        String method = request.getMethod();
        
        log.debug("ContentCachingFilter 실행: {} {}", method, requestURI);

        // OPTIONS 요청(CORS 프리플라이트)은 필터를 건너뛰기
        if ("OPTIONS".equalsIgnoreCase(method)) {
            filterChain.doFilter(request, response);
            return;
        }

        // POST, PUT, PATCH 요청만 본문 캐싱 필요
        boolean shouldCache = "POST".equalsIgnoreCase(method) 
                || "PUT".equalsIgnoreCase(method) 
                || "PATCH".equalsIgnoreCase(method);

        if (shouldCache) {
            log.debug("요청 본문 캐싱 시작: {} {}", method, requestURI);
            
            // 요청 본문을 캐싱할 수 있도록 래핑
            ContentCachingRequestWrapper wrappedRequest = new ContentCachingRequestWrapper(request);
            ContentCachingResponseWrapper wrappedResponse = new ContentCachingResponseWrapper(response);

            try {
                // 다음 필터로 전달 (래핑된 요청/응답 사용)
                // ContentCachingRequestWrapper는 요청 본문을 읽을 때 자동으로 캐싱합니다.
                // Spring의 @RequestBody가 래핑된 요청의 InputStream을 읽으면 자동으로 캐싱됩니다.
                filterChain.doFilter(wrappedRequest, wrappedResponse);
                
                // 요청 본문 캐싱 확인
                byte[] content = wrappedRequest.getContentAsByteArray();
                if (content.length > 0) {
                    log.debug("요청 본문 캐싱 완료: {} bytes", content.length);
                } else {
                    log.warn("요청 본문이 캐싱되지 않았습니다: {} {}", method, requestURI);
                }
            } finally {
                // 응답 본문을 클라이언트로 전송
                wrappedResponse.copyBodyToResponse();
            }
        } else {
            // GET, DELETE 등 본문이 없는 요청은 그대로 전달
            filterChain.doFilter(request, response);
        }
    }
}


