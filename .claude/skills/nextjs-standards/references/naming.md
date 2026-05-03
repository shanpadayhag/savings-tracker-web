# Naming Conventions — Next.js Standards

The rule: **names explain intent, not implementation**.

A name should answer: *"What does this do for the caller?"* — not *"How does it work inside?"*

---

## Universal Anti-patterns (never use these)

| Bad | Why | Fix |
|-----|-----|-----|
| `data` | What data? | `userProfile`, `orderPage`, `productList` |
| `result` | Result of what? | `createdOrder`, `validatedInput`, `fetchedUser` |
| `item` | Item of what? | `cartItem`, `menuOption`, `searchResult` |
| `obj` / `temp` / `val` | Meaningless | Name by what it holds |
| `handleClick` | Which click does what? | `handleAddToCart`, `handleDeleteComment` |
| `getData` / `fetchData` | Fetch what? | `fetchOrderById`, `fetchActiveProducts` |
| `process` / `doStuff` | What processing? | `parseFormData`, `computeOrderTotal` |
| `flag` / `bool` | Flag for what? | `isSubmitting`, `hasValidationError` |
| `arr` / `list` | List of what? | `filteredProducts`, `pendingOrders` |

---

## Naming by Layer

### Server — functions

| Purpose | Prefix | Full Example |
|---------|--------|--------------|
| Read one record | `fetch…By…` | `fetchUserByEmail`, `fetchOrderById` |
| Read many records | `fetch…Page`, `fetch…List` | `fetchProductPage`, `fetchActiveUserList` |
| Count records | `count…` | `countUserOrders`, `countActiveProducts` |
| Create record | `persist…`, `create…` | `persistOrder`, `createUserAccount` |
| Update record | `update…` | `updateUserEmail`, `updateOrderStatus` |
| Delete record | `delete…By…` | `deleteCommentById`, `deleteExpiredSessions` |
| Send notification | `send…` | `sendOrderConfirmationEmail`, `sendSlackAlert` |
| Parse raw input | `parse…` | `parseCommentFormData`, `parseQueryParams` |
| Validate input | `validate…` | `validateCreateOrderInput`, `validateUserAge` |

### Server — route handlers & actions

```ts
// Route handlers use HTTP verb conventions (Next.js)
export async function GET() { ... }
export async function POST() { ... }

// Server actions: verb + entity + "Action"
export async function createOrderAction(...) { ... }
export async function deleteCommentAction(...) { ... }
```

### Client — components

- Always `PascalCase`.
- Name by **what it renders**, not how it's implemented.
- Container vs. presentational: `ProductListPage` (container) vs. `ProductCard` (presentational).

```tsx
// ✅
ProductCard         // renders a single product
OrderSummaryPanel   // panel showing order totals
CheckoutHeader      // page header for checkout
EmptyCartMessage    // empty-state component

// ❌
ProductContainer    // "container" is an impl detail
DataCard            // data of what?
MyComponent         // placeholder name left in
```

### Client — hooks

Always `use` prefix. Name by **what state or behaviour it provides**.

```ts
useProductDetails(id)    // provides product + loading + error
useCartActions()         // provides addItem, removeItem, clearCart
useFormField(name)       // provides value, onChange, error for one field
usePaginatedOrders()     // provides orders + nextPage + hasMore
```

### Client — event handlers

`handle` + **entity** (optional) + **action**.

```ts
handleAddToCart         // adds item to cart
handleFormSubmit        // submits the form
handleModalClose        // closes the modal
handleRowSelect(id)     // selects a row by id
handlePageChange(page)  // navigates to a new page
```

### Client — boolean state / derived booleans

Prefix with `is`, `has`, `can`, or `should`.

```ts
isLoading           // async operation in progress
isSubmitting        // form being submitted
hasValidationError  // form has at least one error
canSubmit           // derived: form is valid and not submitting
isModalOpen         // modal visibility
hasNextPage         // pagination: more pages exist
```

### Client — derived / computed values

Noun describing the result. No verb prefix.

```ts
sortedProducts      // products sorted by price
filteredOrders      // orders after status filter applied
totalCartPrice      // sum of all cart items
activeFilters       // currently applied filter set
formattedDate       // date string after formatting
```

---

## Checklist Before Committing a Name

- [ ] Does the name tell me **what it does for me** without reading the implementation?
- [ ] Could I replace the name with a synonym and lose meaning? (If yes, the name is too generic.)
- [ ] Does it follow the prefix convention for its layer (`fetch`, `persist`, `handle`, `use`, `is…`)?
- [ ] Is it free of implementation details (`Array`, `Object`, `Map`, `Hook`, `Component` suffixes)?
- [ ] Is it specific enough that two different things couldn't share this name?
