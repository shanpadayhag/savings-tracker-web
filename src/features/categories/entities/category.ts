// Category entity.
// Categories are a global concept (not currency-scoped) that classifies a
// transaction's purpose — e.g., Groceries, Restaurants, Transport.
//
// `isSystem` flags the seeded "Others" row, which is the catch-all for
// transactions that have no categoryID assigned (existing rows from before
// the feature, plus any new transaction the user submits without picking
// a category). The system row cannot be renamed or deleted.

type Category = {
  id: string;
  name: string;
  /** Color used to tint this category in lists, charts, and badges. */
  color: string;
  /** True for the seeded "Others" catch-all. Cannot be renamed or deleted. */
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | "null";
};

export default Category;
