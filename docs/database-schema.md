# The Base Movement - Database Schema Documentation

This document outlines the authoritative database schema for "The Base" platform, reflecting the data requirements identified across all modernized components.

## 1. Users Table (Patriots)
Stores the core membership data for both Local (Ghana) and Diaspora members.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `full_name` | VARCHAR(255) | Full name as per official ID |
| `email` | VARCHAR(255) | Unique identifier for login |
| `password_hash` | TEXT | Securely hashed password |
| `registration_number` | VARCHAR(50) | Unique ID (e.g., GH-2024-123456 or DI-2024-123456) |
| `platform` | ENUM('GHANA', 'DIASPORA') | Membership classification |
| `country` | VARCHAR(100) | Country of residence |
| `country_code` | VARCHAR(10) | International phone prefix |
| `phone_number` | VARCHAR(20) | Full contact number |
| `age_range` | VARCHAR(20) | Age category (e.g., 16-25, 26-40) |
| `gender` | ENUM('Male', 'Female') | User gender |
| `residential_address` | TEXT | Physical location |
| `region` | VARCHAR(100) | Region (for Ghana platform) |
| `constituency` | VARCHAR(100) | Constituency (for Ghana platform) |
| `chapter` | VARCHAR(100) | Assigned chapter name |
| `profession` | VARCHAR(255) | Professional background |
| `education_level` | VARCHAR(100) | Highest education attained |
| `avatar_url` | TEXT | Link to cropped passport photo |
| `emergency_contact_name` | VARCHAR(255) | Name of emergency contact |
| `emergency_relationship` | VARCHAR(100) | Relationship to member |
| `emergency_phone` | VARCHAR(20) | Emergency contact number |
| `joined_at` | TIMESTAMP | Creation date |
| `status` | ENUM('Active', 'Inactive', 'Suspended') | Account status |

## 2. Blog Posts Table (Insights)
Stores the movement's policy briefs, news, and analysis.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `title` | VARCHAR(255) | Post title |
| `slug` | VARCHAR(255) | URL-friendly identifier |
| `excerpt` | TEXT | Brief summary for cards |
| `content` | TEXT | Main HTML/Markdown content |
| `author_id` | UUID | Reference to author (Admin/Leader) |
| `category` | VARCHAR(100) | e.g., Movement, Youth, Economy |
| `image_url` | TEXT | Featured image link |
| `read_time` | VARCHAR(20) | Estimated reading time |
| `is_featured` | BOOLEAN | Highlighted status |
| `published_at` | TIMESTAMP | Date of publication |
| `tags` | TEXT[] | Array of post tags |

## 3. Comments Table (Discussion)
Stores community interaction on blog posts.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `post_id` | UUID | Foreign Key to Blog Posts |
| `author_name` | VARCHAR(255) | Member name |
| `content` | TEXT | Comment body |
| `created_at` | TIMESTAMP | Time of posting |
| `is_flagged` | BOOLEAN | Moderation status |

## 4. Products Table (Movement Gear)
Stores items available in the official store.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `name` | VARCHAR(255) | Product name |
| `slug` | VARCHAR(255) | URL-friendly identifier |
| `price` | DECIMAL(10,2) | Price in GHS |
| `description` | TEXT | Product specifications |
| `category` | VARCHAR(100) | Apparel, Accessories, etc. |
| `status` | VARCHAR(50) | Available, Coming Soon, Out of Stock |
| `image_url` | TEXT | Main product image |
| `rating` | DECIMAL(3,1) | Average member rating |
| `created_at` | TIMESTAMP | Date added to store |

## 5. Reviews Table (Product Feedback)
Stores verified member feedback on store items.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `product_id` | UUID | Foreign Key to Products |
| `author_name` | VARCHAR(255) | Member name |
| `rating` | INTEGER | Star rating (1-5) |
| `content` | TEXT | Review body |
| `is_verified` | BOOLEAN | Purchase verification status |
| `created_at` | TIMESTAMP | Time of review |

## 6. Chapters Table (Hubs)
Stores the global network of regional and diaspora hubs.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `name` | VARCHAR(255) | Chapter name |
| `city_or_region` | VARCHAR(255) | Specific location |
| `country` | VARCHAR(100) | Hub country |
| `member_count` | INTEGER | Number of active members |
| `leader_name` | VARCHAR(255) | Primary contact leader |
| `image_url` | TEXT | Chapter location photo |
| `created_at` | TIMESTAMP | Inception date |

## 7. Polls Table (Opinion)
Stores movement-wide opinion polls and response data.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `question` | TEXT | The poll question |
| `category` | VARCHAR(100) | Governance, Policy, etc. |
| `status` | ENUM('Active', 'Closed') | Current poll state |
| `total_votes` | INTEGER | Aggregate response count |
| `expired_at` | TIMESTAMP | Expiry deadline |
| `created_at` | TIMESTAMP | Creation date |

## 8. Poll Options Table
Stores specific choices for each poll.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `poll_id` | UUID | Foreign Key to Polls |
| `label` | VARCHAR(255) | Option text |
| `votes` | INTEGER | Specific response count |

## 9. Brand Settings Table
Stores authoritative contact information and brand identity details for the movement.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key (usually single record) |
| `phone_primary` | VARCHAR(20) | Official contact number |
| `phone_secondary` | VARCHAR(20) | Alternative contact number |
| `email_official` | VARCHAR(255) | Main institutional email |
| `email_support` | VARCHAR(255) | Member support email |
| `facebook_url` | TEXT | Official Facebook page link |
| `twitter_url` | TEXT | Official X/Twitter profile link |
| `instagram_url` | TEXT | Official Instagram profile link |
| `linkedin_url` | TEXT | Official LinkedIn company page |
| `whatsapp_number` | VARCHAR(20) | Official WhatsApp contact |
| `hq_address_line1` | TEXT | Physical headquarters address |
| `hq_city` | VARCHAR(100) | City of headquarters |
| `hq_region` | VARCHAR(100) | Region/State |
| `hq_country` | VARCHAR(100) | Headquarters country |
| `brand_green` | VARCHAR(7) | Primary brand green hex code |
| `brand_gold` | VARCHAR(7) | Primary brand gold hex code |
| `brand_red` | VARCHAR(7) | Primary brand red hex code |
| `brand_yellow` | VARCHAR(7) | Brand yellow/gold hex code |
| `brand_black` | VARCHAR(7) | Brand black hex code |
| `updated_at` | TIMESTAMP | Last configuration update |
