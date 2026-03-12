import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { RolesGuard } from './roles.guard.js';
import { ROLES_KEY } from '../decorators/index.js';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: { getAllAndOverride: jest.Mock };

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  // Helper: tạo mock ExecutionContext với user và required roles
  const createContext = (user: any): ExecutionContext => ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({ user }),
    }),
  } as any);

  it('should allow access when no roles required (no @Roles decorator)', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createContext({ id: 'user-1', role: UserRole.USER });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when roles array is empty', () => {
    reflector.getAllAndOverride.mockReturnValue([]);
    const context = createContext({ id: 'user-1', role: UserRole.USER });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when user has required role (ADMIN)', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    const context = createContext({ id: 'admin-1', role: UserRole.ADMIN });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access when user role does not match', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    const context = createContext({ id: 'user-1', role: UserRole.USER });

    expect(guard.canActivate(context)).toBe(false);
  });

  it('should deny access when req.user is undefined', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    const context = createContext(undefined);

    expect(guard.canActivate(context)).toBe(false);
  });

  it('should use ROLES_KEY when reading metadata', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.USER]);
    const context = createContext({ role: UserRole.USER });

    guard.canActivate(context);

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
      ROLES_KEY,
      expect.any(Array),
    );
  });
});
