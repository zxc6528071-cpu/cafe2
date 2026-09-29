/**
 * 바이브 카페 (Vibe Cafe) 타입 정의
 */

// 음료 메뉴 항목 타입
export interface BeverageItem {
  id: string;
  name: string;
  price: number;
}

// 사이즈 옵션 타입
export type BeverageSize = 'S' | 'M' | 'L';

export interface SizeOption {
  id: BeverageSize;
  name: string;
  extraPrice: number;
}

// 추가 옵션 타입
export interface ExtraOption {
  id: string;
  name: string;
  price: number;
}

// 주문서 폼 상태 인터페이스
export interface CafeOrderForm {
  customerName: string;      // 이름 (필수)
  phoneNumber: string;       // 전화번호
  beverageId: string;        // 선택된 음료 ID
  size: BeverageSize;        // 선택된 사이즈 (S, M, L)
  selectedOptions: string[]; // 선택된 추가 옵션 ID 목록
  quantity: number;          // 수량 (1 ~ 10)
  specialRequest: string;    // 요청사항
}

// 접수된 주문 기록 인터페이스
export interface SubmittedOrder {
  id: string;
  customerName: string;
  phoneNumber: string;
  beverageName: string;
  sizeName: string;
  optionsSummary: string;
  quantity: number;
  totalPrice: number;
  specialRequest?: string;
  submittedAt: string;
}
