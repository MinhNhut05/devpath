// code-runner.service.ts - Code execution via Judge0 API
//
// Service chạy code challenges và verify test cases.
// Sử dụng Judge0 API (self-hosted hoặc cloud) để execute user code.
//
// Tại sao tách thành service riêng?
// → Single Responsibility: QuizzesService lo orchestration, CodeRunnerService lo execution
// → Security: NEVER eval() user code trực tiếp — luôn dùng sandboxed environment (Judge0)
// → Dễ test: mock CodeRunnerService trong unit tests
// → Dễ thay đổi: switch execution engine mà không ảnh hưởng quiz logic

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// ── Interfaces ────────────────────────────────────────────────────────────────

/**
 * Một test case để verify user code.
 * isHidden: true → không expose input/expected/actual trong response
 * (dùng cho "hidden test cases" mà user không được biết trước)
 */
interface TestCase {
  input: string;
  expected: string;
  isHidden?: boolean;
}

/**
 * Kết quả của một test case sau khi execute.
 * Nếu isHidden = true → input/expected/actual được mask thành '[hidden]'
 * để tránh leak "hidden test logic" cho user.
 */
interface TestResult {
  input: string;     // '[hidden]' nếu isHidden
  expected: string;  // '[hidden]' nếu isHidden
  actual: string;    // '[hidden]' nếu isHidden và failed
  passed: boolean;
  isHidden: boolean;
  error?: string;    // Runtime error message (nếu có)
}

/**
 * Kết quả tổng hợp sau khi chạy toàn bộ test cases.
 * Export để QuizzesService có thể dùng làm return type.
 */
export interface RunCodeResult {
  passed: boolean;           // true nếu TẤT CẢ test cases pass
  results: TestResult[];     // Chi tiết từng test case
  totalPassed: number;
  totalTests: number;
  compilationError?: string; // Có nếu code lỗi compile
}

/**
 * Response từ Judge0 API sau khi execute code.
 * Ref: https://ce.judge0.com/#submissions-submission-post
 */
interface Judge0Response {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  status: {
    id: number;
    description: string;
  };
  time: string | null;
  memory: number | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

/**
 * Map tên ngôn ngữ → Judge0 language ID.
 *
 * Judge0 language IDs: https://ce.judge0.com/languages
 * Chỉ support các ngôn ngữ phổ biến trong DevPath curriculum.
 */
const LANGUAGE_MAP: Record<string, number> = {
  javascript: 93, // Node.js 18.15.0
  python: 92,     // Python 3.11.2
  typescript: 94, // TypeScript 5.0.3
  java: 91,       // Java 17.0.6
  cpp: 54,        // C++ (GCC 9.2.0)
};

/**
 * Judge0 status IDs — chỉ dùng các ID quan trọng.
 *
 * id=3  → Accepted (pass)
 * id=4  → Wrong Answer
 * id=5  → Time Limit Exceeded
 * id=6  → Compilation Error
 * id≥7  → Runtime Error variants
 */
const JUDGE0_STATUS = {
  ACCEPTED: 3,
  COMPILATION_ERROR: 6,
} as const;

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class CodeRunnerService {
  private readonly logger = new Logger(CodeRunnerService.name);

  /**
   * Base URL của Judge0 API.
   * Default: https://ce.judge0.com (free hosted, có rate limit)
   * Recommendation: dùng Docker self-host cho dev nếu test nhiều lần.
   */
  private readonly judgeUrl: string;

  /**
   * API key cho Judge0 RapidAPI hosted (optional).
   * Không cần nếu dùng self-hosted instance.
   */
  private readonly apiKey: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.judgeUrl = this.configService.get<string>(
      'JUDGE0_API_URL',
      'https://ce.judge0.com',
    );
    this.apiKey = this.configService.get<string>('JUDGE0_API_KEY');
  }

  // ── Public: runCode ──────────────────────────────────────────────────────────

