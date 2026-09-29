import { BeverageItem, SizeOption, ExtraOption } from '../types';

/**
 * 3. 음료 선택 목록 데이터
 * - 아메리카노 3,500원
 * - 카페라떼 4,000원
 * - 카페모카 4,500원
 * - 바닐라라떼 4,500원
 * - 녹차라떼 4,500원
 */
export const BEVERAGES: BeverageItem[] = [
  { id: 'americano', name: '아메리카노', price: 3500 },
  { id: 'latte', name: '카페라떼', price: 4000 },
  { id: 'mocha', name: '카페모카', price: 4500 },
  { id: 'vanilla_latte', name: '바닐라라떼', price: 4500 },
  { id: 'green_tea_latte', name: '녹차라떼', price: 4500 },
];

/**
 * 4. 사이즈 옵션 (라디오 버튼)
 * - S +0원, M +500원 (기본 선택), L +1,000원
 */
export const SIZES: SizeOption[] = [
  { id: 'S', name: 'S (+0원)', extraPrice: 0 },
  { id: 'M', name: 'M (+500원)', extraPrice: 500 },
  { id: 'L', name: 'L (+1,000원)', extraPrice: 1000 },
];

/**
 * 5. 추가 옵션 (체크박스)
 * - 샷 추가 +500원
 * - 크림 추가 +500원
 * - 시럽 추가 +300원
 * - 디카페인 +0원
 */
export const EXTRA_OPTIONS: ExtraOption[] = [
  { id: 'extra_shot', name: '샷 추가 (+500원)', price: 500 },
  { id: 'extra_cream', name: '크림 추가 (+500원)', price: 500 },
  { id: 'extra_syrup', name: '시럽 추가 (+300원)', price: 300 },
  { id: 'decaf', name: '디카페인 (+0원)', price: 0 },
];

/**
 * Supabase SQL Editor용 스크립트
 * 1) 주문서 항목을 반영한 테이블 생성 DDL
 * 2) 1건의 테스트용 가짜 데이터 INSERT DML
 */
export const SUPABASE_SQL_SCRIPT = `-- ==========================================
-- 바이브 카페 (Vibe Cafe) Supabase SQL 스크립트
-- 1) cafe_menu (주문서 항목 테이블) 생성
-- 2) 테스트용 1건 Dummy Data INSERT
-- ==========================================

-- 1. 주문 테이블 (cafe_menu) 생성
CREATE TABLE IF NOT EXISTS public.cafe_menu (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name VARCHAR(100) NOT NULL,            -- 1. 이름 (필수, text)
    phone_number VARCHAR(50),                       -- 2. 전화번호 (tel)
    beverage_name VARCHAR(100) NOT NULL,           -- 3. 음료 선택 (아메리카노, 카페라떼 등)
    beverage_size VARCHAR(10) NOT NULL DEFAULT 'M', -- 4. 사이즈 (S, M, L)
    extra_options TEXT[],                           -- 5. 추가 옵션 목록 (배열)
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1 AND quantity <= 10), -- 6. 수량 (1~10)
    special_request TEXT,                           -- 7. 요청사항 (textarea)
    total_price INTEGER NOT NULL,                   -- 최종 예상/결제 금액 (원)
    order_status VARCHAR(30) DEFAULT '접수완료',     -- 주문 상태
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL -- 주문 접수 시각
);

-- 코멘트 추가 (컬럼 설명 문서화)
COMMENT ON TABLE public.cafe_menu IS '바이브 카페 고객 주문서 및 접수 내역 테이블';
COMMENT ON COLUMN public.cafe_menu.customer_name IS '주문자 성함 (필수)';
COMMENT ON COLUMN public.cafe_menu.phone_number IS '주문자 연락처';
COMMENT ON COLUMN public.cafe_menu.beverage_name IS '주문 음료 메뉴명';
COMMENT ON COLUMN public.cafe_menu.beverage_size IS '음료 사이즈 (S / M / L)';
COMMENT ON COLUMN public.cafe_menu.extra_options IS '선택한 추가 옵션 목록';
COMMENT ON COLUMN public.cafe_menu.quantity IS '주문 수량 (1 ~ 10)';
COMMENT ON COLUMN public.cafe_menu.special_request IS '고객 요청사항';
COMMENT ON COLUMN public.cafe_menu.total_price IS '총 주문 금액';

-- 보안 및 접근 제어: Row Level Security(RLS) 활성화
ALTER TABLE public.cafe_menu ENABLE ROW LEVEL SECURITY;

-- 주문서 등록 정책: 누구나 새로운 주문을 INSERT 할 수 있도록 허용
CREATE POLICY "누구나 주문서 접수 가능" 
ON public.cafe_menu 
FOR INSERT 
WITH CHECK (true);

-- 주문서 조회 정책: 주문 목록 조회 허용
CREATE POLICY "주문 내역 조회 허용" 
ON public.cafe_menu 
FOR SELECT 
USING (true);

-- 2. 테스트용 1건 가짜 데이터 (Dummy Data) INSERT 쿼리문
INSERT INTO public.cafe_menu (
    customer_name,
    phone_number,
    beverage_name,
    beverage_size,
    extra_options,
    quantity,
    special_request,
    total_price,
    order_status
) VALUES (
    '홍길동',
    '010-1234-5678',
    '카페라떼',
    'M',
    ARRAY['샷 추가'],
    1,
    '얼음 조금만 넣어주시고 빨대 챙겨주세요~',
    5000,
    '접수완료'
);

-- 데이터 확인용 쿼리
SELECT * FROM public.cafe_menu ORDER BY created_at DESC LIMIT 5;
`;
