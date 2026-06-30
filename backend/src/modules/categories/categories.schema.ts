export const createCategorySchema = {
  body: {
    type: "object",
    required: ["name", "type"],
    properties: {
      name: { type: "string" },
      type: { type: "string", enum: ["INCOME", "EXPENSE"] }
    }
  }
};