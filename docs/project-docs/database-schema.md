# The Base Movement - Database Schema Documentation (Status: Production Sync Complete)

This document outlines the authoritative database schema for "The Base" platform. All primary tables identified below have been successfully provisioned in the Neon PostgreSQL production environment.

## [DONE] 1. Users Table (Patriots)
Stores the core membership data for both Local (Ghana) and Diaspora members.

| Field Name | Type | Description | Status |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | DONE |
| `full_name` | VARCHAR(255) | Full name as per official ID | DONE |
| `email` | VARCHAR(255) | Unique identifier for login | DONE |
| `registration_number` | VARCHAR(50) | Unique ID (e.g., GH-2024-123456) | DONE |
| `platform` | VARCHAR(50) | Membership classification | DONE |
| `country` | VARCHAR(100) | Country of residence | DONE |
| `phone_number` | VARCHAR(20) | Full contact number | DONE |
| `gender` | VARCHAR(50) | User gender | DONE |
| `region` | VARCHAR(100) | Region (for Ghana platform) | DONE |
| `constituency` | VARCHAR(100) | Constituency (for Ghana platform) | DONE |
| `chapter` | VARCHAR(100) | Assigned chapter name | DONE |
| `joined_at` | TIMESTAMP | Creation date | DONE |
| `status` | VARCHAR(50) | Account status | DONE |

## [DONE] 2. Blog Posts Table (Insights)
Stores the movement's policy briefs, news, and analysis.

| Field Name | Type | Status |
| :--- | :--- | :--- |
| `id` | UUID | DONE |
| `title` | VARCHAR(255) | DONE |
| `slug` | VARCHAR(255) | DONE |
| `excerpt` | TEXT | DONE |
| `content` | TEXT | DONE |
| `author_id` | UUID | DONE |
| `category` | VARCHAR(100) | DONE |
| `published_at` | TIMESTAMP | DONE |
| `tags` | TEXT[] | DONE |

## [DONE] 3. Comments Table (Discussion)
Stores community interaction on blog posts.

| Field Name | Type | Status |
| :--- | :--- | :--- |
| `id` | UUID | DONE |
| `post_id` | UUID | DONE |
| `author_name` | VARCHAR(255) | DONE |
| `content` | TEXT | DONE |
| `created_at` | TIMESTAMP | DONE |

## [DONE] 4. Store Inventory (Movement Gear)
Stores items available in the official store. (Mapped from `Products` in initial design).

| Field Name | Type | Status |
| :--- | :--- | :--- |
| `id` | UUID | DONE |
| `name` | VARCHAR(255) | DONE |
| `category` | VARCHAR(100) | DONE |
| `price_ghs` | DECIMAL | DONE |
| `stock_quantity` | INTEGER | DONE |
| `status` | VARCHAR(50) | DONE |

## [DONE] 5. Reviews Table (Product Feedback)
Stores verified member feedback on store items.

| Field Name | Type | Status |
| :--- | :--- | :--- |
| `id` | UUID | DONE |
| `product_id` | UUID | DONE |
| `author_name` | VARCHAR(255) | DONE |
| `rating` | INTEGER | DONE |
| `content` | TEXT | DONE |

## [DONE] 6. Chapters Table (Hubs)
Stores the global network of regional and diaspora hubs. Fully synchronized with 80+ records.

| Field Name | Type | Status |
| :--- | :--- | :--- |
| `id` | UUID | DONE |
| `name` | VARCHAR(255) | DONE |
| `city_or_region` | VARCHAR(255) | DONE |
| `country` | VARCHAR(100) | DONE |
| `member_count` | INTEGER | DONE |
| `description` | TEXT | DONE |
| `details_url` | TEXT | DONE |
| `status` | VARCHAR(50) | DONE |

## [DONE] 7. Feedback Table
Stores movement-wide feedback and response data.

| Field Name | Type | Status |
| :--- | :--- | :--- |
| `id` | UUID | DONE |
| `question` | TEXT | DONE |
| `status` | VARCHAR(50) | DONE |
| `total_votes` | INTEGER | DONE |

## [DONE] 8. Poll Options Table
Stores specific choices for each poll.

| Field Name | Type | Status |
| :--- | :--- | :--- |
| `id` | UUID | DONE |
| `poll_id` | UUID | DONE |
| `label` | VARCHAR(255) | DONE |
| `votes` | INTEGER | DONE |

## [DONE] 9. Brand Settings Table
Stores authoritative contact information and brand identity details.

| Field Name | Type | Status |
| :--- | :--- | :--- |
| `id` | UUID | DONE |
| `phone_primary` | VARCHAR(20) | DONE |
| `email_official` | VARCHAR(255) | DONE |
| `brand_green` | VARCHAR(7) | DONE |
| `brand_gold` | VARCHAR(7) | DONE |
| `brand_red` | VARCHAR(7) | DONE |

## [DONE] 10. Audit Logs Table (Accountability)
Stores high-fidelity tracking of administrative actions.

| Field Name | Type | Status |
| :--- | :--- | :--- |
| `id` | UUID | DONE |
| `timestamp` | TIMESTAMP | DONE |
| `action` | VARCHAR(100) | DONE |
| `status` | VARCHAR(50) | DONE |

## [DONE] 11. Sentiment Analysis Table (Intelligence)
Stores psychological engagement telemetry.

| Field Name | Type | Status |
| :--- | :--- | :--- |
| `id` | UUID | DONE |
| `topic` | VARCHAR(255) | DONE |
| `score` | INTEGER | DONE |
| `sentiment` | VARCHAR(50) | DONE |

## [DONE] 12. Regional Performance Table (Mobilization)
Stores mobilization metrics for regional chapters.

| Field Name | Type | Status |
| :--- | :--- | :--- |
| `id` | UUID | DONE |
| `region_name` | VARCHAR(100) | DONE |
| `member_count` | INTEGER | DONE |
| `performance` | VARCHAR(50) | DONE |

## [DONE] 13. Countries Reference Table
Stores the authoritative list of supported countries and dialing codes.

| Field Name | Type | Status |
| :--- | :--- | :--- |
| `id` | UUID | DONE |
| `name` | VARCHAR(255) | DONE |
| `dialing_code` | VARCHAR(10) | DONE |

## [DONE] Geographic Master Data
Reference tables for Ghana administrative structure.

| Table Name | Description | Status |
| :--- | :--- | :--- |
| `ghana_regions` | 16 administrative regions | DONE |
| `ghana_constituencies` | 275 electoral constituencies | DONE |

---
*Last updated: May 3, 2026 - All tables provisioned and synchronized.*
