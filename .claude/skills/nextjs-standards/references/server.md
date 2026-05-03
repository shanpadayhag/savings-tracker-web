# Server-Side Standards (Next.js)

Applies to: API routes (`app/api/**/route.ts`), server actions (`"use server"`), middleware, Server Components fetching data.

---

## 1. Memory-Efficient Data Access

### Pagination — always cursor-based, never offset
```ts
// ✅ Cursor pagination — O(1) seek, no full scan
async function fetchUserOrders(userId: string, afterCursor?: string, limit = 20) {
  return db.order.findMany({
    where: { userId },
    take: limit + 1,           // fetch one extra to detect next page
    ...(afterCursor && { cursor: { id: afterCursor }, skip: 1 }),
    orderBy: { createdAt: 'desc' },
    select: { id: true, total: true, createdAt: true }, // explicit columns only
  });
}

// ❌ Offset pagination — full table scan grows with page number
await db.order.findMany({ skip: page * 20, take: 20 });
```

### Stream large responses, don't buffer
```ts
// ✅ Stream to avoid holding entire result in memory
export async function GET() {
  const stream = new ReadableStream({ /* ... */ });
  return new Response(stream, { headers: { 'Content-Type': 'text/plain' } });
}
```

### Select only needed columns
```ts
// ✅ Explicit projection
const user = await db.user.findUnique({
  where: { id },
  select: { id: true, email: true, role: true },
});

// ❌ Over-fetches; loads password hash, avatar blob, etc. into memory
const user = await db.user.findUnique({ where: { id } });
```

---

## 2. Single Responsibility — One Action per Handler

Each route handler or server action does **one thing**. Decompose into named helpers.

```ts
// ✅ Route handler delegates to named helpers
export async function POST(req: Request) {
  const body = await parseCreateOrderBody(req);
  const validatedOrder = validateOrderInput(body);
  const savedOrder = await persistOrder(validatedOrder);
  return Response.json(savedOrder, { status: 201 });
}

async function parseCreateOrderBody(req: Request): Promise<unknown> { /* ... */ }
function validateOrderInput(raw: unknown): CreateOrderInput { /* ... */ }
async function persistOrder(input: CreateOrderInput): Promise<Order> { /* ... */ }
```

```ts
// ❌ Monolithic handler — multiple concerns, impossible to test in isolation
export async function POST(req: Request) {
  const body = await req.json();
  if (!body.items || body.items.length === 0) { /* ... */ }
  const userId = body.userId;
  const total = body.items.reduce(...);
  const order = await db.order.create({ data: { userId, total, items: { ... } } });
  await sendEmail(order);
  return Response.json(order);
}
```

---

## 3. Server Actions — Thin and Validated

```ts
'use server';

// ✅ Validate input at the boundary; action just orchestrates
export async function createCommentAction(formData: FormData) {
  const input = parseCommentFormData(formData);   // parse
  const validated = validateCommentInput(input);   // validate + throw on error
  return persistComment(validated);                // one side effect
}

function parseCommentFormData(formData: FormData): RawCommentInput { /* ... */ }
function validateCommentInput(raw: RawCommentInput): ValidCommentInput { /* ... */ }
async function persistComment(input: ValidCommentInput): Promise<Comment> { /* ... */ }
```

---

## 4. Resource-Efficient Patterns

### Avoid redundant fetches — fetch once, derive
```ts
// ✅ Single query, derive what you need
const [user, orderCount] = await Promise.all([
  fetchUserById(id),
  countUserOrders(id),
]);

// ❌ Three round-trips for data that could be one
const user = await fetchUserById(id);
const orders = await fetchAllUserOrders(id);   // fetches full rows
const orderCount = orders.length;              // only needed the count
```

### Early-return to avoid nested branches
```ts
// ✅ Guard clauses keep the happy path flat
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  if (!id) return Response.json({ error: 'Missing id' }, { status: 400 });

  const product = await fetchProductById(id);
  if (!product) return Response.json({ error: 'Not found' }, { status: 404 });

  return Response.json(product);
}
```

---

## 5. Error Handling

```ts
// ✅ Typed error responses; never leak internal details
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await deleteOrderById(params.id);
    return new Response(null, { status: 204 });
  } catch (err) {
    if (err instanceof NotFoundError) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }
    console.error('deleteOrderById failed', err);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

---

## 6. Naming Conventions (server layer)

| Pattern | Example |
|---------|---------|
| Route handlers | `GET`, `POST`, `PUT`, `DELETE`, `PATCH` (Next.js convention) |
| Data fetch helpers | `fetchUserById`, `fetchProductPage`, `countActiveOrders` |
| Mutation helpers | `persistOrder`, `deleteCommentById`, `updateUserEmail` |
| Validators | `validateCreateOrderInput`, `parseCommentFormData` |
| Server actions | `createOrderAction`, `deleteCommentAction` |

- Prefix with the **operation**: `fetch`, `persist`, `delete`, `update`, `count`, `send`.
- Include the **entity**: `Order`, `User`, `Comment`.
- Include the **discriminator** when needed: `ById`, `ByEmail`, `Page`.
