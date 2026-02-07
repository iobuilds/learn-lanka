# A/L ICT Education Platform - Requirements Specification

## Overview
A simple, easy-to-access education platform for A/L ICT students in Sri Lanka. The platform enables teachers to manage classes, share learning materials, conduct rank papers (quizzes), and handle payments through bank transfers.

**Design Philosophy**: Clean, minimal UI with no fancy animations. Mobile-first responsive design. Focus on functionality and ease of use.

---

## Tech Stack
- **Frontend**: React + TypeScript + Tailwind CSS (mobile-first)
- **Backend**: Supabase (Auth, Database, Storage, Edge Functions)
- **SMS Gateway**: Text.lk API for OTP delivery

---

## User Roles

| Role | Permissions |
|------|-------------|
| **ADMIN** | Full system control, revenue management, user management, all content creation |
| **MODERATOR** | Content management, lesson uploads, payment verification, marking essays |
| **STUDENT** | Enroll in classes, access paid content, attempt rank papers, purchase materials |

---

## 1. Authentication System

### 1.1 Login Page
- Full-screen responsive background image with dark overlay
- Phone number + password login form
- "Forgot Password" link
- "Create Account" link
- Mobile and desktop responsive

### 1.2 Registration Flow
1. **Step 1**: Enter phone number → Send OTP via Text.lk SMS
2. **Step 2**: Enter 6-digit OTP → Verify
3. **Step 3**: Complete profile:
   - First Name (required)
   - Last Name (required)
   - School Name (required)
   - Birthday (required)
   - Address (required)
   - Grade (dropdown: 6, 7, 8, 9, 10, 11, 12, 13)
   - Password + Confirm Password

### 1.3 Password Recovery
1. Enter phone number
2. Check if user exists → If not, show "User not found"
3. Send OTP to phone
4. Verify OTP
5. Set new password

---

## 2. Classes Module

### 2.1 Class Structure
```
Class
├── Title (e.g., "A/L 2026 Batch")
├── Description
├── Grade Range (min-max)
├── Monthly Fee Amount
├── Is Private (boolean)
├── Private Code (for private classes)
├── Admin OTP Phone (for private class enrollment)
└── Class Months
    └── Class Days (typically 4 per month)
        └── Lessons
            ├── Title
            ├── Description
            ├── PDF Notes (file upload)
            ├── YouTube Video URL (embedded)
            └── Text Notes
```

### 2.2 Enrollment Rules
- **Public Classes**: Students enroll directly, pay monthly fee
- **Private Classes**: 
  1. Student searches by class code
  2. Clicks "Enroll" → OTP sent to ADMIN's phone (not student)
  3. Student asks admin for OTP → enters it
  4. Lifetime free access granted

### 2.3 Monthly Fee Rules
- First 4 class days = monthly fee
- 5th+ class days = FREE (but requires monthly fee payment)
- Mid-month joiners pay FULL monthly fee
- No access to lessons without payment for that month
- Can VIEW lesson titles but cannot ACCESS content

### 2.4 Lesson Access
- Enrolled + Paid = Full access
- Enrolled + Not Paid = Can see schedule, locked content
- Not Enrolled = Cannot see class details

---

## 3. Rank Papers (Quizzes) Module

### 3.1 Paper Structure
```
Rank Paper
├── Title
├── Grade
├── Associated Class (optional)
├── Fee Amount (optional, 0 = free)
├── Time Limit (minutes)
├── Publish Status (DRAFT / PUBLISHED)
├── Has MCQ Section (boolean)
├── Has Short Essay Section (boolean)
├── Has Essay Section (boolean)
├── Essay PDF URL (for essay questions)
└── Review Video URL (YouTube, after completion)
```

### 3.2 MCQ Section
- Questions numbered 1-50
- Each question has 5 options
- Options can be:
  - Text (e.g., "1. Rabbit", "2. Parrot")
  - Images (uploaded by admin)
- One correct answer per question
- Auto-graded on submission

### 3.3 Short Essay & Essay Sections
- Essay questions displayed as PDF
- Students write answers on paper
- Take photos → Convert to PDF → Upload
- Manual marking by admin/moderator
- Screenshot capture PROHIBITED (blur on tab switch, watermarks)

