# 데이터 아키텍처 문서

## 전체 구조

이 프로젝트는 **3계층 데이터 아키텍처**를 사용합니다:

```
원천 데이터 (Source Systems)
  ↓
DW 레이어 (Data Warehouse)
  ↓ ETL
Mart 레이어 (Mart Tables)
  ↓ ETL
Dashboard 레이어 (Dashboard 전용 테이블)
  ↓
대시보드 API → 프론트엔드
```

## 1. DW 레이어 (Data Warehouse)

### 목적
- 원천 시스템에서 가져온 정규화된 데이터 저장
- 팩트 테이블과 차원 테이블로 구성 (Star Schema)

### 테이블 구조

#### DimDate (날짜 차원 테이블)
```sql
dim_date
├── id (PK)
├── date (날짜, UNIQUE)
├── year (년도)
├── quarter (분기)
├── month (월)
├── week (주차)
├── day (일)
├── day_of_week (요일)
├── day_name (요일명)
├── is_weekend (주말 여부)
├── is_holiday (공휴일 여부)
└── year_month (YYYY-MM)
```

#### FactSales (매출 팩트 테이블)
```sql
fact_sales
├── id (PK)
├── date_id (FK → dim_date)
├── transaction_date (거래일자)
├── sales_amount (매출 금액)
├── quantity (주문 수량)
├── order_count (주문 건수)
├── customer_count (고객 수)
├── category (카테고리)
├── product_id (제품 ID)
└── remarks (비고)
```

#### FactInventory (재고 팩트 테이블)
```sql
fact_inventory
├── id (PK)
├── date_id (FK → dim_date)
├── transaction_date (거래일자)
├── inventory_type (재고 유형: 전월재고, 입고, 출하내수, 출하수출, 기타, 월말재고)
├── quantity (재고 수량)
└── remarks (비고)
```

#### FactDowntime (비가동 팩트 테이블)
```sql
fact_downtime
├── id (PK)
├── date_id (FK → dim_date)
├── transaction_date (거래일자)
├── line_name (라인명: 계획, 실적, 1Line, 2Line, 3Line, 4Line, 5Line)
├── downtime_hours (비가동 시간)
├── downtime_cost (비가동 비용)
└── remarks (비고)
```

## 2. Mart 레이어 (Mart Tables)

### 목적
- DW 데이터를 집계하여 성능 최적화
- 대시보드 조회 성능 향상

### 테이블 구조

#### MartDailySales (일별 매출 마트)
```sql
mart_daily_sales
├── id (PK)
├── sales_date (매출일자, UNIQUE)
├── total_sales_amount (총 매출액)
├── total_order_count (총 주문 건수)
├── total_quantity (총 주문 수량)
├── total_customer_count (총 고객 수)
├── avg_order_amount (평균 주문 금액)
└── aggregated_date (집계 일시)
```

#### MartWeeklySales (주별 매출 마트)
```sql
mart_weekly_sales
├── id (PK)
├── week_start_date (주 시작일, UNIQUE)
├── week_end_date (주 종료일)
├── year (년도)
├── week (주차)
├── total_sales_amount (총 매출액)
├── total_order_count (총 주문 건수)
├── total_quantity (총 주문 수량)
├── total_customer_count (총 고객 수)
├── avg_order_amount (평균 주문 금액)
└── aggregated_date (집계 일시)
```

#### MartMonthlySales (월별 매출 마트)
```sql
mart_monthly_sales
├── id (PK)
├── year (년도)
├── month (월)
├── year_month (YYYY-MM, UNIQUE)
├── total_sales_amount (총 매출액)
├── total_order_count (총 주문 건수)
├── total_quantity (총 주문 수량)
├── total_customer_count (총 고객 수)
├── avg_order_amount (평균 주문 금액)
└── aggregated_date (집계 일시)
```

#### MartDailyInventory (일별 재고 마트)
```sql
mart_daily_inventory
├── id (PK)
├── inventory_date (재고일자)
├── inventory_type (재고 유형, UNIQUE(inventory_date, inventory_type))
├── total_quantity (재고 수량 합계)
└── aggregated_date (집계 일시)
```

#### MartDailyDowntime (일별 비가동 마트)
```sql
mart_daily_downtime
├── id (PK)
├── downtime_date (비가동일자)
├── line_name (라인명, UNIQUE(downtime_date, line_name))
├── total_downtime_hours (비가동 시간 합계)
├── total_downtime_cost (비가동 비용 합계)
└── aggregated_date (집계 일시)
```

