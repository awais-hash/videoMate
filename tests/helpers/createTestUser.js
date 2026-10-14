import { User } from "../../src/models/user.model.js";

export const createTestUser = async (overrides = {}) => {
  const password = overrides.password ?? "Test@1234";

  const user = await User.create({
    userName: "testuser",
    email: "testuser@example.com",
    fullName: "Test User",
    avatar: {
      url: "https://example.com/avatar.png",
      public_id: "test-avatar",
    },
    coverImage: {
      url: "https://example.com/cover.png",
      public_id: "",
    },
    ...overrides,
    password,
  });

  return { user, password };
};