# Client-Side Standards (Next.js / React)

Applies to: files with `"use client"`, `.tsx` components, custom hooks, context providers.

---

## 1. Memoization — What, When, and Why

### `React.memo` — prevent re-renders when props haven't changed
```tsx
// ✅ Wrap pure presentational components that receive stable props
const ProductCard = React.memo(function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="card">
      <h2>{product.name}</h2>
      <p>{product.price}</p>
    </div>
  );
});

// ❌ Don't memo components that always receive new object/array literals from parent
// (memo won't help; the prop reference changes every render anyway)
```

**When to use `memo`:**
- Component is called frequently (inside a list, table row, or rapidly updating parent).
- Props are primitives or stable references (from `useMemo`/`useCallback`).
- Profiler confirms unnecessary re-renders (don't premature-optimize).

### `useMemo` — memoize expensive derived values
```tsx
// ✅ Derive sorted/filtered list once; recompute only when deps change
const sortedProducts = useMemo(
  () => [...products].sort((a, b) => a.price - b.price),
  [products],
);

// ❌ Memoizing a trivial expression wastes memory and obscures intent
const doubled = useMemo(() => count * 2, [count]);   // just write count * 2
```

**When to use `useMemo`:**
- Computation is measurably expensive (sorting/filtering large arrays, heavy transforms).
- Result is passed as a prop to a `memo`-wrapped child (stabilises the reference).
- Result is a dependency of another hook.

### `useCallback` — stabilise function references
```tsx
// ✅ Stable handler passed to memo child or used as effect dep
const handleAddToCart = useCallback((productId: string) => {
  dispatch({ type: 'ADD_ITEM', productId });
}, [dispatch]);

// ❌ Wrapping a function that isn't passed anywhere or used as dep
const handleClick = useCallback(() => console.log('clicked'), []); // pointless
```

**When to use `useCallback`:**
- Function is passed as a prop to a `memo`-wrapped child.
- Function is listed as a dependency of `useEffect` / `useMemo`.
- Function is a stable event handler on a frequently-rendered element.

---

## 2. State — Colocate, Minimise, Derive

### Colocate state as close to its consumer as possible
```tsx
// ✅ Dropdown state lives in the component that owns the dropdown
function ProductFilter() {
  const [isOpen, setIsOpen] = useState(false);
  // ...
}

// ❌ Lifting ephemeral UI state to a global store pollutes shared state
```

### Derive, don't duplicate
```tsx
// ✅ Derive from source of truth; no sync needed
function CartSummary({ items }: { items: CartItem[] }) {
  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  return <p>Total: {total}</p>;
}

// ❌ Keeping a separate `total` state that must be kept in sync with `items`
const [total, setTotal] = useState(0);
```

### Batch related state into one object
```tsx
// ✅ Related fields grouped; one setState call
const [form, setForm] = useState({ name: '', email: '', role: 'user' });
const updateField = useCallback(
  (field: keyof typeof form, value: string) =>
    setForm(prev => ({ ...prev, [field]: value })),
  [],
);

// ❌ Three separate state values that always change together
const [name, setName] = useState('');
const [email, setEmail] = useState('');
const [role, setRole] = useState('user');
```

---

## 3. Single Responsibility — One Job per Component

Components should do one thing. Extract when a component has more than one reason to change.

```tsx
// ✅ Each component owns a single concern
function ProductListPage() {
  const products = useProductList();
  return <ProductGrid products={products} />;
}

function ProductGrid({ products }: { products: Product[] }) {
  return (
    <ul>
      {products.map(p => <ProductCard key={p.id} product={p} />)}
    </ul>
  );
}

const ProductCard = React.memo(function ProductCard({ product }: { product: Product }) {
  return <li>{product.name}</li>;
});
```

---

## 4. Readable Decomposition

Break components longer than ~40 JSX lines into named sub-components or named render helpers.

```tsx
// ✅ Named sub-components explain structure at a glance
function CheckoutPage() {
  return (
    <main>
      <CheckoutHeader />
      <OrderItemList />
      <OrderSummary />
      <PaymentForm />
    </main>
  );
}
```

---

## 5. Effects — Minimal and Focused

```tsx
// ✅ One effect, one side effect; named cleanup
useEffect(() => {
  const controller = new AbortController();
  fetchProductDetails(productId, controller.signal).then(setProduct);
  return () => controller.abort();
}, [productId]);

// ❌ Multiple unrelated side effects in one useEffect
useEffect(() => {
  fetchProduct(id);
  trackPageView(id);          // unrelated concern
  document.title = id;        // yet another concern
}, [id]);
```

---

## 6. Custom Hooks — Encapsulate, Don't Expose

Extract reusable stateful logic into named hooks. Hooks should return only what callers need.

```tsx
// ✅ Hook encapsulates fetch + loading + error; returns a clean interface
function useProductDetails(productId: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetchProductById(productId)
      .then(p => { if (!cancelled) setProduct(p); })
      .catch(e => { if (!cancelled) setFetchError(e.message); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [productId]);

  return { product, isLoading, fetchError };
}
```

---

## 7. Performance — List Rendering

```tsx
// ✅ Stable key; memoised row component
const OrderRow = React.memo(function OrderRow({ order }: { order: Order }) {
  return <tr><td>{order.id}</td><td>{order.total}</td></tr>;
});

function OrderTable({ orders }: { orders: Order[] }) {
  return (
    <table>
      <tbody>
        {orders.map(order => <OrderRow key={order.id} order={order} />)}
      </tbody>
    </table>
  );
}

// ❌ Unstable key causes full remount on every render
orders.map((o, idx) => <OrderRow key={idx} order={o} />)

// ❌ Inline object prop breaks memo (new reference every render)
orders.map(o => <OrderRow key={o.id} order={{ ...o, formatted: true }} />)
```

---

## 8. Naming Conventions (client layer)

| Pattern | Example |
|---------|---------|
| Components | `PascalCase` — `ProductCard`, `OrderSummary`, `CheckoutHeader` |
| Custom hooks | `use` prefix — `useProductDetails`, `useCartActions`, `useFormField` |
| Event handlers | `handle` prefix — `handleAddToCart`, `handleFormSubmit`, `handleModalClose` |
| Boolean state | `is`/`has`/`can` prefix — `isLoading`, `hasError`, `canSubmit` |
| Derived values | Noun describing the result — `sortedProducts`, `totalPrice`, `activeFilters` |
| Memo callbacks | Same as event handlers — `handleRowSelect`, `handlePageChange` |
