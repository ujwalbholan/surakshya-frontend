export type TokenPayloadType = {
  sub: string;
  email: string;
  full_name: string;
  sessionId: string;
  role: string;
  type: 'access' | 'refresh';
};

export type UserTokenType = {
  id: string;
  email: string;
  full_name: string;
  role: string;
};
