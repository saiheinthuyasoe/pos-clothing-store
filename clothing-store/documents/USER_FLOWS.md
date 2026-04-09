User Flows

This document describes primary user flows for each stakeholder: Owner, Manager, Staff (Cashier), and Customer.

Owner

1. Sign in
   - Open the POS app and sign in with owner credentials.
   - If first-time, follow the Owner account creation flow (admin setup).
2. View Dashboard
   - Land on the owner dashboard to see sales summary, low-stock alerts, and notices.
3. Manage Products
   - Go to Inventory → Products.
   - Click "Add Product" → fill details, upload images (R2), set SKUs and prices → Save.
   - To edit a product, open it, change fields, and Save.
4. Manage Inventory / Stocks
   - Open Inventory → Stocks for a branch.
   - Add stock entries, adjust quantities, set reorder thresholds, and view low-stock alerts.
5. Manage Shops / Branches
   - Open Shops → Create or edit branch details, set branch-specific inventory and hours.
6. Manage Staff
   - Open Staff → Add staff account (email, password, role), enable/disable, and edit staff profiles.
7. Sales & Transactions
   - Open Sales → Transactions to view all sales, filter by branch/date, and export reports.
   - Perform manual refunds or adjustments where allowed.
8. Reports & Finance
   - Open Reports to view sales, tax, and expense reports; export CSV for accounting.
9. System Settings
   - Open Settings to configure tax, currency, payment methods, integrations (Firebase, R2), and barcode settings.

Manager

1. Sign in
   - Sign in with manager credentials via POS app.
2. Dashboard & Reports
   - See sales and inventory summaries relevant to managed branches.
3. Product & Inventory Management
   - Create and edit products, adjust stock for branches, and run inventory reports.
4. Customer Management
   - View customer profiles and purchase histories; assist with order lookup.
5. Sales Operations
   - Review transactions, approve or assist with refunds per store policy.
6. Expenses & Branch Management
   - Create and view expense records and manage branch-specific settings (not staff accounts).
7. Restrictions
   - Manager cannot create/modify/delete staff accounts or perform Owner-only global changes.

Staff (Cashier)

1. Sign in
   - Sign in using staff credentials on the POS login page.
2. Checkout / POS Flow
   - Open POS screen → scan or search for product → add items to the cart.
   - Apply discounts, select customer (optional), choose payment method → complete payment.
   - Print or send receipt and close the transaction.
3. Refunds
   - Look up the original transaction → follow refund workflow (partial or full) as allowed.
4. Customer Lookup
   - Search customers by phone/email → attach customer to sale or update profile.
5. Quick Inventory Checks
   - Check product availability and current stock levels; perform minor adjustments if permitted.
6. Limited Settings
   - Access cashier-relevant settings only (receipt preferences, selected branch)

Customer (Web)

1. Browse & Discover
   - Open the storefront web app → browse categories, search, and view product lists.
2. Product Details
   - Open a product page to see images, description, sizes, prices, and availability by branch.
3. Cart & Checkout
   - Add items to cart → review cart → proceed to checkout.
   - Enter shipping/pickup details, choose payment method, and complete checkout.
4. Orders & History
   - View order confirmation and check order history in the account section.
5. Shop Info & Support
   - View shop locations, opening hours, and terms & conditions; contact support if needed.

Notes

- Role names in the code are `owner`, `manager`, `staff`, and `customer` (see `src/types/auth.ts`).
- Access control is enforced via UI filters and `ProtectedRoute` logic; owner-only flows (staff management, shops) require owner role.
