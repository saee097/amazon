const fs = require("fs");
const s = fs.readFileSync("seedProducts.js", "utf8");
const brands = ["amazon-basics", "northwind", "lumen", "verve", "atlas-wear", "coastline", "meridian", "solace"];
const re = /brand:\s*"([^"]+)"/g;
let m;
const used = new Set();
while ((m = re.exec(s))) used.add(m[1]);
console.log("missing brands:", [...used].filter((b) => !brands.includes(b)));
