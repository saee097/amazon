import { test } from "node:test";
import assert from "node:assert/strict";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  categorySchema,
  couponSchema,
  roleSchema,
  bannerSchema,
  menuItemSchema,
  settingsUpdateSchema,
} from "../src/server/lib/validation";

test("loginSchema rejects invalid email and missing password", () => {
  const invalid = loginSchema.safeParse({ email: "not-an-email", password: "" });
  assert.equal(invalid.success, false);

  const valid = loginSchema.safeParse({ email: "user@example.com", password: "secret" });
  assert.equal(valid.success, true);
});

test("registerSchema requires min 8 char password and valid email", () => {
  const short = registerSchema.safeParse({
    email: "bad",
    password: "123",
    firstName: "A",
    lastName: "B",
  });
  assert.equal(short.success, false);

  const ok = registerSchema.safeParse({
    email: "new@example.com",
    password: "password123",
    firstName: "A",
    lastName: "B",
  });
  assert.equal(ok.success, true);
});

test("forgotPasswordSchema requires a valid email", () => {
  assert.equal(forgotPasswordSchema.safeParse({ email: "x" }).success, false);
  assert.equal(forgotPasswordSchema.safeParse({ email: "a@b.com" }).success, true);
});

test("categorySchema requires a name", () => {
  assert.equal(categorySchema.safeParse({}).success, false);
  const ok = categorySchema.safeParse({ category_name: "Shoes", slug: "shoes", status: "active" });
  assert.equal(ok.success, true);
});

test("couponSchema enforces discount types and code", () => {
  assert.equal(couponSchema.safeParse({}).success, false);
  assert.equal(
    couponSchema.safeParse({ code: "SAVE10", discount_type: "bogus", discount_value: 10 }).success,
    false
  );
  assert.equal(
    couponSchema.safeParse({ code: "SAVE10", discount_type: "percentage", discount_value: 10 }).success,
    true
  );
});

test("roleSchema requires name", () => {
  assert.equal(roleSchema.safeParse({}).success, false);
  assert.equal(roleSchema.safeParse({ name: "editor" }).success, true);
});

test("bannerSchema requires heading and image", () => {
  assert.equal(bannerSchema.safeParse({}).success, false);
  assert.equal(bannerSchema.safeParse({ heading: "Sale", image: "/x.png" }).success, true);
});

test("menuItemSchema requires title", () => {
  assert.equal(menuItemSchema.safeParse({}).success, false);
  assert.equal(menuItemSchema.safeParse({ title: "Home" }).success, true);
});

test("settingsUpdateSchema allows partial object", () => {
  assert.equal(settingsUpdateSchema.safeParse({ store_name: "My Store" }).success, true);
  assert.equal(settingsUpdateSchema.safeParse(null).success, false);
});
