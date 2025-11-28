package com.example.app.domain.user;

import com.example.app.domain.dashboard.DashboardMetricRepository;
import com.example.app.domain.dw.*;
import com.example.app.domain.etl.EtlService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Random;

/**
 * 애플리케이션 시작 시 초기 데이터를 생성하는 컴포넌트
 * 
 * 이 클래스는 CommandLineRunner를 구현하여
 * Spring Boot 애플리케이션이 시작될 때 자동으로 실행됩니다.
 * 
 * 주요 기능:
 * - 기본 역할(ADMIN, USER) 생성
 * - 초기 관리자 계정 생성 (없는 경우에만)
 * 
 * 실행 시점:
 * - 애플리케이션이 완전히 시작된 후
 * - 모든 빈이 준비된 상태에서 실행
 * 
 * @Component: Spring이 이 클래스를 컴포넌트로 인식하여 빈으로 등록합니다.
 * @Slf4j: 로깅을 위한 Lombok 어노테이션 (log 변수 자동 생성)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserService userService;
    private final RoleRepository roleRepository;
    
    // DW 레이어
    private final DimDateRepository dimDateRepository;
    private final FactSalesRepository factSalesRepository;
    private final FactInventoryRepository factInventoryRepository;
    private final FactDowntimeRepository factDowntimeRepository;
    
    // ETL 서비스
    private final EtlService etlService;

    /**
     * 애플리케이션 시작 시 실행되는 메서드
     * 
     * 실행 순서:
     * 1. 기본 역할(ADMIN, USER) 생성 또는 확인
     * 2. 초기 관리자 계정 생성 (없는 경우에만)
     * 
     * @param args 명령줄 인수 (사용하지 않음)
     */
    @Override
    @Transactional
    public void run(String... args) {
        log.info("초기 데이터 생성을 시작합니다...");

        // 1. 기본 역할 생성
        createDefaultRoles();

        // 2. 초기 관리자 계정 생성
        createAdminUser();

        // 3. 초기 일반 사용자 계정 생성
        createUser();

        // 4. DW 초기 데이터 생성
        createDwData();

        // 5. ETL 프로세스 실행 (DW → Mart → Dashboard)
        runEtlProcess();

        log.info("초기 데이터 생성이 완료되었습니다.");
    }

    /**
     * 기본 역할(ADMIN, USER)을 생성합니다.
     * 
     * 역할이 이미 존재하면 생성하지 않고,
     * 없으면 새로 생성합니다.
     */
    private void createDefaultRoles() {
        log.info("기본 역할을 확인하고 생성합니다...");

        // ADMIN 역할 생성 또는 확인
        if (!roleRepository.existsByCode(RoleType.ADMIN.getCode())) {
            Role adminRole = Role.builder()
                    .code(RoleType.ADMIN.getCode())
                    .name(RoleType.ADMIN.getName())
                    .description("시스템 관리자 권한")
                    .active(true)
                    .build();
            roleRepository.save(adminRole);
            log.info("ADMIN 역할이 생성되었습니다: {}", RoleType.ADMIN.getCode());
        } else {
            log.info("ADMIN 역할이 이미 존재합니다: {}", RoleType.ADMIN.getCode());
        }

        // USER 역할 생성 또는 확인
        if (!roleRepository.existsByCode(RoleType.USER.getCode())) {
            Role userRole = Role.builder()
                    .code(RoleType.USER.getCode())
                    .name(RoleType.USER.getName())
                    .description("일반 사용자 권한")
                    .active(true)
                    .build();
            roleRepository.save(userRole);
            log.info("USER 역할이 생성되었습니다: {}", RoleType.USER.getCode());
        } else {
            log.info("USER 역할이 이미 존재합니다: {}", RoleType.USER.getCode());
        }
    }

    /**
     * 초기 관리자 계정을 생성합니다.
     * 
     * 관리자 계정 정보:
     * - username: "admin"
     * - password: "admin1234" (BCrypt로 암호화됨)
     * - role: ADMIN
     * 
     * 이미 "admin" 사용자가 존재하면 생성하지 않습니다.
     */
    private void createAdminUser() {
        log.info("초기 관리자 계정을 확인하고 생성합니다...");

        // "admin" 사용자가 이미 존재하는지 확인
        if (userService.findByUsername("admin").isPresent()) {
            log.info("관리자 계정이 이미 존재합니다. 초기 계정 생성을 건너뜁니다.");
            return;
        }

        // ADMIN 역할 조회
        Role adminRole = roleRepository.findByCode(RoleType.ADMIN.getCode())
                .orElseThrow(() -> new IllegalStateException(
                        "ADMIN 역할이 존재하지 않습니다. 역할을 먼저 생성해야 합니다."));

        // 관리자 계정 생성
        User adminUser = User.builder()
                .username("admin")
                .password("admin1234")  // 평문 비밀번호 (UserService에서 BCrypt로 암호화됨)
                .email("admin@example.com")
                .name("관리자")
                .active(true)
                .build();

        // ADMIN 역할 할당
        adminUser.addRole(adminRole);

        // 사용자 저장 (비밀번호는 UserService.createUser()에서 자동으로 BCrypt로 암호화됨)
        userService.createUser(adminUser);

        log.info("초기 관리자 계정이 생성되었습니다.");
        log.info("  - 사용자명: admin");
        log.info("  - 비밀번호: admin1234");
        log.info("  - 역할: ADMIN");
        log.warn("⚠️  운영 환경에서는 반드시 초기 비밀번호를 변경하세요!");
    }

    /**
     * 초기 일반 사용자 계정을 생성합니다.
     * 
     * 일반 사용자 계정 정보:
     * - username: "user"
     * - password: "1234" (BCrypt로 암호화됨)
     * - role: USER
     * 
     * 이미 "user" 사용자가 존재하면 생성하지 않습니다.
     */
    private void createUser() {
        log.info("초기 일반 사용자 계정을 확인하고 생성합니다...");

        // "user" 사용자가 이미 존재하는지 확인
        if (userService.findByUsername("user").isPresent()) {
            log.info("일반 사용자 계정이 이미 존재합니다. 초기 계정 생성을 건너뜁니다.");
            return;
        }

        // USER 역할 조회
        Role userRole = roleRepository.findByCode(RoleType.USER.getCode())
                .orElseThrow(() -> new IllegalStateException(
                        "USER 역할이 존재하지 않습니다. 역할을 먼저 생성해야 합니다."));

        // 일반 사용자 계정 생성
        User normalUser = User.builder()
                .username("user")
                .password("1234")  // 평문 비밀번호 (UserService에서 BCrypt로 암호화됨)
                .email("user@example.com")
                .name("일반 사용자")
                .active(true)
                .build();

        // USER 역할 할당
        normalUser.addRole(userRole);

        // 사용자 저장 (비밀번호는 UserService.createUser()에서 자동으로 BCrypt로 암호화됨)
        userService.createUser(normalUser);

        log.info("초기 일반 사용자 계정이 생성되었습니다.");
        log.info("  - 사용자명: user");
        log.info("  - 비밀번호: 1234");
        log.info("  - 역할: USER");
        log.warn("⚠️  운영 환경에서는 반드시 초기 비밀번호를 변경하세요!");
    }

    /**
     * DW 초기 데이터 생성
     * 
     * 최근 30일간의 샘플 데이터를 DW 테이블에 생성합니다.
     * 실제 운영 환경에서는 원천 시스템에서 데이터를 가져와야 합니다.
     */
    private void createDwData() {
        log.info("DW 초기 데이터 생성을 시작합니다...");

        // 이미 데이터가 있는지 확인
        long existingCount = factSalesRepository.count();
        if (existingCount > 0) {
            log.info("DW 데이터가 이미 존재합니다. ({}건) 초기 데이터 생성을 건너뜁니다.", existingCount);
            return;
        }

        LocalDate today = LocalDate.now();
        LocalDate startDate = today.minusDays(29); // 최근 30일
        Random random = new Random();
        int createdCount = 0;

        // 최근 30일간 데이터 생성
        for (LocalDate date = startDate; !date.isAfter(today); date = date.plusDays(1)) {
            // 1. DimDate 생성 (날짜 차원 테이블)
            DimDate dimDate = createOrGetDimDate(date);
            createdCount++;

            // 2. FactSales 생성 (매출 팩트)
            double salesAmount = 1000000.0 + (random.nextDouble() * 500000);
            int salesQuantity = 10 + random.nextInt(50);
            int orderCount = 1 + random.nextInt(5);
            int customerCount = random.nextInt(10);

            FactSales factSales = FactSales.builder()
                    .date(dimDate)
                    .transactionDate(date)
                    .salesAmount(salesAmount)
                    .quantity(salesQuantity)
                    .orderCount(orderCount)
                    .customerCount(customerCount)
                    .build();
            factSalesRepository.save(factSales);
            createdCount++;

            // 3. FactInventory 생성 (재고 팩트)
            String[] inventoryTypes = {"전월재고", "입고", "출하내수", "출하수출", "기타", "월말재고"};
            for (String inventoryType : inventoryTypes) {
                double inventoryQuantity = 1000.0 + (random.nextDouble() * 500);
                if (inventoryType.equals("출하내수") || inventoryType.equals("출하수출") || inventoryType.equals("기타")) {
                    inventoryQuantity = -inventoryQuantity; // 출하는 음수
                }

                FactInventory factInventory = FactInventory.builder()
                        .date(dimDate)
                        .transactionDate(date)
                        .inventoryType(inventoryType)
                        .quantity(inventoryQuantity)
                        .build();
                factInventoryRepository.save(factInventory);
                createdCount++;
            }

            // 4. FactDowntime 생성 (비가동 팩트)
            String[] lineNames = {"계획", "실적", "1Line", "2Line", "3Line", "4Line", "5Line"};
            for (String lineName : lineNames) {
                double downtimeHours = 5.0 + (random.nextDouble() * 3);
                double downtimeCost = downtimeHours * 10.0; // 시간당 10만원 가정

                FactDowntime factDowntime = FactDowntime.builder()
                        .date(dimDate)
                        .transactionDate(date)
                        .lineName(lineName)
                        .downtimeHours(downtimeHours)
                        .downtimeCost(downtimeCost)
                        .build();
                factDowntimeRepository.save(factDowntime);
                createdCount++;
            }
        }

        log.info("DW 초기 데이터 생성 완료: {}건", createdCount);
        log.info("  - 기간: {} ~ {}", startDate, today);
        log.info("  - 테이블: DimDate, FactSales, FactInventory, FactDowntime");
    }

    /**
     * 날짜 차원 테이블 생성 또는 조회
     */
    private DimDate createOrGetDimDate(LocalDate date) {
        return dimDateRepository.findByDate(date)
                .orElseGet(() -> {
                    int year = date.getYear();
                    int month = date.getMonthValue();
                    int day = date.getDayOfMonth();
                    int quarter = (month - 1) / 3 + 1;
                    int week = date.get(java.time.temporal.WeekFields.ISO.weekOfWeekBasedYear());
                    int dayOfWeek = date.getDayOfWeek().getValue();
                    String dayName = date.getDayOfWeek().toString();
                    boolean isWeekend = dayOfWeek >= 6;
                    String yearMonth = date.format(DateTimeFormatter.ofPattern("yyyy-MM"));

                    DimDate dimDate = DimDate.builder()
                            .date(date)
                            .year(year)
                            .quarter(quarter)
                            .month(month)
                            .week(week)
                            .day(day)
                            .dayOfWeek(dayOfWeek)
                            .dayName(dayName)
                            .isWeekend(isWeekend)
                            .isHoliday(false)
                            .yearMonth(yearMonth)
                            .build();
                    return dimDateRepository.save(dimDate);
                });
    }

    /**
     * ETL 프로세스 실행
     * 
     * DW → Mart → Dashboard 순서로 데이터를 이동시킵니다.
     */
    private void runEtlProcess() {
        log.info("ETL 프로세스 실행을 시작합니다...");

        LocalDate today = LocalDate.now();
        LocalDate startDate = today.minusDays(29); // 최근 30일

        try {
            etlService.runEtlProcess(startDate, today);
            log.info("ETL 프로세스 실행 완료");
        } catch (Exception e) {
            log.error("ETL 프로세스 실행 중 오류 발생: {}", e.getMessage(), e);
            // ETL 실패해도 애플리케이션은 계속 실행되도록 함
        }
    }
}

