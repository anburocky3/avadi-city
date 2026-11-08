-- CreateTable
CREATE TABLE `complaints` (
    `id` VARCHAR(191) NOT NULL,
    `issue_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `sub_category` VARCHAR(191) NOT NULL,
    `incident_ward` INTEGER NOT NULL,
    `user_ward` INTEGER NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `lat` DOUBLE NOT NULL,
    `lng` DOUBLE NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Submitted',
    `image_url` VARCHAR(191) NULL,
    `image_urls` JSON NULL,
    `author` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NULL,
    `share_on_feed` BOOLEAN NOT NULL DEFAULT true,
    `device_platform` VARCHAR(191) NULL DEFAULT 'Web',
    `upvotes` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `complaints_issue_id_key`(`issue_id`),
    INDEX `complaints_incident_ward_idx`(`incident_ward`),
    INDEX `complaints_status_idx`(`status`),
    INDEX `complaints_issue_id_idx`(`issue_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `complaint_upvotes` (
    `id` VARCHAR(191) NOT NULL,
    `complaint_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `complaint_upvotes_complaint_id_idx`(`complaint_id`),
    INDEX `complaint_upvotes_user_id_idx`(`user_id`),
    UNIQUE INDEX `complaint_upvotes_complaint_id_user_id_key`(`complaint_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contact_submissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(191) NULL,
    `full_name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(15) NULL,
    `category` ENUM('technical', 'collaboration', 'feedback', 'civic_issue') NOT NULL,
    `ward_number` INTEGER NULL,
    `message` TEXT NOT NULL,
    `status` ENUM('pending', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'pending',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `contact_submissions_category_status_idx`(`category`, `status`),
    INDEX `contact_submissions_ward_number_idx`(`ward_number`),
    INDEX `contact_submissions_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `support_tickets` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NULL,
    `feature_category` ENUM('EXPLORE_PLACES', 'FOOD_DINING', 'HOSPITALS_PHARMACIES', 'LOCAL_SERVICES', 'RENT_PROPERTIES', 'JOB_VACANCIES', 'DONATIONS', 'TRAVEL_TRANSPORT', 'LOST_FOUND', 'SOS', 'COMPLAINTS', 'FEED', 'PROFILE', 'COMMERCE', 'TRANSIT', 'OTHER') NOT NULL,
    `sub_category` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `screenshot_url` TEXT NULL,
    `status` ENUM('OPEN', 'REVIEWING', 'RESOLVED') NOT NULL DEFAULT 'OPEN',
    `ward_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `support_tickets_feature_category_status_idx`(`feature_category`, `status`),
    INDEX `support_tickets_user_id_idx`(`user_id`),
    INDEX `support_tickets_ward_id_idx`(`ward_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `donation_requests` (
    `id` VARCHAR(191) NOT NULL,
    `display_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NULL,
    `created_by_name` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL,
    `urgency` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `ward` INTEGER NOT NULL,
    `address` TEXT NOT NULL,
    `lat` DOUBLE NULL,
    `lng` DOUBLE NULL,
    `beneficiary` VARCHAR(191) NOT NULL DEFAULT 'Individual',
    `items` JSON NULL,
    `target` JSON NULL,
    `required_by` VARCHAR(191) NULL,
    `contact_name` VARCHAR(191) NOT NULL,
    `contact_phone` VARCHAR(191) NOT NULL,
    `contact_whatsapp` VARCHAR(191) NOT NULL,
    `images` JSON NULL,
    `organisation` JSON NULL,
    `supporting_proof` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'approved',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `donation_requests_display_id_key`(`display_id`),
    INDEX `donation_requests_ward_idx`(`ward`),
    INDEX `donation_requests_status_idx`(`status`),
    INDEX `donation_requests_type_idx`(`type`),
    INDEX `donation_requests_urgency_idx`(`urgency`),
    INDEX `donation_requests_user_id_idx`(`user_id`),
    INDEX `donation_requests_display_id_idx`(`display_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `donation_reports` (
    `id` VARCHAR(191) NOT NULL,
    `donation_id` VARCHAR(191) NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `details` TEXT NULL,
    `reported_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `donation_reports_donation_id_idx`(`donation_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `feeds` (
    `id` VARCHAR(191) NOT NULL,
    `author_id` VARCHAR(191) NOT NULL,
    `ward` INTEGER NOT NULL,
    `text` LONGTEXT NOT NULL,
    `image_url` LONGTEXT NULL,
    `is_emergency` BOOLEAN NOT NULL DEFAULT false,
    `category` VARCHAR(191) NOT NULL DEFAULT 'general',
    `likes_count` INTEGER NOT NULL DEFAULT 0,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `complaint_id` VARCHAR(191) NULL,

    INDEX `feeds_author_id_idx`(`author_id`),
    INDEX `feeds_ward_idx`(`ward`),
    INDEX `feeds_category_timestamp_idx`(`category`, `timestamp`),
    INDEX `feeds_complaint_id_idx`(`complaint_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `comments` (
    `id` VARCHAR(191) NOT NULL,
    `feed_id` VARCHAR(191) NOT NULL,
    `author_id` VARCHAR(191) NULL,
    `author` VARCHAR(191) NOT NULL,
    `text` TEXT NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `comments_feed_id_idx`(`feed_id`),
    INDEX `comments_author_id_idx`(`author_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `feed_likes` (
    `id` VARCHAR(191) NOT NULL,
    `feed_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `feed_likes_feed_id_idx`(`feed_id`),
    INDEX `feed_likes_user_id_idx`(`user_id`),
    UNIQUE INDEX `feed_likes_feed_id_user_id_key`(`feed_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `food_listings` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `ward` INTEGER NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `image_url` TEXT NULL,
    `opening_time` VARCHAR(191) NULL,
    `closing_time` VARCHAR(191) NULL,
    `food_type` VARCHAR(191) NULL,
    `price_range` VARCHAR(191) NULL,
    `website` VARCHAR(191) NULL,
    `additional_details` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `owner_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `food_listings_ward_idx`(`ward`),
    INDEX `food_listings_category_idx`(`category`),
    INDEX `food_listings_status_idx`(`status`),
    INDEX `food_listings_owner_id_idx`(`owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `food_reviews` (
    `id` VARCHAR(191) NOT NULL,
    `shop_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `rating` INTEGER NOT NULL,
    `review_text` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `food_reviews_shop_id_idx`(`shop_id`),
    INDEX `food_reviews_user_id_idx`(`user_id`),
    UNIQUE INDEX `food_reviews_shop_id_user_id_key`(`shop_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `food_favorites` (
    `id` VARCHAR(191) NOT NULL,
    `shop_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `food_favorites_shop_id_idx`(`shop_id`),
    INDEX `food_favorites_user_id_idx`(`user_id`),
    UNIQUE INDEX `food_favorites_shop_id_user_id_key`(`shop_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `food_recently_viewed` (
    `id` VARCHAR(191) NOT NULL,
    `shop_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `viewed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `food_recently_viewed_shop_id_idx`(`shop_id`),
    INDEX `food_recently_viewed_user_id_idx`(`user_id`),
    INDEX `food_recently_viewed_viewed_at_idx`(`viewed_at`),
    UNIQUE INDEX `food_recently_viewed_shop_id_user_id_key`(`shop_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `healthcare_facilities` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `facility_type` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `alternate_phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `address` TEXT NOT NULL,
    `area_landmark` VARCHAR(191) NULL,
    `ward` INTEGER NOT NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `is_24x7` BOOLEAN NOT NULL DEFAULT false,
    `opening_time` VARCHAR(191) NULL,
    `closing_time` VARCHAR(191) NULL,
    `image_url` TEXT NULL,
    `additional_images` JSON NULL,
    `services` JSON NULL,
    `emergency_available` BOOLEAN NOT NULL DEFAULT false,
    `ambulance_available` BOOLEAN NOT NULL DEFAULT false,
    `ambulance_phone` VARCHAR(191) NULL,
    `appointments` VARCHAR(191) NULL,
    `consultation_fee` DOUBLE NULL,
    `home_delivery` BOOLEAN NOT NULL DEFAULT false,
    `payment_methods` JSON NULL,
    `website` VARCHAR(191) NULL,
    `social_link` VARCHAR(191) NULL,
    `key_services` JSON NULL,
    `additional_details` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `owner_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `healthcare_facilities_ward_idx`(`ward`),
    INDEX `healthcare_facilities_facility_type_idx`(`facility_type`),
    INDEX `healthcare_facilities_category_idx`(`category`),
    INDEX `healthcare_facilities_status_idx`(`status`),
    INDEX `healthcare_facilities_owner_id_idx`(`owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `job_vacancies` (
    `id` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `job_type` VARCHAR(191) NOT NULL,
    `work_mode` VARCHAR(191) NOT NULL DEFAULT 'On-site',
    `experience` VARCHAR(191) NOT NULL,
    `salary` VARCHAR(191) NOT NULL,
    `min_salary` INTEGER NULL,
    `max_salary` INTEGER NULL,
    `salary_type` VARCHAR(191) NULL DEFAULT 'Per Month',
    `business_name` VARCHAR(191) NOT NULL,
    `company_description` TEXT NULL,
    `details` TEXT NOT NULL,
    `requirements` TEXT NULL,
    `qualifications` VARCHAR(191) NULL,
    `openings` INTEGER NOT NULL DEFAULT 1,
    `gender` VARCHAR(191) NULL DEFAULT 'Any',
    `min_age` INTEGER NULL,
    `max_age` INTEGER NULL,
    `location` VARCHAR(191) NOT NULL,
    `ward` INTEGER NOT NULL,
    `address` TEXT NOT NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `working_days` TEXT NULL,
    `shift` VARCHAR(191) NULL,
    `application_methods` VARCHAR(191) NULL,
    `contact` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `website` VARCHAR(191) NULL,
    `interview_address` TEXT NULL,
    `interview_contact_person` VARCHAR(191) NULL,
    `interview_date` VARCHAR(191) NULL,
    `interview_time` VARCHAR(191) NULL,
    `deadline` VARCHAR(191) NULL,
    `start_date` VARCHAR(191) NULL,
    `image_url` TEXT NULL,
    `additional_info` TEXT NULL,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `owner_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `job_vacancies_ward_idx`(`ward`),
    INDEX `job_vacancies_category_idx`(`category`),
    INDEX `job_vacancies_job_type_idx`(`job_type`),
    INDEX `job_vacancies_status_idx`(`status`),
    INDEX `job_vacancies_featured_idx`(`featured`),
    INDEX `job_vacancies_owner_id_idx`(`owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `job_applications` (
    `id` VARCHAR(191) NOT NULL,
    `job_id` VARCHAR(191) NOT NULL,
    `applicant_id` VARCHAR(191) NULL,
    `full_name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `resume_url` TEXT NOT NULL,
    `resume_file_name` VARCHAR(191) NULL,
    `cover_letter` TEXT NULL,
    `qualification` VARCHAR(191) NULL,
    `experience` TEXT NULL,
    `skills` TEXT NULL,
    `portfolio_url` VARCHAR(191) NULL,
    `status` ENUM('SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW', 'HIRED', 'REJECTED') NOT NULL DEFAULT 'SUBMITTED',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `job_applications_job_id_idx`(`job_id`),
    INDEX `job_applications_applicant_id_idx`(`applicant_id`),
    INDEX `job_applications_email_idx`(`email`),
    INDEX `job_applications_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lost_found_items` (
    `id` VARCHAR(191) NOT NULL,
    `item_id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `ward` INTEGER NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `lost_found_date` VARCHAR(191) NOT NULL,
    `lost_found_time` VARCHAR(191) NULL,
    `image_url` VARCHAR(191) NULL,
    `image_urls` JSON NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Active',
    `resolved_at` DATETIME(3) NULL,
    `contact_phone` VARCHAR(191) NOT NULL,
    `contact_name` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lost_found_items_item_id_key`(`item_id`),
    INDEX `lost_found_items_ward_idx`(`ward`),
    INDEX `lost_found_items_type_idx`(`type`),
    INDEX `lost_found_items_status_idx`(`status`),
    INDEX `lost_found_items_user_id_idx`(`user_id`),
    INDEX `lost_found_items_item_id_idx`(`item_id`),
    INDEX `lost_found_items_ward_type_status_idx`(`ward`, `type`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lost_found_claims` (
    `id` VARCHAR(191) NOT NULL,
    `lost_found_item_id` VARCHAR(191) NOT NULL,
    `requester_id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `image_url` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `lost_found_claims_lost_found_item_id_idx`(`lost_found_item_id`),
    INDEX `lost_found_claims_requester_id_idx`(`requester_id`),
    INDEX `lost_found_claims_owner_id_idx`(`owner_id`),
    INDEX `lost_found_claims_status_idx`(`status`),
    UNIQUE INDEX `lost_found_claims_lost_found_item_id_requester_id_key`(`lost_found_item_id`, `requester_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `explore_places` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `address` TEXT NOT NULL,
    `area_landmark` VARCHAR(191) NULL,
    `ward` INTEGER NOT NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `is_24x7` BOOLEAN NOT NULL DEFAULT false,
    `opening_time` VARCHAR(191) NULL,
    `closing_time` VARCHAR(191) NULL,
    `entry_fee_type` VARCHAR(191) NOT NULL DEFAULT 'Free Entry',
    `entry_fee_amount` DOUBLE NULL,
    `image_url` TEXT NULL,
    `additional_images` JSON NULL,
    `activities` JSON NULL,
    `visitor_types` JSON NULL,
    `facilities` JSON NULL,
    `best_time_to_visit` VARCHAR(191) NULL,
    `guidelines` TEXT NULL,
    `phone` VARCHAR(191) NULL,
    `website` VARCHAR(191) NULL,
    `official_url` VARCHAR(191) NULL,
    `additional_details` TEXT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `owner_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `explore_places_ward_idx`(`ward`),
    INDEX `explore_places_category_idx`(`category`),
    INDEX `explore_places_status_idx`(`status`),
    INDEX `explore_places_owner_id_idx`(`owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `place_reviews` (
    `id` VARCHAR(191) NOT NULL,
    `place_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `rating` INTEGER NOT NULL,
    `review_text` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `place_reviews_place_id_idx`(`place_id`),
    INDEX `place_reviews_user_id_idx`(`user_id`),
    UNIQUE INDEX `place_reviews_place_id_user_id_key`(`place_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rental_listings` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `property_type_tag` VARCHAR(191) NULL,
    `rent` INTEGER NOT NULL,
    `advance` INTEGER NOT NULL,
    `contact` VARCHAR(191) NOT NULL,
    `owner_name` VARCHAR(191) NULL,
    `location` VARCHAR(191) NULL,
    `ward` INTEGER NOT NULL,
    `image_url` LONGTEXT NULL,
    `details` TEXT NOT NULL,
    `features` LONGTEXT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `rental_listings_ward_idx`(`ward`),
    INDEX `rental_listings_status_idx`(`status`),
    INDEX `rental_listings_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service_profiles` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL DEFAULT '',
    `category` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `ward` INTEGER NOT NULL,
    `experience` VARCHAR(191) NULL,
    `hours` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `specialty` VARCHAR(191) NULL,
    `rate` VARCHAR(191) NULL,
    `image_url` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `submitted_by_id` VARCHAR(191) NOT NULL,
    `rejection_reason` VARCHAR(191) NULL,
    `reviewed_by_id` VARCHAR(191) NULL,
    `reviewed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `service_profiles_ward_idx`(`ward`),
    INDEX `service_profiles_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `gender` ENUM('Male', 'Female', 'Other') NOT NULL,
    `dob` DATETIME(3) NOT NULL,
    `blood_group` ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `avatar` LONGTEXT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NULL,
    `ward_number` INTEGER NOT NULL,
    `street_name` VARCHAR(191) NOT NULL,
    `notification_enabled` BOOLEAN NOT NULL DEFAULT false,
    `is_verified` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_phone_key`(`phone`),
    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_ward_number_idx`(`ward_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `verification_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `otp` VARCHAR(191) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `verification_tokens_email_idx`(`email`),
    UNIQUE INDEX `verification_tokens_email_otp_key`(`email`, `otp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `volunteers` (
    `id` VARCHAR(191) NOT NULL,
    `display_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NULL,
    `full_name` VARCHAR(191) NOT NULL,
    `ward` INTEGER NOT NULL,
    `gender` VARCHAR(191) NOT NULL,
    `age` INTEGER NOT NULL,
    `dob` VARCHAR(191) NULL,
    `mobile` VARCHAR(191) NOT NULL,
    `whatsapp` VARCHAR(191) NOT NULL,
    `area` VARCHAR(191) NOT NULL,
    `show_phone_public` BOOLEAN NOT NULL DEFAULT true,
    `emergency_name` VARCHAR(191) NOT NULL,
    `emergency_phone` VARCHAR(191) NOT NULL,
    `emergency_relationship` VARCHAR(191) NOT NULL,
    `languages` JSON NOT NULL,
    `interests` JSON NOT NULL,
    `skills` JSON NOT NULL,
    `other_skill` VARCHAR(191) NULL,
    `experience` VARCHAR(191) NOT NULL,
    `bio` TEXT NULL,
    `vehicle` VARCHAR(191) NOT NULL,
    `availability` JSON NOT NULL,
    `blood_group` VARCHAR(191) NOT NULL,
    `will_donate_blood` BOOLEAN NOT NULL DEFAULT false,
    `last_donation` VARCHAR(191) NULL,
    `fitness` VARCHAR(191) NOT NULL DEFAULT 'Yes',
    `conditions` TEXT NULL,
    `guardian` JSON NULL,
    `conduct_consent` BOOLEAN NOT NULL DEFAULT true,
    `directory_consent` BOOLEAN NOT NULL DEFAULT true,
    `truthful_consent` BOOLEAN NOT NULL DEFAULT true,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `volunteers_display_id_key`(`display_id`),
    INDEX `volunteers_ward_idx`(`ward`),
    INDEX `volunteers_status_idx`(`status`),
    INDEX `volunteers_user_id_idx`(`user_id`),
    INDEX `volunteers_display_id_idx`(`display_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `complaints` ADD CONSTRAINT `complaints_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `complaint_upvotes` ADD CONSTRAINT `complaint_upvotes_complaint_id_fkey` FOREIGN KEY (`complaint_id`) REFERENCES `complaints`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `complaint_upvotes` ADD CONSTRAINT `complaint_upvotes_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contact_submissions` ADD CONSTRAINT `contact_submissions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `support_tickets` ADD CONSTRAINT `support_tickets_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `donation_requests` ADD CONSTRAINT `donation_requests_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `donation_reports` ADD CONSTRAINT `donation_reports_donation_id_fkey` FOREIGN KEY (`donation_id`) REFERENCES `donation_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feeds` ADD CONSTRAINT `feeds_complaint_id_fkey` FOREIGN KEY (`complaint_id`) REFERENCES `complaints`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feeds` ADD CONSTRAINT `feeds_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comments` ADD CONSTRAINT `comments_feed_id_fkey` FOREIGN KEY (`feed_id`) REFERENCES `feeds`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comments` ADD CONSTRAINT `comments_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feed_likes` ADD CONSTRAINT `feed_likes_feed_id_fkey` FOREIGN KEY (`feed_id`) REFERENCES `feeds`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feed_likes` ADD CONSTRAINT `feed_likes_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `food_listings` ADD CONSTRAINT `food_listings_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `food_reviews` ADD CONSTRAINT `food_reviews_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `food_favorites` ADD CONSTRAINT `food_favorites_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `food_recently_viewed` ADD CONSTRAINT `food_recently_viewed_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `healthcare_facilities` ADD CONSTRAINT `healthcare_facilities_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_vacancies` ADD CONSTRAINT `job_vacancies_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_applications` ADD CONSTRAINT `job_applications_job_id_fkey` FOREIGN KEY (`job_id`) REFERENCES `job_vacancies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_applications` ADD CONSTRAINT `job_applications_applicant_id_fkey` FOREIGN KEY (`applicant_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lost_found_items` ADD CONSTRAINT `lost_found_items_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lost_found_claims` ADD CONSTRAINT `lost_found_claims_lost_found_item_id_fkey` FOREIGN KEY (`lost_found_item_id`) REFERENCES `lost_found_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lost_found_claims` ADD CONSTRAINT `lost_found_claims_requester_id_fkey` FOREIGN KEY (`requester_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lost_found_claims` ADD CONSTRAINT `lost_found_claims_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `explore_places` ADD CONSTRAINT `explore_places_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `place_reviews` ADD CONSTRAINT `place_reviews_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `volunteers` ADD CONSTRAINT `volunteers_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
