import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SessionsService } from './sessions.service';
import { UserSession } from './entities/user-session.entity';

describe('SessionsService', () => {
  let service: SessionsService;
  const mockRepo = {
    save: jest.fn(),
    create: jest.fn((data) => data),
    findOne: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        SessionsService,
        { provide: getRepositoryToken(UserSession), useValue: mockRepo },
      ],
    }).compile();
    service = module.get(SessionsService);
    jest.clearAllMocks();
  });

  it('creates a session and returns the session id', async () => {
    mockRepo.save.mockResolvedValue({ id: 'sess-1' });
    const result = await service.createSession({
      userId: 'u1',
      organizationId: 'o1',
      refreshToken: 'raw-token',
      deviceInfo: {},
      ipAddress: '127.0.0.1',
      expiresAt: new Date(),
    });
    expect(result).toBe('sess-1');
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
  });

  it('invalidates all sessions for a user', async () => {
    mockRepo.delete.mockResolvedValue({ affected: 3 });
    await service.invalidateAllSessions('u1');
    expect(mockRepo.delete).toHaveBeenCalledWith({ userId: 'u1' });
  });
});