  /**
   * Chạy user code và verify qua tất cả test cases.
   *
   * Flow:
   * 1. Resolve language ID từ LANGUAGE_MAP
   * 2. Chạy song song tất cả test cases qua Judge0 (Promise.allSettled)
   * 3. Nếu có compilation error → return early (tất cả failed)
   * 4. Parse kết quả từng test case, mask hidden tests
   * 5. Return RunCodeResult tổng hợp
   *
   * @param code     - Source code từ user
   * @param testCases - Array of { input, expected, isHidden? }
   * @param language - Ngôn ngữ lập trình (default: 'javascript')
   */
  async runCode(
    code: string,
    testCases: TestCase[],
    language?: string,
  ): Promise<RunCodeResult> {
    try {
      // 1. Resolve language ID — fallback về JavaScript nếu không tìm thấy
      const langKey = (language ?? 'javascript').toLowerCase();
      const languageId = LANGUAGE_MAP[langKey] ?? LANGUAGE_MAP['javascript'];

      this.logger.debug(
        `Running code: lang=${langKey} (id=${languageId}), tests=${testCases.length}`,
      );

      // 2. Submit toàn bộ test cases song song
      // Promise.allSettled: không throw nếu một test case fail,
      // cho phép collect đủ kết quả tất cả tests
      const settled = await Promise.allSettled(
        testCases.map((tc) => this.submitToJudge0(code, languageId, tc)),
      );

      // 3. Compilation error check — nếu bất kỳ submission nào báo compile error
      // → stop sớm, không cần check tiếp (toàn bộ test cases đều fail)
      const compilationResult = settled.find(
        (r) =>
          r.status === 'fulfilled' &&
          r.value.status.id === JUDGE0_STATUS.COMPILATION_ERROR,
      );

      if (compilationResult && compilationResult.status === 'fulfilled') {
        const compileOutput =
          compilationResult.value.compile_output ?? 'Compilation failed';

        this.logger.debug(`Compilation error detected: ${compileOutput}`);

        return {
          passed: false,
          results: testCases.map((tc) => ({
            input: tc.isHidden ? '[hidden]' : tc.input,
            expected: tc.isHidden ? '[hidden]' : tc.expected,
            actual: tc.isHidden ? '[hidden]' : '',
            passed: false,
            isHidden: tc.isHidden ?? false,
          })),
          totalPassed: 0,
          totalTests: testCases.length,
          compilationError: compileOutput,
        };
      }

      // 4. Parse từng settled result → build TestResult[]
      const results: TestResult[] = settled.map((settledResult, index) => {
        const tc = testCases[index];
        const isHidden = tc.isHidden ?? false;

        // Promise bị reject (network error, timeout, etc.)
        if (settledResult.status === 'rejected') {
          const errorMsg =
            settledResult.reason instanceof Error
              ? settledResult.reason.message
              : String(settledResult.reason);

          return {
            input: isHidden ? '[hidden]' : tc.input,
            expected: isHidden ? '[hidden]' : tc.expected,
            actual: isHidden ? '[hidden]' : '',
            passed: false,
            isHidden,
            error: errorMsg,
          };
        }

        // Promise fulfilled — check Judge0 status
        const judge0 = settledResult.value;
        const passed = judge0.status.id === JUDGE0_STATUS.ACCEPTED;

        // stdout là actual output của code (trimmed để tránh trailing newline)
        const actualOutput = (judge0.stdout ?? '').trim();

        // Runtime error message (stderr hoặc status description)
        const runtimeError =
          !passed && judge0.status.id !== 4 // 4 = Wrong Answer (không cần show error)
            ? (judge0.stderr ?? judge0.status.description ?? undefined)
            : undefined;

        return {
          input: isHidden ? '[hidden]' : tc.input,
          expected: isHidden ? '[hidden]' : tc.expected,
          // Hidden + failed → mask actual (leak thông tin qua output)
          // Hidden + passed → '[hidden]' (không cần show output)
          actual: isHidden ? '[hidden]' : actualOutput,
          passed,
          isHidden,
          // Mask error cho hidden tests: stderr có thể chứa stdin (hidden input)
          // Ví dụ: `print(sys.stdin.read(), file=sys.stderr)` → leak hidden input
          error: isHidden ? (runtimeError ? '[hidden]' : undefined) : runtimeError,
        };
      });

      // 5. Tổng hợp kết quả
      const totalPassed = results.filter((r) => r.passed).length;
      const allPassed = totalPassed === testCases.length;

      this.logger.debug(
        `Code run complete: ${totalPassed}/${testCases.length} passed`,
      );

      return {
        passed: allPassed,
        results,
        totalPassed,
        totalTests: testCases.length,
      };
    } catch (error: unknown) {
      // Unexpected error (không phải per-test failure) — Judge0 unavailable, etc.
      const errorMsg =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Judge0 unavailable: ${errorMsg}`, error);

      return {
        passed: false,
        results: [],
        totalPassed: 0,
        totalTests: testCases.length,
        compilationError: 'Code execution service unavailable',
      };
    }
  }

  // ── Private: submitToJudge0 ──────────────────────────────────────────────────

  /**
   * Submit một test case lên Judge0 và chờ kết quả (synchronous mode).
   *
   * Sử dụng `?wait=true` → Judge0 execute ngay và trả response trong cùng 1 request.
   * Không cần polling (GET /submissions/:token) → đơn giản hơn cho use case này.
   *
   * @throws Error nếu HTTP response không OK hoặc timeout 15s
   */
  private async submitToJudge0(
    code: string,
    languageId: number,
    testCase: TestCase,
  ): Promise<Judge0Response> {
    const url = `${this.judgeUrl}/submissions?base64_encoded=false&wait=true`;

    // Request body theo Judge0 submission spec
    const body = {
      source_code: code,
      language_id: languageId,
      stdin: testCase.input,
      expected_output: testCase.expected,
      cpu_time_limit: 5,        // Max 5 giây CPU time
      memory_limit: 128_000,    // Max 128MB memory (KB unit)
    };

    // Build headers — X-RapidAPI-Key chỉ dùng cho RapidAPI hosted Judge0
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      // RapidAPI hosted Judge0 dùng header này để auth
      headers['X-RapidAPI-Key'] = this.apiKey;
      headers['X-RapidAPI-Host'] = 'judge0-ce.p.rapidapi.com';
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        // AbortSignal.timeout: tự cancel request sau 15s
        // Native Node 18+ API — không cần AbortController thủ công
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) {
        throw new Error(
          `Judge0 returned HTTP ${response.status}: ${response.statusText}`,
        );
      }

      return (await response.json()) as Judge0Response;
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Judge0 submission failed: ${errorMsg}`);
      // Re-throw để Promise.allSettled catch thành 'rejected'
      throw error;
    }
  }
}
