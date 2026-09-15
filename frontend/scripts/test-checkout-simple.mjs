const BASE = "http://localhost:3000";

async function api(method, path, body = null, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const opts = { method, headers, body: body ? JSON.stringify(body) : null };
  const res = await fetch(`${BASE}${path}`, opts);
  let data = null;
  try { data = await res.json(); } catch { data = null; }
  return { status: res.status, data };
}

async function main() {
  // Login
  let r = await api("POST", "/api/auth/login", {
    email: "customer@amazonstore.com",
    password: "Customer@123456",
  }, null);
  const token = r.data.token || r.data.accessToken;
  console.log("Login:", r.status);

  // Create address
  r = await api("POST", "/api/addresses", {
    type: "shipping", street: "123 Main St", city: "NYC", state: "NY", country: "US", zip: "10001", is_default: true,
  }, token);
  const addressId = r.data?.data?._id;

  // Get products
  r = await api("GET", "/api/store/products");
  const productId = r.data.data[0]._id;
  console.log("Product:", productId.slice(0, 8));

  // Add to cart
  r = await api("POST", "/api/store/cart", { productId, quantity: 1 }, token);
  console.log("Add to cart:", r.status);

  // Check debug endpoint
  r = await api("GET", "/api/debug-checkout?userId=82b3d361-5494-410a-8448-d4cc5d94a9ba");
  console.log("Debug:", r.status, JSON.stringify(r.data).slice(0, 500));

  // Try checkout
  r = await api("POST", "/api/store/checkout", {
    addressId,
    paymentMethod: "cash_on_delivery",
    idempotencyKey: "test_" + Date.now(),
  }, token);
  console.log("Checkout:", r.status, r.data?.message?.slice(0, 200));
}

main().catch(console.error);