### 3.4 Attempt Rules
- Synchronized timer for all users
- Auto-save on time exceed
- Auto-close when time ends
- One attempt per user per paper
- Cannot view correct answers until marks published

### 3.5 Marking & Results
- MCQ: Auto-graded
- Short Essay: Manual marks by admin/moderator
- Essay: Manual marks by admin/moderator
- Marks published by admin (triggers notification)
- Leaderboard visible after publishing
- Students can view their own answers only

### 3.6 Review & Consultation
- Admin can add review video (YouTube) after paper ends
- Enrolled students can view review video
- Consultation option (paid) - fee set by admin

---

## 4. Payment System

### 4.1 Payment Types
- `CLASS_MONTH` - Monthly class fee
- `RANK_PAPER` - Quiz/paper access fee
- `SHOP_ORDER` - Learning materials purchase

### 4.2 Bank Transfer Flow
1. Admin adds bank accounts (Bank Name, Account Name, Account Number, Branch)
2. Student makes bank transfer
3. Student uploads payment slip (image or PDF)
4. Admin/Moderator verifies payment
5. Access granted on approval

### 4.3 Payment Status
- `PENDING` - Awaiting verification
- `APPROVED` - Verified, access granted
- `REJECTED` - Invalid slip, needs resubmission

---

## 5. Coupon System

### 5.1 Coupon Types
- **PERCENT** - Percentage discount (e.g., 20% off)
- **FIXED** - Fixed amount off (e.g., Rs. 500 off)
- **FULL** - 100% free

### 5.2 Coupon Scope
- `CLASS_MONTH` - Specific class month
- `CLASS` - Entire class (all months)
- `RANK_PAPER` - Specific rank paper
- `SHOP_PRODUCT` - Specific product
- `SHOP_ORDER` - Entire order

### 5.3 Coupon Rules
- One-time use per user
- Admin can assign directly to users
- Users can claim with code
- Expiration date (optional)
- Max uses per user limit

---

## 6. Shop Module

### 6.1 Product Types
- **SOFT** - Digital PDF only
- **PRINTED** - Physical printed copy
- **BOTH** - Bundle discount for both

### 6.2 Product Structure
```
Shop Product
├── Title
├── Description
├── Type (SOFT / PRINTED / BOTH)
├── Price (Soft Copy)
├── Price (Printed Copy)
├── Price (Both - bundle)
├── PDF URL (for soft copies)
└── Is Active
```

### 6.3 Purchase Flow
1. Add to cart
2. Select type (soft/printed/both)
3. Apply coupon (optional)
4. Checkout → Upload payment slip
5. Admin verifies payment
6. Soft copy: Download unlocked
7. Printed: Admin ships manually

---

## 7. Past Papers Section

### 7.1 Structure
```
Past Paper
├── Year (e.g., 2023)
├── Paper Type (A/L ICT)
├── Language (Sinhala / English)
├── PDF URL
└── Review Video URL (optional)
```

### 7.2 Access
- Free download for all registered users
- Review video (if available)

---

## 8. School Papers Section

### 8.1 Structure
```
School Paper
├── Title
├── School Name
├── Year
├── Grade
├── PDF URL
└── Review Video URL (optional)
```

### 8.2 Access
- Free or paid (admin decides)
- Review video for enrolled users

---

## 9. Notifications System

### 9.1 Notification Triggers
- New lesson uploaded → Enrolled students
- New rank paper published → Grade-matched students
- Marks published → Paper participants
- Payment verified → User
- New material in shop → All users (optional)
- Broadcast message → Selected users/class/all

### 9.2 Admin Controls
- Enable/disable notification types
- Per-class notification settings
- Broadcast to: All / Specific Class / Selected Users

---

## 10. Admin Panel

### 10.1 Dashboard
- Total students count
- Monthly revenue
- Pending payments count
- Active classes count

### 10.2 User Management
- View all users
- Change roles (Student → Moderator → Admin)
- Suspend/Activate users
- View user's enrolled classes
- View user's payments

