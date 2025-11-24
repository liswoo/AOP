package com.example.app.api.dashboard;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * 대시보드(Dashboard) 관련 API 컨트롤러
 * 
 * 이 컨트롤러는 대시보드에 표시할 데이터를 제공합니다.
 * 
 * 현재 구현:
 * - GET /api/dashboard/sample: 샘플 데이터 반환
 * 
 * 향후 추가 예정:
 * - GET /api/dashboard/stats: 통계 데이터 조회
 * - GET /api/dashboard/charts: 차트 데이터 조회
 * - GET /api/dashboard/recent-activities: 최근 활동 조회
 * 
 * 주의: 나중에 reporting 모듈의 서비스를 사용하여
 * 복잡한 쿼리(MyBatis 또는 Native Query)로 데이터를 조회할 예정입니다.
 */
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    /**
     * 샘플 대시보드 데이터 엔드포인트
     * 
     * 현재는 더미 데이터를 반환하며,
     * 나중에 실제 데이터베이스에서 조회하도록 변경 예정입니다.
     * 
     * @return 샘플 데이터
     */
    @GetMapping("/sample")
    public ResponseEntity<Map<String, Object>> getSampleData() {
        Map<String, Object> data = new HashMap<>();
        data.put("message", "대시보드 샘플 데이터입니다.");
        data.put("totalUsers", 0);
        data.put("totalOrders", 0);
        data.put("revenue", 0);
        
        // TODO: reporting.service.DashboardService를 주입받아 실제 데이터 조회 예정
        // 예: return ResponseEntity.ok(dashboardService.getDashboardData());
        
        return ResponseEntity.ok(data);
    }
}