## 3. Dashboard 레이어 (Dashboard 전용 테이블)

### 목적
- 대시보드에 최적화된 구조
- 프론트엔드와 직접 매핑 가능

### 테이블 구조

#### DashboardMetric (대시보드 메트릭)
```sql
dashboard_metrics
├── id (PK)
├── date (날짜)
├── metric_type (메트릭 타입: SALES, PROFIT, QUALITY, INVENTORY, PERSONNEL, DOWNTIME)
├── value (값)
├── category (카테고리, 선택사항)
├── dataset_label (데이터셋 라벨, 선택사항)
└── UNIQUE(date, metric_type, category)
└── UNIQUE(date, metric_type, dataset_label)
```

## ETL 프로세스

### EtlService

**위치**: `src/main/java/com/example/app/domain/etl/EtlService.java`

**기능**:
1. `aggregateToMart()`: DW → Mart 집계
   - FactSales → MartDailySales, MartWeeklySales, MartMonthlySales
   - FactInventory → MartDailyInventory
   - FactDowntime → MartDailyDowntime

2. `refineToDashboard()`: Mart → Dashboard 정제
   - MartDailySales → DashboardMetric (SALES)
   - MartDailyInventory → DashboardMetric (INVENTORY)
   - MartDailyDowntime → DashboardMetric (DOWNTIME)

**실행 방식**:
- 수동 실행: `etlService.runEtlProcess(from, to)`
- 자동 실행: `DataInitializer`에서 초기 데이터 생성 시 자동 실행
- 향후: `@Scheduled` 어노테이션으로 주기적 실행 가능

## 데이터 흐름 예시

### 예시: 매출 데이터 흐름

```
1. 원천 시스템
   → 매출 거래 발생 (예: 2025-11-28, 1,500,000원)

2. DW 레이어
   → FactSales 테이블에 저장
   {
     date_id: 123,
     transaction_date: 2025-11-28,
     sales_amount: 1,500,000,
     quantity: 10,
     order_count: 3,
     customer_count: 2
   }

3. Mart 레이어 (ETL 실행)
   → MartDailySales 테이블에 집계
   {
     sales_date: 2025-11-28,
     total_sales_amount: 1,500,000,
     total_order_count: 3,
     total_quantity: 10,
     total_customer_count: 2,
     avg_order_amount: 500,000
   }

4. Dashboard 레이어 (ETL 실행)
   → DashboardMetric 테이블에 정제
   {
     date: 2025-11-28,
     metric_type: SALES,
     value: 1,500,000,
     category: null,
     dataset_label: null
   }

5. 대시보드 API
   → DashboardService가 DashboardMetric에서 조회
   → 프론트엔드에 JSON으로 반환
```

## 초기 데이터 생성

### DataInitializer

**위치**: `src/main/java/com/example/app/domain/user/DataInitializer.java`

**실행 순서**:
1. 기본 역할 생성 (ADMIN, USER)
2. 초기 관리자 계정 생성 (admin/admin1234)
3. 초기 일반 사용자 계정 생성 (user/1234)
4. **DW 초기 데이터 생성** (`createDwData()`)
   - 최근 30일간의 샘플 데이터를 DW 테이블에 생성
   - DimDate, FactSales, FactInventory, FactDowntime
5. **ETL 프로세스 실행** (`runEtlProcess()`)
   - DW → Mart → Dashboard 순서로 데이터 이동

## 장점

### 1. 확장성
- 원천 시스템 추가 시 DW 레이어만 확장
- 새로운 메트릭 추가 시 Dashboard 레이어만 확장

### 2. 성능
- Mart 레이어에서 사전 집계로 빠른 조회
- Dashboard 레이어에서 최적화된 구조로 빠른 응답

### 3. 유지보수
- 각 레이어가 독립적으로 관리 가능
- ETL 프로세스로 데이터 일관성 보장

### 4. 데이터 품질
- DW에서 정규화된 데이터 관리
- Mart에서 집계 데이터 검증
- Dashboard에서 최종 데이터 정제

## 향후 개선 사항

1. **스케줄링**: `@Scheduled`로 주기적 ETL 실행
2. **캐싱**: Redis 등을 사용한 성능 최적화
3. **모니터링**: ETL 프로세스 실행 상태 모니터링
4. **에러 처리**: ETL 실패 시 재시도 로직
5. **증분 처리**: 전체 재처리 대신 증분 처리