### 10.3 Class Management
- Create/Edit/Delete classes
- Set monthly fees
- Add class months
- Add class days to months
- Add lessons to days
- Upload PDFs, add YouTube links

### 10.4 Payment Management
- View pending payments
- Approve/Reject with notes
- View payment history
- Filter by type, status, date

### 10.5 Rank Paper Management
- Create/Edit papers
- Add MCQ questions (text or image options)
- Upload essay PDF
- Set time limits
- Publish/Unpublish
- View attempts
- Mark essays manually
- Publish marks
- Add review video

### 10.6 Settings
- Site logo upload
- Favicon upload
- Bank accounts management
- Notification settings

---

## 11. Security Features

### 11.1 Rank Paper Anti-Cheat
- Tab switch detection → Blur content
- Right-click disabled
- Screenshot watermark (user ID + timestamp)
- Synchronized server-side timer

### 11.2 Content Protection
- Lesson access requires valid payment
- PDF downloads logged
- User-specific watermarks on materials

### 11.3 Authentication Security
- Phone OTP verification
- Password hashing
- Session management
- Rate limiting on OTP requests

---

## 12. Database Schema Summary

### Core Tables
- `profiles` - User information
- `user_roles` - Role assignments (admin, moderator, student)
- `classes` - Class definitions
- `class_months` - Monthly periods
- `class_days` - Individual class days
- `class_enrollments` - Student enrollments
- `lessons` - Learning materials
- `payments` - Payment records
- `bank_accounts` - Admin bank details

### Rank Papers
- `rank_papers` - Quiz definitions
- `rank_mcq_questions` - MCQ questions
- `rank_mcq_options` - Answer options
- `rank_attempts` - Student attempts
- `rank_answers_mcq` - MCQ responses
- `rank_answers_uploads` - Essay uploads
- `rank_marks` - Scores

### Shop
- `shop_products` - Products
- `shop_orders` - Orders
- `shop_order_items` - Order items

### Other
- `coupons` - Discount codes
- `coupon_usages` - Usage tracking
- `notifications` - System notifications
- `otp_requests` - OTP verification records

---

## 13. Storage Buckets

| Bucket | Purpose | Access |
|--------|---------|--------|
| `payment-slips` | Bank transfer proof | Private (user + admin) |
| `essay-uploads` | Student answer sheets | Private (user + admin) |
| `lesson-materials` | PDFs, notes | Private (paid users) |
| `rank-paper-assets` | Question images, PDFs | Private (paid users) |
| `shop-products` | Product PDFs | Private (purchased) |
| `past-papers` | Past paper PDFs | Public |
| `site-assets` | Logo, favicon | Public |

---

## 14. API Integrations

### Text.lk SMS Gateway
- Endpoint: `https://app.text.lk/api/v3/sms/send`
- Purpose: OTP delivery for registration, password reset, private class enrollment
- Sender ID: Configured by admin

---

## 15. UI/UX Guidelines

### Design Principles
- Clean, minimal interface
- No fancy animations
- Card-based layouts
- Clear navigation
- Mobile-first responsive

### Color Scheme
- Primary: Blue gradient
- Background: Dark slate (auth pages), Light (dashboard)
- Success: Green
- Warning: Amber
- Error: Red

### Typography
- Clear, readable fonts
- Proper hierarchy (H1 → H6)
- Adequate spacing

---

## 16. Contact Us Section

- Admin-managed contact information
- Phone number(s)
- Email address
- Social media links
- WhatsApp link (optional)

---

## Implementation Priority

### Phase 1 - Core
1. Authentication (login, register, password reset)
2. User profiles
3. Admin panel base
4. Classes (create, enroll, manage)
5. Lessons (CRUD, access control)
6. Bank payments

### Phase 2 - Content
1. Rank papers (MCQ section)
2. Rank papers (essay sections)
3. Marking system
4. Leaderboard
5. Review videos

### Phase 3 - Commerce
1. Shop products
2. Cart & checkout
3. Coupon system
4. Past papers
5. School papers

### Phase 4 - Polish
1. Notifications
2. Private classes
3. Broadcast messages
4. Site settings
5. Advanced analytics

---

*Document Version: 1.0*
*Last Updated: February 2026*
