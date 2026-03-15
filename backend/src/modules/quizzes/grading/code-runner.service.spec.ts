import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { CodeRunnerService } from './code-runner.service.js';

describe('CodeRunnerService', () => {
  let service: CodeRunnerService;
  let configService: { get: jest.Mock };
  let fetchMock: jest.Mock;

  const createJudge0Response = ({
    stdout = null,
    stderr = null,
    compile_output = null,
    status = { id: 3, description: 'Accepted' },
  }: {
    stdout?: string | null;
    stderr?: string | null;
    compile_output?: string | null;
    status?: { id: number; description: string };
  }) => ({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: jest.fn().mockResolvedValue({
      stdout,
      stderr,
      compile_output,
      status,
      time: '0.01',
      memory: 1024,
    }),
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    configService = {
      get: jest.fn((key: string, defaultValue?: string) => {
        const values: Record<string, string | undefined> = {
          JUDGE0_API_URL: 'https://ce.judge0.com',
          JUDGE0_API_KEY: undefined,
        };
        return values[key] ?? defaultValue;
      }),
    };

    fetchMock = jest.fn();
    (global as any).fetch = fetchMock;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CodeRunnerService,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<CodeRunnerService>(CodeRunnerService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return passed=true when all test cases pass', async () => {
    fetchMock
      .mockResolvedValueOnce(
        createJudge0Response({
          stdout: '3\n',
          status: { id: 3, description: 'Accepted' },
        }),
      )
      .mockResolvedValueOnce(
        createJudge0Response({
          stdout: '12\n',
          status: { id: 3, description: 'Accepted' },
        }),
      );

    const result = await service.runCode(
      'function add(a, b) { return a + b; }',
      [
        { input: '1 2', expected: '3' },
        { input: '5 7', expected: '12' },
      ],
      'javascript',
    );

    expect(result).toEqual({
      passed: true,
      results: [
        {
          input: '1 2',
          expected: '3',
          actual: '3',
          passed: true,
          isHidden: false,
          error: undefined,
        },
        {
          input: '5 7',
          expected: '12',
          actual: '12',
          passed: true,
          isHidden: false,
          error: undefined,
        },
      ],
      totalPassed: 2,
      totalTests: 2,
    });
  });

  it('should return passed=false and correct totalPassed when some test cases fail with Wrong Answer', async () => {
    fetchMock
      .mockResolvedValueOnce(
        createJudge0Response({
          stdout: '3\n',
          status: { id: 3, description: 'Accepted' },
        }),
      )
      .mockResolvedValueOnce(
        createJudge0Response({
          stdout: '4\n',
          status: { id: 4, description: 'Wrong Answer' },
        }),
      );

    const result = await service.runCode(
      'function add(a, b) { return a + b; }',
      [
        { input: '1 2', expected: '3' },
        { input: '2 2', expected: '5' },
      ],
      'javascript',
    );

    expect(result.passed).toBe(false);
    expect(result.totalPassed).toBe(1);
    expect(result.totalTests).toBe(2);
    expect(result.results[1]).toEqual({
      input: '2 2',
      expected: '5',
      actual: '4',
      passed: false,
      isHidden: false,
      error: undefined,
    });
  });

  it('should return compilationError and mark all tests failed when Judge0 reports compilation error', async () => {
    fetchMock
      .mockResolvedValueOnce(
        createJudge0Response({
          compile_output: 'SyntaxError: Unexpected token',
          status: { id: 6, description: 'Compilation Error' },
        }),
      )
      .mockResolvedValueOnce(
        createJudge0Response({
          compile_output: 'SyntaxError: Unexpected token',
          status: { id: 6, description: 'Compilation Error' },
        }),
      );

    const result = await service.runCode(
      'function add(a, b) { return a + ; }',
      [
        { input: '1 2', expected: '3' },
        { input: '5 7', expected: '12', isHidden: true },
      ],
      'javascript',
    );

    expect(result).toEqual({
      passed: false,
      results: [
        {
          input: '1 2',
          expected: '3',
          actual: '',
          passed: false,
          isHidden: false,
        },
        {
          input: '[hidden]',
          expected: '[hidden]',
          actual: '[hidden]',
          passed: false,
          isHidden: true,
        },
      ],
      totalPassed: 0,
      totalTests: 2,
      compilationError: 'SyntaxError: Unexpected token',
    });
  });

  it('should handle per-test Judge0 network errors via Promise.allSettled and return passed=false', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));

    const result = await service.runCode(
      'function add(a, b) { return a + b; }',
      [{ input: '1 2', expected: '3' }],
      'javascript',
    );

    expect(result.passed).toBe(false);
    expect(result.totalPassed).toBe(0);
    expect(result.totalTests).toBe(1);
    expect(result.results).toEqual([
      {
        input: '1 2',
        expected: '3',
        actual: '',
        passed: false,
        isHidden: false,
        error: 'network down',
      },
    ]);
    expect(result.compilationError).toBeUndefined();
  });

  it('should return service unavailable fallback when top-level execution fails', async () => {
    fetchMock.mockResolvedValue(
      createJudge0Response({
        stdout: '3\n',
        status: { id: 3, description: 'Accepted' },
      }),
    );

    const allSettledSpy = jest
      .spyOn(Promise, 'allSettled')
      .mockRejectedValueOnce(new Error('Judge0 unavailable'));

    const result = await service.runCode(
      'function add(a, b) { return a + b; }',
      [{ input: '1 2', expected: '3' }],
      'javascript',
    );

    expect(result).toEqual({
      passed: false,
      results: [],
      totalPassed: 0,
      totalTests: 1,
      compilationError: 'Code execution service unavailable',
    });

    allSettledSpy.mockRestore();
  });

  it('should mask input, expected, and actual for hidden test cases when they fail', async () => {
    fetchMock.mockResolvedValue(
      createJudge0Response({
        stdout: 'wrong-secret-output\n',
        status: { id: 4, description: 'Wrong Answer' },
      }),
    );

    const result = await service.runCode(
      'function solution() { return "wrong"; }',
      [{ input: 'secret-input', expected: 'secret-output', isHidden: true }],
      'javascript',
    );

    expect(result.results[0]).toEqual({
      input: '[hidden]',
      expected: '[hidden]',
      actual: '[hidden]',
      passed: false,
      isHidden: true,
      error: undefined,
    });
  });

  it('should keep actual masked as [hidden] when a hidden test passes', async () => {
    fetchMock.mockResolvedValue(
      createJudge0Response({
        stdout: '42\n',
        status: { id: 3, description: 'Accepted' },
      }),
    );

    const result = await service.runCode(
      'function answer() { return 42; }',
      [{ input: 'hidden-input', expected: '42', isHidden: true }],
      'javascript',
    );

    expect(result.results[0]).toEqual({
      input: '[hidden]',
      expected: '[hidden]',
      actual: '[hidden]',
      passed: true,
      isHidden: true,
      error: undefined,
    });
  });

  it('should map python to Judge0 language ID 92', async () => {
    fetchMock.mockResolvedValue(
      createJudge0Response({
        stdout: '3\n',
        status: { id: 3, description: 'Accepted' },
      }),
    );

    await service.runCode(
      'print(1 + 2)',
      [{ input: '', expected: '3' }],
      'python',
    );

    const requestOptions = fetchMock.mock.calls[0][1] as {
      body: string;
    };
    const requestBody = JSON.parse(requestOptions.body);

    expect(requestBody.language_id).toBe(92);
  });

  it('should map javascript to Judge0 language ID 93', async () => {
    fetchMock.mockResolvedValue(
      createJudge0Response({
        stdout: '3\n',
        status: { id: 3, description: 'Accepted' },
      }),
    );

    await service.runCode(
      'console.log(1 + 2)',
      [{ input: '', expected: '3' }],
      'javascript',
    );

    const requestOptions = fetchMock.mock.calls[0][1] as {
      body: string;
    };
    const requestBody = JSON.parse(requestOptions.body);

    expect(requestBody.language_id).toBe(93);
  });
});
