import { User } from "../../src/models/user.model.js";

export const createTestUser = async (overrides = {}) => {
  const password = overrides.password ?? "Test@1234";

  const user = await User.create({
    userName: "testuser",
    email: "testuser@example.com",
    fullName: "Test User",
    avatar: "https://example.com/avatar.png",
    avatarPublicId: "test-avatar", 
    coverImage: "https://example.com/cover.png",
    ...overrides,
    password,
  });

  return { user, password };
};