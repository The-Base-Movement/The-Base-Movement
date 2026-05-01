# Database Schema Design: The Base Platform

This document outlines the authoritative database schema for "The Base" movement platform. The schema is designed for scalability, performance, and strict alignment with the movement's mission-driven data requirements.

## 1. User Profiles & Membership (`users`)
Stores core identity and platform-specific membership data.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Unique identifier for the user. |
| `full_name` | VARCHAR(255) | Official name for membership cards. |
| `email` | VARCHAR(255) | Primary contact and login identifier. |
| `phone` | VARCHAR(20) | Contact number. |
| `reg_no` | VARCHAR(50) | Unique registration number (e.g., GH-123456). |
| `platform` | ENUM | `GHANA` or `DIASPORA`. |
| `region` | VARCHAR(100) | For Ghana platform users. |
| `constituency` | VARCHAR(100) | For Ghana platform users. |
| `country` | VARCHAR(100) | For Diaspora platform users. |
| `profession` | VARCHAR(100) | Member's professional background. |
| `gender` | ENUM | `MALE`, `FEMALE`, `OTHER`. |
| `avatar_url` | TEXT | URL to the member's profile photo. |
| `bio` | TEXT | Short professional/personal mission statement. |
| `status` | ENUM | `ACTIVE`, `INACTIVE`, `VERIFIED`. |
| `joined_at` | TIMESTAMP | Date of registration. |

## 2. Platform Engagement (`chapters` & `memberships`)
Tracks user involvement in specific movement chapters.

### `chapters`
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Unique identifier for the chapter. |
| `name` | VARCHAR(255) | Official chapter name (e.g., Accra Central Hub). |
| `city_or_region`| VARCHAR(100) | Local jurisdiction. |
| `country` | VARCHAR(100) | Country of operation. |
| `description` | TEXT | Mission and focus of the chapter. |
| `status` | VARCHAR(50) | `Active`, `Pending`, etc. |
| `members_count` | INT | Cached member count for performance. |

### `chapter_members`
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Unique identifier. |
| `user_id` | UUID (FK) | Reference to `users.id`. |
| `chapter_id` | UUID (FK) | Reference to `chapters.id`. |
| `role` | VARCHAR(50) | `MEMBER`, `LEADER`, `COORDINATOR`. |
| `joined_at` | TIMESTAMP | Date member joined this chapter. |

### `chapter_join_requests`
Handles the membership approval workflow where chapter leaders must verify and approve new members.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Unique identifier. |
| `user_id` | UUID (FK) | Reference to `users.id`. |
| `chapter_id` | UUID (FK) | Reference to `chapters.id`. |
| `status` | ENUM | `PENDING`, `APPROVED`, `REJECTED`. |
| `message` | TEXT | Optional note from the member. |
| `requested_at` | TIMESTAMP | Time request was submitted. |
| `processed_at` | TIMESTAMP | Time leader approved/rejected the request. |
| `processed_by` | UUID (FK) | Reference to `users.id` (the leader/coordinator). |

## 3. Product & Store Management (`products`)
Authoritative schema for movement merchandise and resources.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Unique identifier for the product. |
| `title` | VARCHAR(255) | Name of the item. |
| `description` | TEXT | Detailed product description. |
| `price` | DECIMAL(10,2) | Cost in GHS/USD. |
| `category` | VARCHAR(100) | e.g., Apparel, Literature, Donation Tiers. |
| `stock_quantity`| INT | Inventory management. |
| `image_url` | TEXT | Primary product image. |
| `is_active` | BOOLEAN | Whether the item is visible in the store. |

## 4. Financial Transactions (`payments`)
Tracks all financial contributions and store purchases.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Unique identifier for the transaction. |
| `user_id` | UUID (FK) | Reference to `users.id`. |
| `amount` | DECIMAL(12,2) | Transaction value. |
| `currency` | VARCHAR(3) | `GHS`, `USD`, `GBP`, etc. |
| `status` | ENUM | `PENDING`, `SUCCESS`, `FAILED`. |
| `type` | ENUM | `DONATION`, `STORE_PURCHASE`, `MEMBERSHIP_FEE`. |
| `gateway_ref` | VARCHAR(255) | Transaction ID from Paystack/Stripe/etc. |
| `created_at` | TIMESTAMP | Time of transaction. |

## 5. Communications & Support (`contact_messages`)
Records all inquiries sent through the contact form.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Unique identifier. |
| `full_name` | VARCHAR(255) | Name of sender. |
| `email` | VARCHAR(255) | Email of sender. |
| `phone` | VARCHAR(20) | Phone of sender (optional). |
| `platform` | VARCHAR(50) | `GHANA` or `DIASPORA`. |
| `subject` | VARCHAR(255) | Message subject. |
| `message` | TEXT | Full content of the inquiry. |
| `is_resolved` | BOOLEAN | Tracking status for support team. |
| `created_at` | TIMESTAMP | Time of submission. |

## 6. Impact & Polls (`polls` & `responses`)
Data structures for civic engagement and movement transparency.

### `polls`
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Unique identifier. |
| `question` | TEXT | The poll question. |
| `category` | VARCHAR(100) | e.g., Policy, Governance, Regional. |
| `status` | ENUM | `ACTIVE`, `CLOSED`. |
| `expired_at` | TIMESTAMP | Absolute time when voting ends. Triggers countdown. |
| `total_votes` | INT | Cached vote count for performance. |
| `created_at` | TIMESTAMP | When the poll was created. |

### Other Tables
| Table | Description |
| :--- | :--- |
| `poll_options` | Available choices for a specific poll. |
| `poll_votes` | Individual votes cast by verified members. |

---
> [!IMPORTANT]
> All primary keys should use UUIDs for security and future distributed database compatibility. Timestamps for `created_at` and `updated_at` must be included on every table for audit transparency.
