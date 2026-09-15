CREATE TABLE `password_reset_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tokenHash` varchar(255) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `password_reset_tokens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`teacherId` int NOT NULL,
	`classId` int NOT NULL,
	`message` text NOT NULL,
	`studentFileName` varchar(255),
	`studentFileUrl` text,
	`studentStorageKey` varchar(500),
	`studentMimeType` varchar(150),
	`studentFileSize` int,
	`teacherResponse` text,
	`teacherFileName` varchar(255),
	`teacherFileUrl` text,
	`teacherStorageKey` varchar(500),
	`teacherMimeType` varchar(150),
	`teacherFileSize` int,
	`status` enum('open','answered','closed') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`answeredAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `password_reset_tokens` ADD CONSTRAINT `password_reset_tokens_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `questions` ADD CONSTRAINT `questions_studentId_users_id_fk` FOREIGN KEY (`studentId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `questions` ADD CONSTRAINT `questions_teacherId_users_id_fk` FOREIGN KEY (`teacherId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `questions` ADD CONSTRAINT `questions_classId_classes_id_fk` FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE cascade ON UPDATE no action;