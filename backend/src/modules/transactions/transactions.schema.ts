export const createTransactionSchema = {
  body: {
    type: "object",
    required: ["type", "amount", "categoryId"],
    properties: {
      type: { type: "string", enum: ["INCOME", "EXPENSE"] },
      amount: { type: "number" },
      description: { type: "string" },
      date: { type: "string" },
      categoryId: { type: "string" }
    }
  }
};