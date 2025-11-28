# 대시보드 테이블 구조 및 데이터 아키텍처

## 현재 구조 (3계층 구조)

### ✅ DW → Mart → Dashboard 전용 테이블 구조

현재 프로젝트는 **3계층 데이터 아키텍처**를 사용하고 있습니다:

```
1. DW 레이어 (Data Warehouse)
   ├── DimDate (날짜 차원 테이블)
   ├── FactSales (매출 팩트 테이블)
   ├── FactInventory (재고 팩트 테이블)
   └── FactDowntime (비가동 팩트 테이블)
   ↓ ETL
2. Mart 레이어 (Mart Tables)
   ├── MartDailySales (일별 매출 집계)
   ├── MartWeeklySales (주별 매출 집계)
   ├── MartMonthlySales (월별 매출 집계)
   ├── MartDailyInventory (일별 재고 집계)
   └── MartDailyDowntime (일별 비가동 집계)
   ↓ ETL
3. Dashboard 레이어 (Dashboard 전용 테이블)
   └── DashboardMetric (대시보드 메트릭)
```

### 이전 구조 (단일 테이블 구조)

현재 프로젝트는 **단일 테이블 구조**를 사용하고 있습니다:

```sql
dashboard_metrics
├── id (PK)
├── date (날짜)
├── metric_type (메트릭 타입: SALES, PROFIT, QUALITY, INVENTORY, PERSONNEL, DOWNTIME)
├── value (값)
├── category (카테고리, 선택사항)
├── dataset_label (데이터셋 라벨, 선택사항)
├── created_at
└── updated_at
```

**장점:**
- 구조가 단순하고 이해하기 쉬움
- 유연한 메트릭 타입 확장 가능
- 작은 규모의 프로젝트에 적합

**단점:**
- 대용량 데이터 처리 시 성능 이슈 가능
- 복잡한 집계 쿼리 작성이 어려울 수 있음

## DW/마트 테이블 구조 (일반적인 구조)

### 1. 팩트 테이블 + 차원 테이블 구조 (Star Schema)

```
fact_sales (팩트 테이블)
├── date_id (FK → dim_date)
├── product_id (FK → dim_product)
├── customer_id (FK → dim_customer)
├── sales_amount
└── quantity

dim_date (차원 테이블)
├── date_id (PK)
├── date
├── year
├── month
├── week
└── day_of_week

dim_product (차원 테이블)
├── product_id (PK)
├── product_name
├── category
└── price
```

**장점:**
- 정규화된 구조로 데이터 중복 최소화
- 복잡한 분석 쿼리 작성 용이
- 대용량 데이터 처리에 적합

**단점:**
- 구조가 복잡함
- JOIN이 많아 쿼리 성능 이슈 가능
- 유지보수 비용이 높음

### 2. 집계 마트 테이블 구조

```
mart_daily_sales (일별 집계 마트)
├── date
├── total_sales
├── total_orders
├── new_customers
└── avg_order_amount

mart_weekly_sales (주별 집계 마트)
├── week_start_date
├── week_end_date
├── total_sales
└── ...

mart_monthly_sales (월별 집계 마트)
├── year_month
├── total_sales
└── ...
```

**장점:**
- 미리 집계된 데이터로 빠른 조회
- 대시보드 성능 최적화
- 쿼리가 단순함

**단점:**
- 데이터 중복 발생
- 집계 로직 유지보수 필요
- 실시간 데이터 반영 지연

### 3. 대시보드 전용 정제 테이블 구조

```
dashboard_summary (대시보드 전용 테이블)
├── date
├── metric_name
├── metric_value
├── metric_category
└── display_order

dashboard_chart_data (차트 데이터 전용)
├── chart_type (line, bar, doughnut)
├── date
├── label
├── value
└── dataset_label
```

**장점:**
- 대시보드에 최적화된 구조
- 프론트엔드와 직접 매핑 가능
- 성능 최적화 용이

**단점:**
- 별도 ETL 프로세스 필요
- 데이터 동기화 관리 필요

## 데이터 흐름 (DW → 마트 → 대시보드)

### 일반적인 데이터 흐름

```
1. 원천 데이터 (Source Systems)
   ↓
2. DW (Data Warehouse) - 정규화된 팩트/차원 테이블
   ↓
3. 마트 테이블 (Mart Tables) - 집계된 데이터
   ↓
4. 대시보드 테이블 (Dashboard Tables) - 정제된 데이터
   ↓
5. 대시보드 API → 프론트엔드
```

### 실제 운영 환경에서의 선택

#### 옵션 1: 마트 테이블에서 직접 조회
```java
// 장점: 간단하고 빠름
// 단점: 대시보드에 맞게 추가 변환 필요
SELECT * FROM mart_daily_sales WHERE date BETWEEN ? AND ?
```

#### 옵션 2: 대시보드 전용 테이블에서 조회 (권장)
```java
// 장점: 대시보드에 최적화, 성능 우수
// 단점: 별도 ETL 프로세스 필요
SELECT * FROM dashboard_metrics WHERE date BETWEEN ? AND ?
```

## 현재 프로젝트의 구조 선택

현재 프로젝트는 **옵션 2 (대시보드 전용 테이블)** 구조를 채택했습니다:

1. **단일 테이블 구조**: `dashboard_metrics`
   - 모든 메트릭 타입을 하나의 테이블에 저장
   - `metric_type`, `category`, `dataset_label`로 구분

2. **향후 확장 가능성**:
   - 필요 시 팩트/차원 테이블 구조로 확장 가능
   - 마트 테이블과 연동하여 데이터 동기화 가능
   - ETL 프로세스 추가 가능

3. **데이터 소스**:
   - 현재: `DataInitializer`에서 샘플 데이터 생성
   - 향후: DW/마트 테이블에서 ETL로 데이터 적재

## 권장 사항

### 소규모 프로젝트 (현재)
- ✅ 현재 구조 유지 (단일 테이블)
- ✅ 필요 시 집계 쿼리로 성능 최적화

### 중규모 프로젝트
- 마트 테이블 추가 고려
- 주기적으로 집계하여 마트 테이블에 저장
- 대시보드는 마트 테이블에서 조회

### 대규모 프로젝트
- 팩트/차원 테이블 구조 (Star Schema)
- ETL 프로세스로 대시보드 전용 테이블 생성
- 실시간 데이터 스트리밍 고려

## 참고

- 현재 구조는 작은 규모의 프로젝트에 적합하며, 필요에 따라 점진적으로 확장 가능합니다.
- 실제 운영 환경에서는 DW/마트 테이블에서 데이터를 가져와 `dashboard_metrics` 테이블에 적재하는 ETL 프로세스가 필요합니다.

