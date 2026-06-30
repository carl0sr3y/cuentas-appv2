export const registerSchema = {
  body: {
    type: "object",
    required: ["name", "email", "password"],
    properties: {
      name: { type: "string" },
      email: { type: "string", format: "email" },
      password: { type: "string", minLength: 6 },
      role: { type: "string", enum: ["ADMIN", "MANAGER", "EMPLOYEE"] }
    }
  }
};

export const loginSchema = {
  body: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: { type: "string", format: "email" },
      password: { type: "string" }
    }
  }
};