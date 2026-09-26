import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  BookOpen,
  GraduationCap,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  Trophy,
  Award,
  ListOrdered,
  AlertCircle,
  HelpCircle,
  Smile
} from 'lucide-react';
import { QUESTIONS_DATA, Question } from './data/questions';

type Screen = 'welcome' | 'quiz' | 'result';

export default function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [studentName, setStudentName] = useState<string>('');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});
  const [filterType, setFilterType] = useState<'all' | 'correct' | 'wrong'>('all');
  const [showQuestionGrid, setShowQuestionGrid] = useState<boolean>(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState<boolean>(false);

  const totalQuestions = QUESTIONS_DATA.length;
  const currentQuestion: Question = QUESTIONS_DATA[currentIndex];
  const selectedAnswer = userAnswers[currentQuestion.cau];

  const answeredCount = Object.keys(userAnswers).length;
  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  const hasSentWebhook = useRef<boolean>(false);

  // Calculate score
  const correctCount = QUESTIONS_DATA.filter(
    (q) => userAnswers[q.cau] === q.dapAn
  ).length;

  // Trigger confetti and send webhook when entering result screen
  useEffect(() => {
    if (screen === 'result' && !hasSentWebhook.current) {
      hasSentWebhook.current = true;

      // Fire confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 }
          });
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 }
          });
        }, 300);
      } catch (e) {
        console.warn('Confetti error:', e);
      }

      // Send result to Google Sheet + Telegram Webhook
      const payload = {
        ten: studentName,
        lop: 'ielts',
        diem: correctCount, // số câu đúng thô, KHÔNG tự quy đổi thang 10
        tongCau: totalQuestions,
        url: typeof window !== 'undefined' ? window.location.href : ''
      };

      fetch(
        'https://script.google.com/macros/s/AKfycbw00EtPyhylfx8ZUg3o7CFvc5g44RK17byvTJqy8kMY6grcfIVpTAT7Enu9NenGnBFR/exec',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8' // TUYỆT ĐỐI KHÔNG dùng application/json để tránh CORS preflight OPTIONS
          },
          body: JSON.stringify(payload)
        }
      )
        .then((res) => {
          console.log('Webhook result sent successfully, status:', res.status);
        })
        .catch((err) => {
          console.error('Lỗi khi gửi kết quả về webhook (không ảnh hưởng học sinh):', err);
        });

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [screen, studentName, correctCount, totalQuestions]);

  const handleStartQuiz = () => {
    if (!studentName) return;
    setCurrentIndex(0);
    setUserAnswers({});
    setScreen('quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectOption = (option: 'A' | 'B' | 'C' | 'D') => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.cau]: option
    }));
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Last question - check if there are unanswered questions
      if (answeredCount < totalQuestions) {
        setShowConfirmSubmit(true);
      } else {
        handleSubmit();
      }
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = () => {
    setShowConfirmSubmit(false);
    setScreen('result');
  };

  const handleReset = () => {
    hasSentWebhook.current = false;
    setStudentName('');
    setUserAnswers({});
    setCurrentIndex(0);
    setFilterType('all');
    setShowQuestionGrid(false);
    setShowConfirmSubmit(false);
    setScreen('welcome');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getScoreMessage = (score: number) => {
    if (score >= 36) return { title: 'Xuất sắc!', desc: 'Vốn từ vựng Pre-IELTS của em rất vững vàng và chuẩn xác!', color: 'text-emerald-600', bg: 'bg-emerald-50' };
    if (score >= 28) return { title: 'Rất tốt!', desc: 'Em đã nắm vững phần lớn các từ vựng cốt lõi!', color: 'text-indigo-600', bg: 'bg-indigo-50' };
    if (score >= 20) return { title: 'Khá tốt!', desc: 'Em đã nỗ lực rất nhiều! Hãy xem lại các câu sai để nhớ sâu hơn nhé!', color: 'text-sky-600', bg: 'bg-sky-50' };
    return { title: 'Cố gắng lên nhé!', desc: 'Đừng nản lòng, hãy xem kỹ đáp án và luyện tập thêm một lần nữa nhé!', color: 'text-amber-600', bg: 'bg-amber-50' };
  };

  // --------------------------------------------------------------------------
  // SCREEN 1: CHỌN TÊN HỌC SINH
  // --------------------------------------------------------------------------
  if (screen === 'welcome') {
    return (
      <div className="min-h-screen flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8">
        <main className="max-w-md w-full mx-auto my-auto">
          {/* Card chính */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl shadow-indigo-100/50 border border-indigo-100 p-6 sm:p-8 text-center transition-all">
            {/* Logo & Icon huy hiệu */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-500 to-sky-400 text-white shadow-lg shadow-indigo-300/40 mb-5">
              <GraduationCap className="w-10 h-10 stroke-[2.2]" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold text-xs mb-3 tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              Pre-IELTS Practice
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight mb-2">
              Bài Tập Trắc Nghiệm Tiếng Anh
            </h1>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              Bộ 40 câu trắc nghiệm từ vựng tiếng Anh Pre-IELTS. Làm bài chăm chỉ và đạt điểm số thật cao nhé!
            </p>

            {/* Thông tin bài kiểm tra */}
            <div className="grid grid-cols-2 gap-3 mb-6 text-left">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-400 font-medium block">Số lượng câu</span>
                <span className="text-base font-bold text-slate-700 flex items-center gap-1 mt-0.5">
                  <BookOpen className="w-4 h-4 text-indigo-500" />
                  40 câu hỏi
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-400 font-medium block">Hình thức</span>
                <span className="text-base font-bold text-slate-700 flex items-center gap-1 mt-0.5">
                  <Award className="w-4 h-4 text-sky-500" />
                  Trắc nghiệm A/B/C/D
                </span>
              </div>
            </div>

            {/* Ô CHỌN TÊN */}
            <div className="mb-6 text-left">
              <label
                htmlFor="student-select"
                className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5"
              >
                <span>Chọn tên của em</span>
                <span className="text-rose-500">*</span>
              </label>

              <div className="relative">
                <select
                  id="student-select"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full h-13 pl-4 pr-10 text-base font-medium bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-800 rounded-2xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none appearance-none cursor-pointer"
                >
                  <option value="" disabled>
                    -- Chọn tên của em --
                  </option>
                  <option value="Đức Nam">Đức Nam</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                  <ChevronRight className="w-5 h-5 rotate-90" />
                </div>
              </div>
              {!studentName && (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 inline-block" />
                  Em vui lòng chọn tên trước khi bắt đầu nhé
                </p>
              )}
            </div>

            {/* NÚT BẮT ĐẦU */}
            <button
              type="button"
              onClick={handleStartQuiz}
              disabled={!studentName}
              className={`w-full py-4 px-6 rounded-2xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-lg ${
                studentName
                  ? 'bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white shadow-indigo-300/50 cursor-pointer active:scale-[0.98]'
                  : 'bg-slate-200 text-slate-400 shadow-none cursor-not-allowed'
              }`}
            >
              <span>Bắt đầu làm bài</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </main>

        <footer className="text-center text-xs text-slate-400 py-3">
          IELTS Academic Preparation &bull; Pre-IELTS Vocab
        </footer>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // SCREEN 2: MÀN HÌNH LÀM BÀI (40 câu)
  // --------------------------------------------------------------------------
  if (screen === 'quiz') {
    const isLastQuestion = currentIndex === totalQuestions - 1;
    const optionKeys: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];

    return (
      <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-indigo-50/50 via-sky-50/40 to-slate-100/60 pb-8">
        {/* Thanh Header trên cùng */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-indigo-100/80 shadow-xs">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            {/* Học sinh info */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-sky-400 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                {studentName.charAt(0)}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Học sinh</p>
                <p className="text-sm font-bold text-slate-800 truncate">{studentName}</p>
              </div>
            </div>

            {/* Tiến độ và Nút lưới câu hỏi */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full">
                Câu {currentIndex + 1} / {totalQuestions}
              </span>

              <button
                type="button"
                onClick={() => setShowQuestionGrid(!showQuestionGrid)}
                className={`p-2 rounded-xl text-slate-600 transition-colors border ${
                  showQuestionGrid
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                }`}
                title="Bảng câu hỏi"
              >
                <ListOrdered className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Thanh tiến trình Progress Bar */}
          <div className="w-full bg-slate-100 h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 h-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </header>

        {/* Modal / Popup Danh sách 40 câu hỏi để nhảy nhanh */}
        {showQuestionGrid && (
          <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Danh sách 40 câu hỏi</h3>
                  <p className="text-xs text-slate-500">
                    Đã làm: <span className="font-semibold text-indigo-600">{answeredCount}</span>/{totalQuestions} câu
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQuestionGrid(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Lưới 40 câu */}
              <div className="grid grid-cols-5 sm:grid-cols-8 gap-2 overflow-y-auto p-1 flex-1">
                {QUESTIONS_DATA.map((q, idx) => {
                  const hasAnswered = !!userAnswers[q.cau];
                  const isCurrent = idx === currentIndex;
                  return (
                    <button
                      key={q.cau}
                      type="button"
                      onClick={() => {
                        setCurrentIndex(idx);
                        setShowQuestionGrid(false);
                      }}
                      className={`h-10 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center ${
                        isCurrent
                          ? 'ring-2 ring-indigo-600 ring-offset-2 bg-indigo-600 text-white shadow-md'
                          : hasAnswered
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      <span>{q.cau}</span>
                      {hasAnswered && !isCurrent && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" /> Đã chọn
                  <span className="w-3 h-3 rounded bg-slate-100 border border-slate-200 ml-2" /> Chưa làm
                </div>
                <button
                  type="button"
                  onClick={() => setShowQuestionGrid(false)}
                  className="px-4 py-2 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-700"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Xác nhận nộp bài nếu còn câu chưa làm */}
        {showConfirmSubmit && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center">
              <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Chưa hoàn thành hết!</h3>
              <p className="text-sm text-slate-500 mb-6">
                Em còn <strong className="text-rose-600">{totalQuestions - answeredCount} câu</strong> chưa trả lời. Em có chắc chắn muốn nộp bài bây giờ không?
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmSubmit(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 text-sm"
                >
                  Làm tiếp
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-200"
                >
                  Vẫn nộp bài
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Nội dung câu hỏi chính */}
        <main className="max-w-2xl w-full mx-auto px-4 pt-6 flex-1 flex flex-col justify-center">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-6 sm:p-8">
            {/* Tag số câu */}
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-700 font-bold text-xs tracking-wide">
                <HelpCircle className="w-3.5 h-3.5" />
                CÂU HỎI {currentQuestion.cau} TRÊN {totalQuestions}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                Đã trả lời: {answeredCount}/{totalQuestions}
              </span>
            </div>

            {/* Đề bài tiếng Anh - GIỮ NGUYÊN VĂN */}
            <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-50 to-indigo-50/30 border border-slate-100">
              <h2 className="text-lg sm:text-xl font-bold text-slate-800 leading-relaxed font-sans">
                {currentQuestion.hoi}
              </h2>
            </div>

            {/* 4 Lựa chọn A / B / C / D */}
            <div className="space-y-3">
              {optionKeys.map((key) => {
                const isSelected = selectedAnswer === key;
                const optionText = currentQuestion[key];

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelectOption(key)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-150 flex items-center justify-between gap-3 group cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/80 shadow-md shadow-indigo-100'
                        : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50/80 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span
                        className={`w-10 h-10 rounded-xl font-bold text-sm flex items-center justify-center shrink-0 transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-700'
                        }`}
                      >
                        {key}
                      </span>
                      <span
                        className={`text-base font-semibold transition-colors ${
                          isSelected ? 'text-indigo-900 font-bold' : 'text-slate-700 group-hover:text-slate-900'
                        }`}
                      >
                        {optionText}
                      </span>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-300 group-hover:border-indigo-400'
                      }`}
                    >
                      {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </main>

        {/* Thanh Điều Hướng Dưới Cùng */}
        <footer className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 mt-6 py-3 px-4 shadow-lg">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className={`px-4 py-3 rounded-2xl font-bold text-sm flex items-center gap-1.5 transition-all ${
                currentIndex === 0
                  ? 'opacity-40 text-slate-400 cursor-not-allowed'
                  : 'text-slate-700 hover:bg-slate-100 active:scale-95 cursor-pointer'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Câu trước</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              className={`flex-1 sm:flex-initial sm:min-w-[170px] py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer ${
                isLastQuestion
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-200'
                  : 'bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white shadow-indigo-200'
              }`}
            >
              <span>{isLastQuestion ? 'Nộp bài' : 'Câu tiếp theo'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </footer>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // SCREEN 3: MÀN HÌNH KẾT QUẢ
  // --------------------------------------------------------------------------
  const scoreDetails = getScoreMessage(correctCount);
  const wrongCount = totalQuestions - correctCount;

  const filteredQuestions = QUESTIONS_DATA.filter((q) => {
    const isCorrect = userAnswers[q.cau] === q.dapAn;
    if (filterType === 'correct') return isCorrect;
    if (filterType === 'wrong') return !isCorrect;
    return true;
  });

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Card Kết Quả Điểm Số */}
        <div className="bg-white rounded-3xl shadow-xl shadow-indigo-100/60 border border-indigo-100 overflow-hidden text-center">
          <div className="bg-gradient-to-r from-indigo-600 via-sky-600 to-emerald-500 py-8 px-6 text-white relative overflow-hidden">
            {/* Hiệu ứng nền */}
            <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/10 blur-xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-white/10 blur-xl pointer-events-none" />

            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-md shadow-inner mb-3">
              <Trophy className="w-10 h-10 text-amber-300 drop-shadow-md" />
            </div>

            <p className="text-white/80 font-semibold text-sm uppercase tracking-wider mb-1">
              Kết Quả Bài Làm
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold mb-1">
              Học sinh: {studentName}
            </h1>
            <p className="text-white/90 text-sm">
              Lớp Pre-IELTS &bull; Bài tập từ vựng 40 câu
            </p>
          </div>

          <div className="p-6 sm:p-8">
            {/* Dòng chữ điểm lớn theo yêu cầu: "Em đúng X/40 câu" */}
            <div className="mb-4">
              <div className="inline-block p-4 sm:p-6 rounded-3xl bg-indigo-50/70 border border-indigo-100">
                <span className="block text-xs sm:text-sm font-bold text-indigo-500 uppercase tracking-widest mb-1">
                  Tổng điểm đạt được
                </span>
                <span className="text-3xl sm:text-5xl font-black text-indigo-700 tracking-tight">
                  Em đúng {correctCount}/{totalQuestions} câu
                </span>
              </div>
            </div>

            {/* Thông điệp khen ngợi */}
            <div className={`p-4 rounded-2xl ${scoreDetails.bg} border border-indigo-50 max-w-lg mx-auto mb-6`}>
              <h3 className={`text-lg font-bold ${scoreDetails.color} mb-1 flex items-center justify-center gap-1.5`}>
                <Smile className="w-5 h-5 inline-block" />
                {scoreDetails.title}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {scoreDetails.desc}
              </p>
            </div>

            {/* Thống kê chi tiết */}
            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto mb-6 text-center">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-400 font-medium block">Tỷ lệ đúng</span>
                <span className="text-lg font-extrabold text-slate-800">
                  {Math.round((correctCount / totalQuestions) * 100)}%
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100">
                <span className="text-xs text-emerald-600 font-medium block">Số câu đúng</span>
                <span className="text-lg font-extrabold text-emerald-700 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  {correctCount}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100">
                <span className="text-xs text-rose-600 font-medium block">Số câu sai</span>
                <span className="text-lg font-extrabold text-rose-700 flex items-center justify-center gap-1">
                  <XCircle className="w-4 h-4" />
                  {wrongCount}
                </span>
              </div>
            </div>

            {/* Nút Làm lại từ đầu */}
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center justify-center gap-2 py-3.5 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-200 transition-all active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Làm lại từ đầu</span>
            </button>
          </div>
        </div>

        {/* Khu vực xem lại chi tiết 40 câu hỏi */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Chi tiết bài làm</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Xem lại đáp án đã chọn và đáp án chính xác của từng câu hỏi
              </p>
            </div>

            {/* Bộ lọc: Tất cả / Đúng / Sai */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl self-stretch sm:self-auto">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterType === 'all'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả ({totalQuestions})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('correct')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterType === 'correct'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Đúng ({correctCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('wrong')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterType === 'wrong'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sai ({wrongCount})
              </button>
            </div>
          </div>

          {/* Danh sách các câu hỏi */}
          <div className="space-y-4">
            {filteredQuestions.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-emerald-400 stroke-1" />
                <p className="font-semibold text-sm">Không có câu hỏi nào trong mục này</p>
              </div>
            ) : (
              filteredQuestions.map((q) => {
                const studentAns = userAnswers[q.cau];
                const isCorrect = studentAns === q.dapAn;
                const optionKeys: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];

                return (
                  <div
                    key={q.cau}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                      isCorrect
                        ? 'border-emerald-200 bg-emerald-50/30'
                        : 'border-rose-200 bg-rose-50/20'
                    }`}
                  >
                    {/* Header câu hỏi: Số câu & Tích xanh / X đỏ */}
                    <div className="flex items-center justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center ${
                            isCorrect
                              ? 'bg-emerald-600 text-white'
                              : 'bg-rose-600 text-white'
                          }`}
                        >
                          {q.cau}
                        </span>
                        <span className="font-bold text-sm text-slate-800">
                          Câu {q.cau}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isCorrect ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Đúng
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold text-xs">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            Sai
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Câu hỏi tiếng Anh NGUYÊN VĂN */}
                    <p className="font-semibold text-slate-800 text-sm sm:text-base mb-3 leading-relaxed">
                      {q.hoi}
                    </p>

                    {/* 4 đáp án A, B, C, D */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                      {optionKeys.map((opt) => {
                        const isStudentChoice = studentAns === opt;
                        const isRightAnswer = q.dapAn === opt;

                        let style = 'border-slate-200 bg-white text-slate-700';
                        if (isRightAnswer) {
                          style = 'border-emerald-500 bg-emerald-100/70 text-emerald-900 font-bold';
                        } else if (isStudentChoice && !isRightAnswer) {
                          style = 'border-rose-400 bg-rose-100/70 text-rose-900 line-through font-semibold';
                        }

                        return (
                          <div
                            key={opt}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${style}`}
                          >
                            <span className="truncate">
                              <strong className="mr-1.5 font-bold">{opt}.</strong>
                              {q[opt]}
                            </span>
                            {isRightAnswer && (
                              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-600 text-white shrink-0">
                                Đáp án đúng
                              </span>
                            )}
                            {isStudentChoice && !isRightAnswer && (
                              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-rose-600 text-white shrink-0">
                                Em đã chọn
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Tóm tắt đáp án em chọn và đáp án đúng */}
                    <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-slate-600">
                        Em đã chọn:{' '}
                        <strong
                          className={
                            isCorrect ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'
                          }
                        >
                          {studentAns ? `${studentAns} (${q[studentAns]})` : 'Chưa chọn'}
                        </strong>
                      </span>
                      {!isCorrect && (
                        <span className="text-emerald-700 font-semibold">
                          Đáp án đúng: <strong className="font-bold">{q.dapAn} ({q[q.dapAn]})</strong>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Nút Làm lại từ đầu ở cuối danh sách */}
          <div className="text-center pt-8">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Làm lại từ đầu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
