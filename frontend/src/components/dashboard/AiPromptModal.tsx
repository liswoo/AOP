/**
 * AI 프롬프트 모달 컴포넌트
 * 
 * 대시보드 카드에서 AI 분석을 요청할 때 사용하는 모달입니다.
 * 
 * 현재 상태:
 * - UI만 구현되어 있으며, 실제 LLM API 호출은 아직 연결되지 않았습니다.
 * - 사용자가 질문을 입력하고 "요청" 버튼을 클릭하면 console.log로 출력합니다.
 * 
 * 향후 작업:
 * - TODO: 여기에서 실제 LLM API를 호출하도록 구현
 * - 예: OpenAI API, Claude API, 또는 자체 LLM 서버와 연동
 * 
 * 사용 예시:
 * <AiPromptModal
 *   open={isOpen}
 *   title="주요 손익"
 *   onClose={() => setIsOpen(false)}
 * />
 */

import React, { useState, useEffect, useRef } from 'react';

interface AiPromptModalProps {
  open: boolean;
  title?: string;
  onClose: () => void;
}

const AiPromptModal: React.FC<AiPromptModalProps> = ({
  open,
  title = '대시보드',
  onClose,
}) => {
  const [question, setQuestion] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 모달이 열릴 때 textarea에 포커스
  useEffect(() => {
    if (open && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // 모달이 닫힐 때 질문 초기화
  useEffect(() => {
    if (!open) {
      setQuestion('');
    }
  }, [open]);

  // 요청 버튼 클릭 핸들러
  const handleSubmit = () => {
    if (!question.trim()) {
      alert('질문을 입력해주세요.');
      return;
    }

    // TODO: 여기에서 실제 LLM API를 호출하도록 구현
    // 예시:
    // const response = await aiApi.askQuestion({
    //   cardTitle: title,
    //   question: question,
    //   context: currentDashboardData
    // });
    
    console.log('AI 분석 요청:', {
      cardTitle: title,
      question: question,
      timestamp: new Date().toISOString(),
    });

    // 임시로 성공 메시지 표시
    alert('AI 분석 요청이 전송되었습니다. (현재는 콘솔에만 출력됩니다)');
    
    // 질문 초기화 및 모달 닫기
    setQuestion('');
    onClose();
  };

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Overlay (배경 어둡게) */}
      <div style={styles.overlay} onClick={onClose} />

      {/* 모달 카드 */}
      <div style={styles.modal}>
        {/* 헤더 */}
        <div style={styles.header}>
          <h2 style={styles.headerTitle}>
            {title} - AI 분석 요청
          </h2>
          <button
            onClick={onClose}
            style={styles.closeButton}
            title="닫기"
          >
            ×
          </button>
        </div>

        {/* 본문 */}
        <div style={styles.body}>
          <label style={styles.label}>
            질문을 입력해주세요:
          </label>
          <textarea
            ref={textareaRef}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="예: 이번 달 매출이 전월 대비 얼마나 증가했나요?"
            style={styles.textarea}
            rows={6}
            onKeyDown={(e) => {
              // Ctrl+Enter 또는 Cmd+Enter로 제출
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                handleSubmit();
              }
            }}
          />
        </div>

        {/* 푸터 (버튼) */}
        <div style={styles.footer}>
          <button
            onClick={handleSubmit}
            style={styles.submitButton}
            disabled={!question.trim()}
          >
            요청
          </button>
          <button
            onClick={onClose}
            style={styles.cancelButton}
          >
            닫기
          </button>
        </div>
      </div>
    </>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '90vh',
    zIndex: 1001,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #f0f0f0',
  },
  headerTitle: {
    margin: 0,
    fontSize: '1.3rem',
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '2rem',
    color: '#999',
    cursor: 'pointer',
    padding: 0,
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  },
  body: {
    padding: '24px',
    flex: 1,
    overflow: 'auto',
  },
  label: {
    display: 'block',
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#333',
    marginBottom: '8px',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '1rem',
    fontFamily: 'inherit',
    resize: 'vertical',
    minHeight: '120px',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '20px 24px',
    borderTop: '1px solid #f0f0f0',
  },
  submitButton: {
    padding: '10px 24px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  cancelButton: {
    padding: '10px 24px',
    backgroundColor: '#f5f5f5',
    color: '#333',
    border: 'none',
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
};

export default AiPromptModal;

