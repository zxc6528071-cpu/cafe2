/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { BEVERAGES, SIZES, EXTRA_OPTIONS, SUPABASE_SQL_SCRIPT } from './data/cafeData';
import { BeverageSize, CafeOrderForm } from './types';
import { 
  Coffee, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Database, 
  Copy, 
  Check, 
  ReceiptText,
  Sparkles
} from 'lucide-react';

export default function App() {
  // ==========================================
  // [상태 관리 (State)]
  // ==========================================
  
  // 1. 주문서 입력 상태
  const initialFormState: CafeOrderForm = {
    customerName: '',         // 이름 (필수)
    phoneNumber: '',          // 전화번호 (선택)
    beverageId: '',           // 음료 선택 (기본: 선택 안 함)
    size: 'M',                // 사이즈 (기본 선택: M)
    selectedOptions: [],      // 추가 옵션 목록 (체크박스)
    quantity: 1,              // 수량 (최소 1, 최대 10, 기본 1)
    specialRequest: '',       // 요청사항
  };

  const [formData, setFormData] = useState<CafeOrderForm>(initialFormState);

  // 2. 알림 메시지 상태 (유효성 검사 실패 시 경고)
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 3. 주문 확인 메시지 상태 (정상 주문 접수 완료 시 표시)
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);

  // 4. Supabase SQL 쿼리 모달 / 패널 표시 상태
  const [showSqlModal, setShowSqlModal] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  // ==========================================
  // [실시간 금액 계산 (Realtime Calculation)]
  // 음료, 사이즈, 추가옵션, 수량이 변경될 때마다 자동 계산
  // ==========================================
  const currentPriceBreakdown = useMemo(() => {
    // 선택된 음료 기본 가격 (미선택 시 0원)
    const selectedDrink = BEVERAGES.find((drink) => drink.id === formData.beverageId);
    const baseDrinkPrice = selectedDrink ? selectedDrink.price : 0;

    // 사이즈 추가 금액 (S: 0원, M: +500원, L: +1,000원)
    const selectedSizeOption = SIZES.find((s) => s.id === formData.size);
    const sizeExtraPrice = selectedDrink ? (selectedSizeOption?.extraPrice ?? 0) : 0;

    // 추가 옵션 금액 합계
    const optionsExtraPrice = selectedDrink
      ? formData.selectedOptions.reduce((acc, optId) => {
          const opt = EXTRA_OPTIONS.find((o) => o.id === optId);
          return acc + (opt ? opt.price : 0);
        }, 0)
      : 0;

    // 잔당 가격 (음료가 선택되지 않았으면 0원)
    const singleUnitPrice = baseDrinkPrice + sizeExtraPrice + optionsExtraPrice;

    // 최종 총 금액 (단가 * 수량)
    const totalPrice = singleUnitPrice * formData.quantity;

    return {
      selectedDrink,
      baseDrinkPrice,
      sizeExtraPrice,
      optionsExtraPrice,
      singleUnitPrice,
      totalPrice,
    };
  }, [formData.beverageId, formData.size, formData.selectedOptions, formData.quantity]);

  // ==========================================
  // [이벤트 핸들러 함수들]
  // ==========================================

  // 일반 입력 변경 핸들러
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // 사용자 입력 시 기존 오류 메시지 초기화
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  // 사이즈 라디오 버튼 변경 핸들러
  const handleSizeChange = (newSize: BeverageSize) => {
    setFormData((prev) => ({
      ...prev,
      size: newSize,
    }));
  };

  // 추가 옵션 체크박스 토글 핸들러
  const handleOptionToggle = (optionId: string) => {
    setFormData((prev) => {
      const exists = prev.selectedOptions.includes(optionId);
      return {
        ...prev,
        selectedOptions: exists
          ? prev.selectedOptions.filter((id) => id !== optionId)
          : [...prev.selectedOptions, optionId],
      };
    });
  };

  // 수량 증감 버튼 및 직접 입력 핸들러 (1~10 범위 제한)
  const handleQuantityChange = (val: number) => {
    const clamped = Math.max(1, Math.min(10, val));
    setFormData((prev) => ({
      ...prev,
      quantity: clamped,
    }));
  };

  // 주문하기 버튼 클릭 핸들러
  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1) 이름 유효성 검사: 비어있으면 경고
    if (!formData.customerName.trim()) {
      setErrorMessage('이름을 입력해주세요');
      setConfirmationMessage(null);
      // 이름 입력칸으로 포커스
      document.getElementById('customer-name')?.focus();
      return;
    }

    // 2) 음료 유효성 검사: 선택하지 않았으면 경고
    if (!formData.beverageId) {
      setErrorMessage('음료를 선택해주세요');
      setConfirmationMessage(null);
      // 음료 선택 드롭다운으로 포커스
      document.getElementById('beverage-select')?.focus();
      return;
    }

    // 에러 해제
    setErrorMessage(null);

    // 3) 주문 확인 메시지 생성
    // 형식 예: "홍길동님, 카페라떼 M사이즈 (샷 추가) 1잔, 총 5,000원 주문이 접수되었습니다!"
    const drinkName = currentPriceBreakdown.selectedDrink?.name ?? '음료';
    const sizeName = `${formData.size}사이즈`;

    // 선택된 추가 옵션 이름들 추출
    const selectedOptionNames = formData.selectedOptions
      .map((optId) => {
        const optionItem = EXTRA_OPTIONS.find((o) => o.id === optId);
        // "(+500원)" 등의 가격 표기를 제외하고 순수 옵션명만 깔끔하게 추출 (예: '샷 추가')
        return optionItem?.name.split(' (')[0] ?? '';
      })
      .filter(Boolean);

    // 추가 옵션 문구 (없으면 빈 문자열)
    const optionsText =
      selectedOptionNames.length > 0 ? ` (${selectedOptionNames.join(', ')})` : '';

    const formattedPrice = currentPriceBreakdown.totalPrice.toLocaleString();
    const successMsg = `${formData.customerName.trim()}님, ${drinkName} ${sizeName}${optionsText} ${formData.quantity}잔, 총 ${formattedPrice}원 주문이 접수되었습니다!`;

    setConfirmationMessage(successMsg);

    // 부드럽게 확인 메시지 영역으로 스크롤 이동
    setTimeout(() => {
      const confirmEl = document.getElementById('confirmation-area');
      if (confirmEl) {
        confirmEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
  };

  // 다시 작성 버튼 핸들러 (모든 입력과 금액 초기화)
  const handleReset = () => {
    setFormData(initialFormState);
    setErrorMessage(null);
    setConfirmationMessage(null);
  };

  // Supabase SQL 클립보드 복사 함수
  const copySqlToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    } catch {
      // 복사 실패 시 폴백
      const textarea = document.createElement('textarea');
      textarea.value = SUPABASE_SQL_SCRIPT;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 flex flex-col items-center justify-start">
      {/* 
        [전체 디자인 규칙]
        - 카페 느낌의 따뜻한 색상 (베이지 #faf6f0, 브라운 #6b4226)
        - 둥근 모서리, 부드러운 그림자
        - 최대 너비 520px, 가운데 정렬
      */}
      <div className="w-full max-w-[520px] bg-white rounded-2xl shadow-lg border border-[#e8ded2] overflow-hidden transition-all duration-300">
        
        {/* 상단 브라운 장식 바 */}
        <div className="h-2.5 bg-[#6b4226] w-full" />

        <div className="p-6 sm:p-8">
          {/* ========================================== */}
          {/* [페이지 상단 헤더] */}
          {/* - 카페 로고: ☕ 이모지 크게 */}
          {/* - 카페 이름: "바이브 카페" */}
          {/* - 부제: "당신의 하루에 바이브를 더하다" */}
          {/* ========================================== */}
          <header className="text-center mb-7">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#f6eee3] text-4xl mb-3 shadow-inner">
              <span role="img" aria-label="커피 로고">☕</span>
            </div>
            <h1 className="text-2xl sm:text-[28px] font-bold text-[#6b4226] tracking-tight mb-1 flex items-center justify-center gap-1.5">
              바이브 카페
            </h1>
            <p className="text-sm sm:text-base text-[#8c6b53] font-medium">
              당신의 하루에 바이브를 더하다
            </p>
          </header>

          {/* ========================================== */}
          {/* [주문서 폼] */}
          {/* ========================================== */}
          <form onSubmit={handleOrderSubmit} className="space-y-5">
            
            {/* 1. 이름 (필수, text) */}
            <div>
              <label 
                htmlFor="customer-name" 
                className="block text-sm font-semibold text-[#4a3728] mb-1.5"
              >
                1. 이름 <span className="text-red-500 font-bold" title="필수 항목">*</span>
              </label>
              <input
                type="text"
                id="customer-name"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                placeholder="주문하시는 분의 성함을 입력해주세요"
                className="cafe-input"
                autoComplete="name"
              />
            </div>

            {/* 2. 전화번호 (tel) */}
            <div>
              <label 
                htmlFor="customer-phone" 
                className="block text-sm font-semibold text-[#4a3728] mb-1.5"
              >
                2. 전화번호
              </label>
              <input
                type="tel"
                id="customer-phone"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="예: 010-1234-5678 (주문 알림용)"
                className="cafe-input"
                autoComplete="tel"
              />
            </div>

            {/* 3. 음료 선택 (드롭다운) */}
            <div>
              <label 
                htmlFor="beverage-select" 
                className="block text-sm font-semibold text-[#4a3728] mb-1.5"
              >
                3. 음료 선택 <span className="text-red-500 font-bold" title="필수 항목">*</span>
              </label>
              <div className="relative">
                <select
                  id="beverage-select"
                  name="beverageId"
                  value={formData.beverageId}
                  onChange={handleInputChange}
                  className="cafe-input appearance-none pr-10 cursor-pointer"
                >
                  <option value="">-- 음료를 선택해주세요 --</option>
                  {BEVERAGES.map((drink) => (
                    <option key={drink.id} value={drink.id}>
                      {drink.name} ({drink.price.toLocaleString()}원)
                    </option>
                  ))}
                </select>
                {/* 커스텀 화살표 아이콘 */}
                <div className="absolute inset-y-0 right-0 flex items-center px-3.5 pointer-events-none text-[#8c6b53]">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* 4. 사이즈 (라디오 버튼, 가로 배치) */}
            <div>
              <span className="block text-sm font-semibold text-[#4a3728] mb-1.5">
                4. 사이즈 선택
              </span>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3" role="radiogroup" aria-label="사이즈 선택">
                {SIZES.map((sizeOption) => {
                  const isChecked = formData.size === sizeOption.id;
                  const radioId = `size-${sizeOption.id}`;
                  return (
                    <label
                      key={sizeOption.id}
                      htmlFor={radioId}
                      className={`cafe-radio-label flex-1 text-center justify-center py-2.5 ${isChecked ? 'active' : ''}`}
                    >
                      <input
                        type="radio"
                        id={radioId}
                        name="size"
                        value={sizeOption.id}
                        checked={isChecked}
                        onChange={() => handleSizeChange(sizeOption.id)}
                        className="sr-only"
                      />
                      <span>{sizeOption.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 5. 추가 옵션 (체크박스, 가로 배치) */}
            <div>
              <span className="block text-sm font-semibold text-[#4a3728] mb-1.5">
                5. 추가 옵션 (다중 선택 가능)
              </span>
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                {EXTRA_OPTIONS.map((option) => {
                  const isChecked = formData.selectedOptions.includes(option.id);
                  const checkboxId = `option-${option.id}`;
                  return (
                    <label
                      key={option.id}
                      htmlFor={checkboxId}
                      className={`cafe-checkbox-label justify-start py-2.5 ${isChecked ? 'active' : ''}`}
                    >
                      <input
                        type="checkbox"
                        id={checkboxId}
                        name="selectedOptions"
                        value={option.id}
                        checked={isChecked}
                        onChange={() => handleOptionToggle(option.id)}
                        className="mr-2 accent-[#6b4226] w-4 h-4 cursor-pointer"
                      />
                      <span className="text-[13.5px] leading-tight">{option.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 6. 수량 (number 타입, 최소 1, 최대 10, 기본값 1) */}
            <div>
              <label 
                htmlFor="order-quantity" 
                className="block text-sm font-semibold text-[#4a3728] mb-1.5"
              >
                6. 수량 (최대 10잔)
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(formData.quantity - 1)}
                  disabled={formData.quantity <= 1}
                  className="w-10 h-10 rounded-lg border border-[#dccdc2] bg-[#fdfaf7] text-lg font-bold text-[#6b4226] hover:bg-[#f3e9df] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                  aria-label="수량 1 감소"
                >
                  -
                </button>
                <input
                  type="number"
                  id="order-quantity"
                  name="quantity"
                  min={1}
                  max={10}
                  value={formData.quantity}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value, 10) || 1)}
                  className="cafe-input text-center font-bold text-lg max-w-[120px]"
                />
                <button
                  type="button"
                  onClick={() => handleQuantityChange(formData.quantity + 1)}
                  disabled={formData.quantity >= 10}
                  className="w-10 h-10 rounded-lg border border-[#dccdc2] bg-[#fdfaf7] text-lg font-bold text-[#6b4226] hover:bg-[#f3e9df] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                  aria-label="수량 1 증가"
                >
                  +
                </button>
                <span className="text-sm text-[#8c6b53] font-medium ml-1">잔</span>
              </div>
            </div>

            {/* 7. 요청사항 (textarea) */}
            <div>
              <label 
                htmlFor="special-request" 
                className="block text-sm font-semibold text-[#4a3728] mb-1.5"
              >
                7. 요청사항
              </label>
              <textarea
                id="special-request"
                name="specialRequest"
                rows={3}
                value={formData.specialRequest}
                onChange={handleInputChange}
                placeholder="예: 얼음 적게 넣어주세요, 따뜻하게 데워주세요 등"
                className="cafe-input resize-none"
              />
            </div>

            {/* ========================================== */}
            {/* [실시간 예상 금액 표시 영역] */}
            {/* - 주문하기 버튼 바로 위에 큰 글씨(24px), 갈색, 굵게, 가운데 정렬 */}
            {/* ========================================== */}
            <div className="pt-2 pb-1 border-t border-dashed border-[#e6d8cc] mt-4">
              <div 
                className="text-center py-3 px-4 rounded-xl bg-[#faf4ec] border border-[#f0e3d5]"
                aria-live="polite"
              >
                <div className="text-xs sm:text-sm text-[#8c6b53] font-medium mb-0.5">
                  실시간 계산 금액
                </div>
                <div className="text-[24px] font-bold text-[#6b4226] tracking-tight">
                  예상 금액: {currentPriceBreakdown.totalPrice.toLocaleString()}원
                </div>
                {formData.beverageId ? (
                  <div className="text-xs text-[#a07e66] mt-0.5">
                    ({formData.quantity}잔 기준: 잔당 {currentPriceBreakdown.singleUnitPrice.toLocaleString()}원)
                  </div>
                ) : (
                  <div className="text-xs text-[#a89f91] mt-0.5">
                    음료를 선택하시면 금액이 자동 계산됩니다.
                  </div>
                )}
              </div>
            </div>

            {/* ========================================== */}
            {/* [에러/유효성 경고 알림 영역] */}
            {/* ========================================== */}
            {errorMessage && (
              <div 
                role="alert" 
                className="flex items-center gap-2.5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium animate-fadeIn"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* ========================================== */}
            {/* [8. 주문하기 버튼 & 9. 다시 작성 버튼] */}
            {/* - 주문하기 버튼: 갈색 배경(#6b4226), 흰색 글씨, hover시 약간 밝게 */}
            {/* ========================================== */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="submit"
                className="flex-1 py-3.5 px-6 rounded-lg bg-[#6b4226] hover:bg-[#7f502f] active:bg-[#56331c] text-white font-bold text-base transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Coffee className="w-5 h-5" />
                <span>주문하기</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="py-3.5 px-5 rounded-lg border border-[#dccdc2] bg-[#fbf8f5] hover:bg-[#f1e6db] text-[#6b4226] font-semibold text-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>다시 작성</span>
              </button>
            </div>
          </form>

          {/* ========================================== */}
          {/* [주문 확인 메시지 표시 영역] */}
          {/* - 연두색 배경, 초록 글씨, 둥근 모서리 */}
          {/* 예) "홍길동님, 카페라떼 M사이즈 (샷 추가) 1잔, 총 5,000원 주문이 접수되었습니다!" */}
          {/* ========================================== */}
          {confirmationMessage && (
            <div 
              id="confirmation-area"
              className="mt-6 p-4 sm:p-5 rounded-xl bg-[#e8f5e9] border border-[#c8e6c9] text-[#1b5e20] shadow-sm animate-fadeIn"
            >
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-[#2e7d32] flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold text-sm sm:text-base text-[#1b5e20] mb-1">
                    주문이 정상적으로 접수되었습니다!
                  </div>
                  <p className="text-sm sm:text-base leading-relaxed font-semibold text-[#1b5e20] bg-white/70 p-3 rounded-lg border border-[#c8e6c9]">
                    {confirmationMessage}
                  </p>
                  {formData.specialRequest && (
                    <div className="mt-2 text-xs text-[#2e7d32] bg-[#f1f8e9] p-2 rounded border border-[#dcedc8]">
                      <span className="font-bold">요청사항:</span> {formData.specialRequest}
                    </div>
                  )}
                  <p className="mt-2 text-xs text-[#388e3c]">
                    바이브 카페를 찾아주셔서 감사합니다. 주문하신 음료를 정성껏 준비하겠습니다 ☕
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* [하단 Supabase SQL 쿼리 안내 버튼] */}
          {/* 사용자가 요구한 Supabase SQL Editor용 쿼리 바로 확인 및 복사 기능 */}
          {/* ========================================== */}
          <div className="mt-8 pt-5 border-t border-[#e8ded2] text-center">
            <button
              type="button"
              onClick={() => setShowSqlModal(!showSqlModal)}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#6b4226] bg-[#f6eee3] hover:bg-[#eddcc9] py-2 px-3.5 rounded-lg border border-[#decac0] transition-colors"
            >
              <Database className="w-4 h-4 text-[#6b4226]" />
              <span>{showSqlModal ? 'Supabase SQL 쿼리 닫기' : 'Supabase SQL Editor 쿼리 보기 & 복사'}</span>
            </button>
          </div>
        </div>

        {/* ========================================== */}
        {/* [Supabase SQL 쿼리 영역 (확장 패널)] */}
        {/* ========================================== */}
        {showSqlModal && (
          <div className="bg-[#24292e] text-[#f0f6fc] p-5 border-t border-[#3e444b] text-left text-xs sm:text-sm">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#30363d]">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#3ecf8e]" />
                <span className="font-bold text-[#f0f6fc]">Supabase SQL Editor 복사용 쿼리</span>
              </div>
              <button
                type="button"
                onClick={copySqlToClipboard}
                className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded bg-[#30363d] hover:bg-[#484f58] text-[#c9d1d9] text-xs font-medium transition-colors"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-green-400 font-bold">복사 완료!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>SQL 전체 복사</span>
                  </>
                )}
              </button>
            </div>
            
            <p className="text-[11.5px] text-[#8b949e] mb-2 leading-relaxed">
              Supabase 콘솔의 <span className="text-[#58a6ff]">SQL Editor</span>에 아래 쿼리를 붙여넣고 <span className="text-[#3ecf8e] font-semibold">RUN</span>을 실행하시면 테이블 생성과 테스트 데이터 생성이 완료됩니다.
            </p>

            <pre className="p-3 bg-[#161b22] rounded-md font-mono text-[11px] sm:text-xs text-[#79c0ff] overflow-x-auto leading-relaxed border border-[#30363d] max-h-60">
              {SUPABASE_SQL_SCRIPT}
            </pre>
          </div>
        )}
      </div>

      {/* 푸터 카피라이트 */}
      <footer className="mt-6 text-center text-xs text-[#8c6b53]">
        <p>© 2026 바이브 카페 (Vibe Cafe). All rights reserved.</p>
      </footer>
    </div>
  );
}
