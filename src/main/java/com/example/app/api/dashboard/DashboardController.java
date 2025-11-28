package com.example.app.api.dashboard;

import com.example.app.api.dashboard.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

/**
 * 대시보드(Dashboard) 관련 API 컨트롤러
 * 
 * 이 컨트롤러는 대시보드에 표시할 데이터를 제공합니다.
 * 
 * 권한 설정:
 * - SecurityConfig에서 /api/dashboard/** 경로는 authenticated()로 설정되어 있어
 *   어떤 ROLE이든 로그인만 되어 있으면 접근 가능합니다.
 * - ADMIN과 USER 모두 이 API를 사용할 수 있습니다.
 * 
 * 현재 구현:
 * - GET /api/dashboard/overview: 대시보드 개요 데이터 반환 (더미 데이터)
 * 
 * 향후 개선:
 * - 실제 데이터베이스에서 통계 데이터를 조회하도록 변경
 * - AI/ML 모델을 활용한 예측 데이터 추가
 * - 캐싱을 통한 성능 최적화
 * 
 * 주의:
 * - 현재는 더미 데이터를 반환하지만, 나중에 실제 DB/AI 연동 시
 *   더미 데이터 부분만 교체하면 되도록 코드 구조를 깔끔하게 작성했습니다.
 * - 프론트에서 Chart.js에 바로 바인딩해서 사용할 수 있도록 설계된 구조입니다.
 */
@Slf4j
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final com.example.app.api.dashboard.service.DashboardService dashboardService;

    /**
     * 대시보드 개요 데이터 조회
     * 
     * 대시보드 화면에 표시할 모든 데이터를 반환합니다.
     * 
     * 쿼리 파라미터:
     * - from: 시작일 (yyyy-MM-dd 형식, 선택사항)
     *   - null이면 to 기준으로 최근 7일로 설정 (to.minusDays(6))
     * - to: 종료일 (yyyy-MM-dd 형식, 선택사항)
     *   - null이면 오늘 날짜로 설정 (LocalDate.now())
     * - groupBy: 집계 단위 (DAY, WEEK, MONTH 중 하나, 선택사항)
     *   - 기본값: "DAY"
     *   - 소문자로 입력해도 대문자로 변환하여 처리
     * 
     * 유효성 검증:
     * - from이 to보다 이후일 경우 400 Bad Request 반환
     * - groupBy가 DAY, WEEK, MONTH가 아닐 경우 400 Bad Request 반환
     * - 날짜 형식이 올바르지 않을 경우 400 Bad Request 반환
     * 
     * 현재는 더미 데이터를 반환하지만, 향후 다음과 같이 변경할 수 있습니다:
     * 1. DashboardService를 주입받아 실제 데이터 조회
     * 2. 캐싱을 통한 성능 최적화
     * 3. AI/ML 모델을 활용한 예측 데이터 추가
     * 
     * 보안:
     * - SecurityConfig에서 /api/dashboard/** 경로는 authenticated()로 설정되어 있어
     *   ROLE_USER, ROLE_ADMIN 모두 접근 가능합니다.
     * 
     * @param from 시작일 (yyyy-MM-dd, 선택사항)
     * @param to 종료일 (yyyy-MM-dd, 선택사항)
     * @param groupBy 집계 단위 (DAY, WEEK, MONTH, 선택사항, 기본값 "DAY")
     * @return 대시보드 개요 데이터 (요약 카드, 차트 데이터 포함)
     */
    @GetMapping("/overview")
    public ResponseEntity<DashboardOverviewResponse> getOverview(
            @RequestParam(value = "from", required = false) String from,
            @RequestParam(value = "to", required = false) String to,
            @RequestParam(value = "groupBy", defaultValue = "DAY") String groupBy) {
        log.info("대시보드 개요 데이터 조회 요청 - from: {}, to: {}, groupBy: {}", from, to, groupBy);

        // 날짜 파싱 및 기본값 설정
        LocalDate toDate = parseDate(to, LocalDate.now(), "to");
        LocalDate fromDate = parseDate(from, toDate.minusDays(6), "from");

        // 유효성 검증: from이 to보다 이후일 수 없음
        if (fromDate.isAfter(toDate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    "from 날짜는 to 날짜보다 이후일 수 없습니다.");
        }

        // groupBy 유효성 검증 및 정규화
        String normalizedGroupBy = validateAndNormalizeGroupBy(groupBy);

        // 실제 데이터베이스에서 데이터 조회
        DashboardOverviewResponse response = dashboardService.getOverview(fromDate, toDate, normalizedGroupBy);
        
        return ResponseEntity.ok(response);
    }

    /**
     * 날짜 문자열을 LocalDate로 파싱
     * 
     * @param dateStr 파싱할 날짜 문자열 (yyyy-MM-dd 형식)
     * @param defaultValue null일 경우 사용할 기본값
     * @param paramName 파라미터 이름 (에러 메시지용)
     * @return 파싱된 LocalDate
     * @throws ResponseStatusException 날짜 형식이 올바르지 않을 경우
     */
    private LocalDate parseDate(String dateStr, LocalDate defaultValue, String paramName) {
        if (dateStr == null || dateStr.trim().isEmpty()) {
            return defaultValue;
        }
        
        try {
            return LocalDate.parse(dateStr, DateTimeFormatter.ISO_LOCAL_DATE);
        } catch (DateTimeParseException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    String.format("%s 파라미터의 날짜 형식이 올바르지 않습니다. yyyy-MM-dd 형식으로 입력해주세요.", paramName));
        }
    }

    /**
     * groupBy 파라미터 유효성 검증 및 정규화
     * 
     * @param groupBy 집계 단위 문자열
     * @return 정규화된 집계 단위 (DAY, WEEK, MONTH 중 하나)
     * @throws ResponseStatusException 허용되지 않은 값일 경우
     */
    private String validateAndNormalizeGroupBy(String groupBy) {
        if (groupBy == null || groupBy.trim().isEmpty()) {
            return "DAY";
        }
        
        String normalized = groupBy.trim().toUpperCase();
        
        if (!normalized.equals("DAY") && !normalized.equals("WEEK") && !normalized.equals("MONTH")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    "groupBy는 DAY, WEEK, MONTH 중 하나여야 합니다.");
        }
        
        return normalized;
    }

}
