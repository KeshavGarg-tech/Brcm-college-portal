CREATE TABLE `assignment_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assignmentId` int NOT NULL,
	`studentId` int NOT NULL,
	`message` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assignment_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assignment_replies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`questionId` int NOT NULL,
	`authorId` int NOT NULL,
	`message` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assignment_replies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `attendance_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`studentId` int NOT NULL,
	`status` enum('present','absent','late') NOT NULL DEFAULT 'present',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attendance_records_id` PRIMARY KEY(`id`),
	CONSTRAINT `attendance_records_sessionId_studentId_unique` UNIQUE(`sessionId`,`studentId`)
);
--> statement-breakpoint
CREATE TABLE `attendance_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classId` int NOT NULL,
	`teacherId` int NOT NULL,
	`sessionDate` timestamp NOT NULL,
	`topic` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attendance_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `attendance_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classId` int NOT NULL,
	`minimumPercentage` int NOT NULL DEFAULT 75,
	`updatedBy` int NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `attendance_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `attendance_settings_classId_unique` UNIQUE(`classId`)
);
--> statement-breakpoint
ALTER TABLE `assignment_questions` ADD CONSTRAINT `assignment_questions_assignmentId_assignments_id_fk` FOREIGN KEY (`assignmentId`) REFERENCES `assignments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assignment_questions` ADD CONSTRAINT `assignment_questions_studentId_users_id_fk` FOREIGN KEY (`studentId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assignment_replies` ADD CONSTRAINT `assignment_replies_questionId_assignment_questions_id_fk` FOREIGN KEY (`questionId`) REFERENCES `assignment_questions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assignment_replies` ADD CONSTRAINT `assignment_replies_authorId_users_id_fk` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendance_records` ADD CONSTRAINT `attendance_records_sessionId_attendance_sessions_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `attendance_sessions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendance_records` ADD CONSTRAINT `attendance_records_studentId_users_id_fk` FOREIGN KEY (`studentId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendance_sessions` ADD CONSTRAINT `attendance_sessions_classId_classes_id_fk` FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendance_sessions` ADD CONSTRAINT `attendance_sessions_teacherId_users_id_fk` FOREIGN KEY (`teacherId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendance_settings` ADD CONSTRAINT `attendance_settings_classId_classes_id_fk` FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendance_settings` ADD CONSTRAINT `attendance_settings_updatedBy_users_id_fk` FOREIGN KEY (`updatedBy`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;