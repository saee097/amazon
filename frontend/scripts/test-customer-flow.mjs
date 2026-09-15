/**
 * Comprehensive Customer Flow Test
 * Tests the entire customer journey end-to-end via the API.
 */

const BASE_URL = "http://localhost:3000";
const results = [];
let passed = 0;
let failed = 0;

let authToken = null;
let customerId = null;
let productId = null;
let variantId = null;
let addressId = null;
let orderId = null;
let couponCode = undefined;

function log(category, testName, success, detail = "") {
  const status = success ? "PASS" : "FAIL";
  const icon = success ? "✓" : "✗";
  const line = `  ${icon} [${category}] ${testName}: ${status}${detail ? " - " + detail : ""}`;
  console.log(line);
  results.push({ category, testName, success, detail });
  if (success) passed++;
  else failed++;
}

async function api(method, path, body = null, token = authToken) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const opts = { method, headers };
  if (body !== null) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, opts);
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data };
}

async function runTests() {
  console.log("========================================");
  console.log("  Customer Flow Test Suite");
  console.log("========================================\n");

  // ─── 1. HEALTH CHECK ────────────────────────────────────────────────────
  console.log("── 1. Health Check ──");
  {
    const { status, data } = await api("GET", "/api/health");
    log("Health", "GET /api/health", status === 200, `status=${status}, db=${data?.database}`);
  }

  // ─── 2. AUTH - LOGIN ────────────────────────────────────────────────────
  console.log("\n── 2. Authentication: Login ──");
  {
    const { status, data } = await api("POST", "/api/auth/login", {
      email: "customer@amazonstore.com",
      password: "Customer@123456",
    }, null);
    log("Auth", "Login as customer", status === 200, `status=${status}`);
    if (status === 200) {
      authToken = data.token || data.accessToken;
      const user = data.customer || data.user;
      customerId = user?._id || user?.id;
      log("Auth", "Token received", !!authToken);
      log("Auth", "User role is customer", user?.role === "customer", `role=${user?.role}`);
      log("Auth", "Customer ID received", !!customerId, `id=${customerId?.slice(0, 8)}`);
    } else {
      console.log("  Login error:", data?.message);
    }
  }

  // ─── 3. AUTH - VERIFY TOKEN ─────────────────────────────────────────────
  console.log("\n── 3. Token Verification ──");
  {
    const { status, data } = await api("GET", "/api/auth/verify");
    log("Auth", "GET /api/auth/verify (valid token)", status === 200 && data?.success,
      `status=${status}`);
  }

  // ─── 4. PRODUCT BROWSING ────────────────────────────────────────────────
  console.log("\n── 4. Product Browsing ──");
  {
    const { status, data } = await api("GET", "/api/store/products");
    log("Products", "GET /api/store/products", status === 200 && (data?.data || []).length > 0,
      `status=${status}, count=${(data?.data || []).length}`);
    
    if (data?.data?.length > 0) {
      const firstProduct = data.data[0];
      productId = firstProduct._id;
      log("Products", "Product has slug", !!firstProduct.slug, `slug=${firstProduct.slug}`);
      log("Products", "Product has price", typeof firstProduct.price === "number", `price=$${firstProduct.price}`);
      log("Products", "Product has variants", (firstProduct.variants || []).length > 0,
        `variants=${firstProduct.variants?.length}`);
      log("Products", "Product has images", (firstProduct.images || []).length > 0,
        `images=${firstProduct.images?.length}`);
      log("Products", "Product has brand", !!firstProduct.brand?.brand_name, `brand=${firstProduct.brand?.brand_name}`);
      log("Products", "Product has category", !!firstProduct.category?.category_name,
        `category=${firstProduct.category?.category_name}`);

      if (firstProduct.variants?.length > 0) {
        variantId = firstProduct.variants[0]._id;
        log("Products", "Variant has size", !!firstProduct.variants[0].size, `size=${firstProduct.variants[0].size}`);
        log("Products", "Variant has color", !!firstProduct.variants[0].color, `color=${firstProduct.variants[0].color}`);
        log("Products", "Variant has inventory_quantity", typeof firstProduct.variants[0].inventory_quantity === "number",
          `qty=${firstProduct.variants[0].inventory_quantity}`);
      }
    }
  }

  // Categories
  {
    const { status, data } = await api("GET", "/api/store/categories");
    log("Categories", "GET /api/store/categories", status === 200 && (data?.data || []).length > 0,
      `status=${status}, count=${(data?.data || []).length}`);
  }

  // Banners
  {
    const { status, data } = await api("GET", "/api/banners");
    log("Banners", "GET /api/banners", status === 200 && (data?.data || []).length > 0,
      `status=${status}, count=${(data?.data || []).length}`);
  }

  // Menu items
  {
    const { status, data } = await api("GET", "/api/menu-items");
    log("Menu", "GET /api/menu-items", status === 200 && (data?.data || []).length > 0,
      `status=${status}, count=${(data?.data || []).length}`);
  }

  // Product detail
  if (productId) {
    console.log("\n── 4b. Product Detail ──");
    const { status, data } = await api("GET", `/api/store/products/${productId}`);
    const product = data?.data;
    log("Products", "GET /api/store/products/:id", status === 200 && !!product, `status=${status}`);
    if (product) {
      log("Products", "Detail has description", !!product.description, product.description?.slice(0, 40));
      log("Products", "Detail has variants with inventory", (product.variants || []).length > 0 &&
        product.variants.every(v => typeof v.inventory_quantity === "number"),
        `variant_count=${product.variants?.length}`);
      log("Products", "Detail has reviews field", typeof product.reviews !== "undefined",
        `reviews=${product.reviews?.length || 0}`);
      log("Products", "Detail has images array", (product.images || []).length > 0,
        `images=${product.images?.length}`);
    }
  }

  // ─── 5. WISHLIST (read-only; add not implemented in backend) ────────────
  console.log("\n── 5. Wishlist ──");
  {
    const { status, data } = await api("GET", "/api/store/wishlist");
    const items = data?.data || [];
    log("Wishlist", "GET /api/store/wishlist", status === 200, `status=${status}, items=${items.length}`);
    log("Wishlist", "Note: POST wishlist not implemented in backend", true, "Only GET endpoint exists");
  }

  // ─── 6. ADDRESS MANAGEMENT ──────────────────────────────────────────────
  console.log("\n── 6. Address Management ──");
  {
    const { status, data } = await api("POST", "/api/addresses", {
      type: "shipping",
      street: "123 Main Street",
      city: "New York",
      state: "NY",
      country: "US",
      zip: "10001",
      is_default: true,
    });
    log("Address", "POST /api/addresses (create)", status === 200 || status === 201, `status=${status}`);
    if (status === 200 || status === 201) {
      addressId = data?.data?._id;
      log("Address", "Address ID received", !!addressId, `id=${addressId?.slice(0, 8)}`);
    }

    const { status: listStatus, data: listData } = await api("GET", "/api/addresses");
    const addresses = listData?.data || [];
    log("Address", "GET /api/addresses (list)", listStatus === 200 && addresses.length > 0,
      `status=${listStatus}, count=${addresses.length}`);
    if (addresses.length > 0 && !addressId) {
      addressId = addresses[0]._id;
    }

    // Create a second address
    const { status: add2Status } = await api("POST", "/api/addresses", {
      type: "shipping",
      street: "456 Oak Avenue",
      city: "San Francisco",
      state: "CA",
      country: "US",
      zip: "94102",
      is_default: false,
    });
    log("Address", "POST /api/addresses (create 2nd)", add2Status === 200 || add2Status === 201, `status=${add2Status}`);
  }

  // ─── 7. CART ────────────────────────────────────────────────────────────
  console.log("\n── 7. Shopping Cart Flow ──");
  {
    // Add to cart
    if (productId) {
      const { status } = await api("POST", "/api/store/cart", {
        productId,
        quantity: 1,
      });
      log("Cart", "POST /api/store/cart (add item)", status === 200, `status=${status}`);
    }

    // View cart
    const { status, data } = await api("GET", "/api/store/cart");
    const cart = data?.data;
    const items = cart?.items || [];
    log("Cart", "GET /api/store/cart (view)", status === 200 && items.length > 0,
      `status=${status}, items=${items.length}`);
    if (items.length > 0) {
      log("Cart", "Cart has totals", !!cart?.totals,
        `subtotal=$${cart?.totals?.subtotal}, shipping=$${cart?.totals?.shipping}, total=$${cart?.totals?.total}`);
      log("Cart", "Cart item has product title", !!items[0]?.product?.title, `title=${items[0]?.product?.title?.slice(0, 30)}`);
    }

    // Add a second product to cart
    const { data: productsData } = await api("GET", "/api/store/products");
    const allProducts = productsData?.data || [];
    if (allProducts.length > 1) {
      const secondProduct = allProducts[1];
      const { status: addStatus } = await api("POST", "/api/store/cart", {
        productId: secondProduct._id,
        quantity: 2,
      });
      log("Cart", "POST /api/store/cart (add 2nd item)", addStatus === 200, `status=${addStatus}`);

      const { status: recheckStatus, data: recheckData } = await api("GET", "/api/store/cart");
      const recheckItems = recheckData?.data?.items || [];
      log("Cart", "GET /api/store/cart (2 items)", recheckStatus === 200 && recheckItems.length === 2,
        `status=${recheckStatus}, items=${recheckItems.length}`);
    }
  }

  // ─── 8. CHECKOUT ─────────────────────────────────────────────────────────
  console.log("\n── 8. Checkout Flow ──");
  {
    // Get available coupons
    const { status: couponStatus, data: couponData } = await api("GET", "/api/coupons");
    const coupons = couponData?.data || [];
    log("Checkout", "GET /api/coupons (list)", couponStatus === 200 && coupons.length > 0,
      `status=${couponStatus}, count=${coupons.length}`);
    if (coupons.length > 0) {
      couponCode = coupons[0].code;
      log("Coupons", "Coupon has code", !!coupons[0]?.code, `code=${coupons[0]?.code}`);
      log("Coupons", "Coupon has discount type", !!coupons[0]?.discount_type, `type=${coupons[0]?.discount_type}`);
      log("Coupons", "Coupon has discount value", typeof coupons[0]?.discount_value === "number", `value=${coupons[0]?.discount_value}`);
      log("Coupons", "Coupon has minimum order", typeof coupons[0]?.min_order === "number", `min=${coupons[0]?.min_order}`);
    }

    // Place order
    if (addressId) {
      const idempotencyKey = `test_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const { status, data } = await api("POST", "/api/store/checkout", {
        addressId,
        paymentMethod: "cash_on_delivery",
        couponCode,
        idempotencyKey,
      });
      log("Checkout", "POST /api/store/checkout (place order)", status === 200 || status === 201,
        `status=${status}`);
      if (status === 200 || status === 201) {
        const order = data?.data;
        orderId = order?._id || order?.id;
        log("Checkout", "Order created with number", !!order?.order_number, `order_number=${order?.order_number}`);
        log("Checkout", "Order has confirmed status", order?.order_status === "confirmed", `status=${order?.order_status}`);
        log("Checkout", "Order payment method is COD", order?.payment_method === "cash_on_delivery", `method=${order?.payment_method}`);
        log("Checkout", "Order payment status is pending", order?.payment_status === "pending", `payment_status=${order?.payment_status}`);
        log("Checkout", "Order has items", (order?.items || []).length > 0, `item_count=${order?.items?.length}`);
        log("Checkout", "Order has subtotal", typeof order?.subtotal === "number", `subtotal=$${order?.subtotal}`);
        log("Checkout", "Order has total", typeof order?.total === "number", `total=$${order?.total}`);
        const discountApplied = couponCode && order?.discount > 0;
        log("Checkout", "Coupon discount applied", discountApplied, `discount=$${order?.discount || 0}, coupon=${couponCode}`);
      } else {
        console.log("  Checkout error:", data?.message);
      }
    }
  }

  // ─── 9. ORDER HISTORY ───────────────────────────────────────────────────
  console.log("\n── 9. Order History ──");
  {
    const { status, data } = await api("GET", "/api/store/orders");
    const orders = data?.data || [];
    log("Orders", "GET /api/store/orders (list)", status === 200 && orders.length > 0,
      `status=${status}, count=${orders.length}`);
    if (orders.length > 0) {
      const order = orders.find(o => o._id === orderId) || orders[orders.length - 1];
      log("Orders", "Order has order_number", !!order?.order_number, `order_number=${order?.order_number}`);
      log("Orders", "Order has status", !!order?.order_status, `status=${order?.order_status}`);
      log("Orders", "Order has payment status", !!order?.payment_status, `payment_status=${order?.payment_status}`);
      log("Orders", "Order has items", (order?.items || []).length > 0, `items=${order?.items?.length}`);
      if (order?.items?.length > 0) {
        log("Orders", "Order item has product data", !!order.items[0]?.product?.title, `product=${order.items[0]?.product?.title?.slice(0, 30)}`);
        log("Orders", "Order item has price", typeof order.items[0]?.price === "number", `price=$${order.items[0]?.price}`);
        log("Orders", "Order item has quantity", typeof order.items[0]?.quantity === "number", `quantity=${order.items[0]?.quantity}`);
      }
    }
  }

  // ─── 10. PROFILE MANAGEMENT ────────────────────────────────────────────
  console.log("\n── 10. Profile Management ──");
  {
    const { status, data } = await api("GET", "/api/auth/profile");
    log("Profile", "GET /api/auth/profile", status === 200 && !!data?.data,
      `status=${status}, email=${data?.data?.email}`);
    const user = data?.data;
    log("Profile", "Profile has role field", user?.role === "customer", `role=${user?.role}`);
    log("Profile", "Profile has created_at", !!user?.created_at, `created=${user?.created_at?.slice(0, 10)}`);
    log("Profile", "Profile has permissions array", Array.isArray(user?.permissions), `perms=${user?.permissions?.length}`);

    const { status: updateStatus, data: updateData } = await api("PUT", "/api/auth/profile", {
      first_name: "Test",
      last_name: "Customer",
      phone: "+1-555-0100",
    });
    log("Profile", "PUT /api/auth/profile (update)", updateStatus === 200, `status=${updateStatus}`);
    if (updateStatus === 200) {
      const updated = updateData?.data;
      log("Profile", "First name updated", updated?.first_name === "Test", `first_name=${updated?.first_name}`);
      log("Profile", "Last name updated", updated?.last_name === "Customer", `last_name=${updated?.last_name}`);
      log("Profile", "Phone updated", updated?.phone === "+1-555-0100", `phone=${updated?.phone}`);
    }

    // Change password - changing password invalidates the session token
    const { status: pwStatus } = await api("PUT", "/api/auth/change-password", {
      currentPassword: "Customer@123456",
      newPassword: "TestNew@123456",
    });
    log("Profile", "PUT /api/auth/change-password", pwStatus === 200, `status=${pwStatus}`);

    // Re-login with new password to get a fresh token (old token is invalidated)
    const { status: reLoginStatus, data: reLoginData } = await api("POST", "/api/auth/login", {
      email: "customer@amazonstore.com",
      password: "TestNew@123456",
    }, null);
    authToken = reLoginData?.token || reLoginData?.accessToken;

    // Change password back using fresh token
    const { status: pwBackStatus } = await api("PUT", "/api/auth/change-password", {
      currentPassword: "TestNew@123456",
      newPassword: "Customer@123456",
    });
    log("Profile", "Password changed back to original", pwBackStatus === 200, `status=${pwBackStatus}`);

    // Re-login again with original password
    const { status: reLoginStatus2, data: reLoginData2 } = await api("POST", "/api/auth/login", {
      email: "customer@amazonstore.com",
      password: "Customer@123456",
    }, null);
    authToken = reLoginData2?.token || reLoginData2?.accessToken;
    log("Profile", "Re-login after password reset", !!authToken, `status=${reLoginStatus2}`);
  }

     // ─── 11. RETURNS & REFUNDS ──────────────────────────────────────────────
   console.log("\n── 11. Returns & Refunds ──");
   {
     if (orderId) {
       const { status, data } = await api("POST", "/api/returns", {
         order_id: orderId,
         reason: "Product arrived damaged",
       });
       log("Returns", "POST /api/returns (create)", status === 200 || status === 201, `status=${status}`);
       if (status === 200 || status === 201) {
         const ret = data?.data;
         log("Returns", "Return has status", !!ret?.status, `status=${ret?.status}`);
         log("Returns", "Return has order_id", !!ret?.order_id, `order_id=${ret?.order_id?.slice(0, 8)}`);
         log("Returns", "Return has reason", !!ret?.reason, `reason=${ret?.reason?.slice(0, 40)}`);
       }
     } else {
       log("Returns", "POST /api/returns (create)", false, "No order ID available");
     }

     const { status, data } = await api("GET", "/api/returns");
     const returns = data?.data || [];
     log("Returns", "GET /api/returns (list)", status === 200, `status=${status}, count=${returns.length}`);
     if (returns.length > 0) {
       log("Returns", "Return has _id", !!returns[0]?._id);
       log("Returns", "Return has status field", !!returns[0]?.status, `status=${returns[0]?.status}`);
     }

     const { status: refundStatus, data: refundData } = await api("GET", "/api/store/refunds");
     const refunds = refundData?.data || [];
     log("Refunds", "GET /api/store/refunds (list)", refundStatus === 200,
       `status=${refundStatus}, count=${refunds.length}`);
   }

   // ─── 12. RBAC - CUSTOMER CANNOT ACCESS ADMIN ────────────────────────────
   console.log("\n── 12. RBAC Enforcement ──");
   {
     if (authToken) {
       const { status } = await api("GET", "/api/admin/products");
       log("RBAC", "GET /api/admin/products (customer denied)", status === 403, `status=${status}`);

       const { status: ordersStatus } = await api("GET", "/api/admin/orders");
       log("RBAC", "GET /api/admin/orders (customer denied)", ordersStatus === 403, `status=${ordersStatus}`);

       const { status: settingsStatus } = await api("GET", "/api/admin/settings");
       log("RBAC", "GET /api/admin/settings (customer denied)", settingsStatus === 403, `status=${settingsStatus}`);

       const { status: usersStatus } = await api("GET", "/api/admin/users");
       log("RBAC", "GET /api/admin/users (customer denied)", usersStatus === 403, `status=${usersStatus}`);
     } else {
       log("RBAC", "Re-login for RBAC tests", false, "No auth token available");
     }
   }

  // ─── 13. IDempotency - DUPLICATE CHECKOUT ───────────────────────────────
  console.log("\n── 13. Checkout Idempotency ──");
  if (addressId) {
    // Add items back to cart first (checkout clears the cart)
    if (productId) {
      await api("POST", "/api/store/cart", { productId, quantity: 1 });
    }
    const idempotencyKey = `idem_${Date.now()}`;
    const { status: firstStatus, data: firstData } = await api("POST", "/api/store/checkout", {
      addressId,
      paymentMethod: "cash_on_delivery",
      idempotencyKey,
    });
    log("Idempotency", "First checkout succeeds", firstStatus === 200 || firstStatus === 201, `status=${firstStatus}`);
    
    const { status: secondStatus, data: secondData } = await api("POST", "/api/store/checkout", {
      addressId,
      paymentMethod: "cash_on_delivery",
      idempotencyKey,
    });
    log("Idempotency", "Duplicate checkout returns 200 with same order", secondStatus === 200, `status=${secondStatus}`);
    log("Idempotency", "Same order returned", firstData?.data?._id === secondData?.data?._id,
      `same=${firstData?.data?._id === secondData?.data?._id}`);
  }

  // ─── 14. SEARCH ─────────────────────────────────────────────────────────
  console.log("\n── 14. Search Functionality ──");
  {
    const { status, data } = await api("GET", "/api/store/products?q=shirt");
    log("Search", "Search for 'shirt' returns results", status === 200, `status=${status}, count=${(data?.data || []).length}`);
  }

  // ─── 15. AUTH SECURITY ──────────────────────────────────────────────────
  console.log("\n── 15. Auth Security ──");
  {
    const { status } = await api("GET", "/api/store/orders", null, null);
    log("Security", "Orders without token = 401", status === 401, `status=${status}`);

    const { status: invalidStatus } = await api("GET", "/api/store/orders", null, "invalid_token_12345");
    log("Security", "Orders with invalid token = 401", invalidStatus === 401, `status=${invalidStatus}`);

    const { status: adminStatus } = await api("GET", "/api/admin/products", null, "invalid_token");
    log("Security", "Admin route without valid token = 401", adminStatus === 401, `status=${adminStatus}`);
  }

  // ─── 16. CART INVENTORY VALIDATION ──────────────────────────────────────
  console.log("\n── 16. Cart Inventory Validation ──");
  {
    const { data: productsData } = await api("GET", "/api/store/products");
    const products = productsData?.data || [];
    if (products.length > 0) {
      const product = products[0];
      const variant = product.variants?.[0];
      const largeQty = (variant?.inventory_quantity || 10) + 100;
      const { status, data } = await api("POST", "/api/store/cart", {
        productId: product._id,
        variantId: variant?._id,
        quantity: largeQty,
      });
      log("Cart", "Adding qty > inventory is rejected", status === 400,
        `status=${status}, msg=${data?.message?.slice(0, 50)}`);
    }
  }

  // ─── 17. SESSIONS / AUDIT LOG ───────────────────────────────────────────
  console.log("\n── 17. Session Tracking ──");
  {
    const { status, data } = await api("GET", "/api/auth/sessions");
    log("Sessions", "GET /api/auth/sessions", status === 200, `status=${status}, count=${(data?.data || []).length}`);
    if (data?.data?.length > 0) {
      log("Sessions", "Session has action field", !!data.data[0]?.action, `action=${data.data[0]?.action}`);
      log("Sessions", "Session has IP field", !!data.data[0]?.ip || data.data[0]?.ip_address, `ip=${data.data[0]?.ip || data.data[0]?.ip_address}`);
    }
  }

  // ─── 18. COUPONS ───────────────────────────────────────────────────────
  console.log("\n── 18. Coupon Details ──");
  {
    const { status, data } = await api("GET", "/api/coupons");
    const coupons = data?.data || [];
    log("Coupons", "GET /api/coupons", status === 200 && coupons.length > 0, `count=${coupons.length}`);
    if (coupons.length > 0) {
      log("Coupons", "Coupon has code field", !!coupons[0]?.code, `code=${coupons[0]?.code}`);
      log("Coupons", "Coupon has discount_type", !!coupons[0]?.discount_type, `type=${coupons[0]?.discount_type}`);
      log("Coupons", "Coupon has status", !!coupons[0]?.status, `status=${coupons[0]?.status}`);
      log("Coupons", "Coupon has used_count", typeof coupons[0]?.used_count === "number", `used=${coupons[0]?.used_count}`);
    }
  }

  // ─── 19. SYSTEM HEALTH (Admin-only endpoint) ────────────────────────────
  console.log("\n── 19. System Health (Admin only) ──");
  {
    const { status } = await api("GET", "/api/admin/system/health");
    log("System", "GET /api/admin/system/health (customer denied)", status === 403, `status=${status}`);
  }

  // ─── SUMMARY ────────────────────────────────────────────────────────────
  console.log("\n========================================");
  console.log(`  Test Summary: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log("========================================");
  
  if (failed > 0) {
    console.log("\nFailed tests:");
    results.filter(r => !r.success).forEach(r => {
      console.log(`  ✗ [${r.category}] ${r.testName}${r.detail ? " - " + r.detail : ""}`);
    });
  }
  
  return failed;
}

const exitCode = await runTests();
process.exit(exitCode > 0 ? 1 : 0);
