-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: nism
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `certificate_types`
--

DROP TABLE IF EXISTS `certificate_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `certificate_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `certificate_types`
--

LOCK TABLES `certificate_types` WRITE;
/*!40000 ALTER TABLE `certificate_types` DISABLE KEYS */;
INSERT INTO `certificate_types` VALUES (33,'IBBI: Valuation Examination in the Asset class: Land and Building'),(34,'IBBI: Valuation Examination in the Asset class: Plant and Machinery'),(35,'IBBI: Valuation Examination in the Asset class: Securities or Financial Assets'),(43,'IRDAI Appointed Person / Specified Person Certificate'),(37,'IRDAI Corporate Agent License'),(36,'IRDAI Individual Insurance Agent Certificate'),(38,'IRDAI Insurance Broker License'),(39,'IRDAI Insurance Surveyor & Loss Assessor License'),(41,'IRDAI Point of Sales Person (POSP) Certificate'),(40,'IRDAI Third Party Administrator (TPA) License'),(42,'IRDAI Web Aggregator License'),(1,'NISM-Series-I: Currency Derivatives'),(2,'NISM-Series-II-A: Registrars to an Issue and Share Transfer Agents - Corporate'),(3,'NISM-Series-II-B: Registrars to an Issue and Share Transfer Agents - Mutual Fund'),(4,'NISM-Series-III-A: Securities Intermediaries Compliance (Non-Fund)'),(5,'NISM-Series-III-C: Securities Intermediaries Compliance (Fund)'),(6,'NISM-Series-IV: Interest Rate Derivatives'),(13,'NISM-Series-IX: Merchant Banking'),(7,'NISM-Series-V-A: Mutual Fund Distributors (English)'),(8,'NISM-Series-V-A: Mutual Fund Distributors (Hindi)'),(9,'NISM-Series-V-B: Mutual Fund Foundation'),(10,'NISM-Series-VI: Depository Operations'),(11,'NISM-Series-VII: Securities Operations and Risk Management'),(12,'NISM-Series-VIII: Equity Derivatives'),(14,'NISM-Series-X-A: Investment Adviser (Level 1)'),(15,'NISM-Series-X-B: Investment Adviser (Level 2)'),(16,'NISM-Series-X-C: Investment Adviser Certification (Renewal)'),(27,'NISM-Series-XII: Securities Markets Foundation'),(17,'NISM-Series-XIII: Common Derivatives'),(28,'NISM-Series-XIX-A: Alternative Investment Funds (Category I and II) Distributors'),(29,'NISM-Series-XIX-B: Alternative Investment Funds (Category III) Distributors'),(21,'NISM-Series-XIX-C: Alternative Investment Fund Managers'),(22,'NISM-Series-XIX-D: Category I and II Alternative Investment Fund Managers'),(23,'NISM-Series-XIX-E: Category III Alternative Investment Fund Managers'),(19,'NISM-Series-XV-B: Research Analyst Certification (Renewal)'),(18,'NISM-Series-XV: Research Analyst'),(20,'NISM-Series-XVI: Commodity Derivatives'),(26,'NISM-Series-XVII: Retirement Adviser'),(24,'NISM-Series-XXI-A: Portfolio Management Services (PMS) Distributors'),(25,'NISM-Series-XXI-B: Portfolio Managers'),(30,'NISM-Series-XXIII: Social Impact Assessors'),(31,'NISM-Series-XXIV: AML and CFT Provisions in Securities Markets'),(32,'SEBI Investor Awareness Test (Available in English, Hindi, Marathi, Telugu,Bengali)');
/*!40000 ALTER TABLE `certificate_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `certificates`
--

DROP TABLE IF EXISTS `certificates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `certificates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_number` varchar(50) NOT NULL,
  `module_name` varchar(255) NOT NULL,
  `cert_number` varchar(255) NOT NULL,
  `issue_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `certificates`
--

LOCK TABLES `certificates` WRITE;
/*!40000 ALTER TABLE `certificates` DISABLE KEYS */;
INSERT INTO `certificates` VALUES (1,'ZFL001','IBBI: Valuation Examination in the Asset class: Land and Building','NISM2026001','2026-01-23','2028-06-01','Compliant','NISM Portal BRD.pdf','/uploads/1769171473964-NISM_Portal_BRD.pdf','2026-01-23 12:31:13'),(2,'ZFL001','IBBI: Valuation Examination in the Asset class: Land and Building','NISM2026001','2026-01-23','2027-09-23','Compliant','NISM Portal BRD.pdf','/uploads/1769172328071-NISM_Portal_BRD.pdf','2026-01-23 12:45:28'),(3,'ZFL001','IBBI: Valuation Examination in the Asset class: Land and Building','NISM2026002','2026-01-23','2026-01-23','Expiring Soon','NISM Portal BRD.pdf','/uploads/1769172615987-NISM_Portal_BRD.pdf','2026-01-23 12:50:16'),(4,'ZFL001','IBBI: Valuation Examination in the Asset class: Plant and Machinery','NISM2026002','2026-01-23','2026-01-27','Expiring Soon','mama.png','/uploads/1769174564932-mama.png','2026-01-23 13:22:44'),(5,'ZFL001','IRDAI Appointed Person / Specified Person Certificate','NISM2026001','2026-01-23','2026-01-31','Expiring Soon','mama.png','/uploads/1769174584098-mama.png','2026-01-23 13:23:04'),(6,'ZFL001','NISM-Series-I: Currency Derivatives','NISM2026001','2026-01-23','2026-01-24','Expiring Soon','e852741abc5f9063e04d294c33586998.jpg','/uploads/1769174605204-e852741abc5f9063e04d294c33586998.jpg','2026-01-23 13:23:25'),(7,'ZFL001','SEBI Investor Awareness Test (Available in English, Hindi, Marathi, Telugu,Bengali)','NISM2026002','2026-01-17','2026-01-31','Expiring Soon','e852741abc5f9063e04d294c33586998.jpg','/uploads/1769174625940-e852741abc5f9063e04d294c33586998.jpg','2026-01-23 13:23:45');
/*!40000 ALTER TABLE `certificates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_number` varchar(50) NOT NULL,
  `employee_name` varchar(255) NOT NULL,
  `designation` varchar(255) DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `manager_email` varchar(255) DEFAULT NULL,
  `manager_employee_no` varchar(50) DEFAULT NULL,
  `manager_employee_name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `employee_number` (`employee_number`)
) ENGINE=InnoDB AUTO_INCREMENT=103 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
INSERT INTO `employees` VALUES (1,'ZCTL00025','Sushil Kumar Pathak','Senior Relationship Manager','Trading','Head Office','sushilp@adventz.zuarimoney.com','9958735828','Pankajk@adventz.zuarimoney.com','ZIL0076641','Pankaj Kumar','2026-01-23 11:02:06'),(2,'ZCTL00026','Ravi Kumar Yadav','Relationship Executive','Trading','Head Office','raviy@adventz.zuarimoney.com','9312696064','kunalp@adventz.zuarimoney.com','ZIL0076637','Kunal Pandey','2026-01-23 11:02:06'),(3,'ZCTL0003','Neeraj Kumar','Zonal Head','Trading','Head Office','neerajk@adventz.zuarimoney.com','9999781976','avnish.gulati@adventz.com','ZFL0076979','Avnish Gulati','2026-01-23 11:02:06'),(4,'ZFL0076855','Satish','Junior Executive','Customer Care','Head Office','satish@adventz.zuarimoney.com','9711828648','YashwantS@adventz.com','ZFL0076965','Yashwant Kumar Singh','2026-01-23 11:02:06'),(5,'ZFL0076863','Mukesh Kumar','Relationship Executive','Trading','Head Office','mukeshk@adventz.zuarimoney.com','7991177047','kunalp@adventz.zuarimoney.com','ZIL0076637','Kunal Pandey','2026-01-23 11:02:06'),(6,'ZFL0076865','Sohan Lal','Executive','Back Office - Trading','Head Office','sohanl@adventz.zuarimoney.com','9315703275','nareshs@adventz.zuarimoney.com','ZIL0076124','Naresh Kumar Sahni','2026-01-23 11:02:06'),(7,'ZFL0076869','Madan Pal','Senior Relationship Manager','Trading','Head Office','madanp@adventz.zuarimoney.com','9718290040','Pankajk@adventz.zuarimoney.com','ZIL0076641','Pankaj Kumar','2026-01-23 11:02:06'),(8,'ZFL0076873','Himanshu','Assistant Manager','Human Resource','Head Office','himanshus@adventz.zuarimoney.com','8750443272','meghna.aggarwal@adventz.com','ZFL0076968','Meghna Aggarwal','2026-01-23 11:02:06'),(9,'ZFL0076876','Satender Kumar Verma','Junior Executive','Back Office - DP & MF','Head Office','satenderv@adventz.zuarimoney.com','9810052271','YashwantS@adventz.com','ZFL0076965','Yashwant Kumar Singh','2026-01-23 11:02:06'),(10,'ZFL0076890','Kanak Kumar','Executive','IT','Head Office','KanakK@adventz.zuarimoney.com','9899382890','intkhaba@adventz.zuarimoney.com','ZIL0076113','Intkhab Alam','2026-01-23 11:02:06'),(11,'ZFL0076908','Brijesh Singh Hada','Assistant Branch Manager','Trading','Bhilwara','brijeshs@adventz.zuarimoney.com','9887765511','neerajk@adventz.zuarimoney.com','ZCTL0003','Neeraj Kumar','2026-01-23 11:02:06'),(12,'ZFL0076919','Raja Sengupta','Manager','Programmer','Head Office','Rajas@adventz.zuarimoney.com','9213491048','YashwantS@adventz.com','ZFL0076965','Yashwant Kumar Singh','2026-01-23 11:02:06'),(13,'ZFL0076922','Abhishek Pal','Executive','Product','Head Office','abhishekp@adventz.zuarimoney.com','8802000726','YashwantS@adventz.com','ZFL0076965','Yashwant Kumar Singh','2026-01-23 11:02:06'),(14,'ZFL0076923','Vinay Negi','Executive','Accounts','Head Office','vinayn@adventz.zuarimoney.com','9717971716','PrachiJ@adventz.com','ZFL0076951','Prachi Jain','2026-01-23 11:02:06'),(15,'ZFL0076926','Deepak vij','Senior Executive','RMS - Equity','Head Office','deepakv@adventz.zuarimoney.com','9313896848','surendras@adventz.zuarimoney.com','ZIL0076632','Surendra Kumar Soni','2026-01-23 11:02:06'),(16,'ZFL0076928','Dheeraj Singh','Relationship Manager','Trading','Kota','DheerajS@adventz.zuarimoney.com','7727000619','hemantg@adventz.zuarimoney.com','ZFL0076935','Hemant Gupta','2026-01-23 11:02:06'),(17,'ZFL0076930','Devendra Saini','Relationship Executive','Trading','Kota','devendras@adventz.zuarimoney.com','9887372308','hemantg@adventz.zuarimoney.com','ZFL0076935','Hemant Gupta','2026-01-23 11:02:06'),(18,'ZFL0076933','Vimal Saini','Senior Relationship Manager','Trading','Kota','vimals@adventz.zuarimoney.com','9829867311','hemantg@adventz.zuarimoney.com','ZFL0076935','Hemant Gupta','2026-01-23 11:02:06'),(19,'ZFL0076934','Bhagwan Das Mahawar','Relationship Manager','Trading','Kota','bhagwanm@adventz.zuarimoney.com','7073272033','hemantg@adventz.zuarimoney.com','ZFL0076935','Hemant Gupta','2026-01-23 11:02:06'),(20,'ZFL0076935','Hemant Gupta','Assistant Branch Manager','Trading','Kota','hemantg@adventz.zuarimoney.com','9166841800','neerajk@adventz.zuarimoney.com','ZCTL0003','Neeraj Kumar','2026-01-23 11:02:06'),(21,'ZFL0076936','Anil Kumar','Executive','Back Office - Trading','Head Office','anilk@adventz.zuarimoney.com','9953840078','nareshs@adventz.zuarimoney.com','ZIL0076124','Naresh Kumar Sahni','2026-01-23 11:02:06'),(22,'ZFL0076942','Jitendra Rajpoot','Relationship Manager','Trading','Kanpur','JitendraR@adventz.zuarimoney.com','9918772269','abhishekd@adventz.zuarimoney.com','ZIL0076766','Abhishek Dixit','2026-01-23 11:02:06'),(23,'ZFL0076951','Prachi Jain','Chief Financial Officer','Accounts','Head Office','PrachiJ@adventz.com','9891355558','avnish.gulati@adventz.com','ZFL0076979','Avnish Gulati','2026-01-23 11:02:06'),(24,'ZFL0076953','Hariom Sharma','Assistant Branch Manager','Trading','Agra','harioms@adventz.zuarimoney.com','9354200024','gauravp@adventz.zuarimoney.com','ZIL0076779','Gaurav Pathak','2026-01-23 11:02:06'),(25,'ZFL0076954','Rinkal Kathuria','Assistant Manager','RMS - Equity','Head Office','rinkalk@adventz.zuarimoney.com','7838049173','surendras@adventz.zuarimoney.com','ZIL0076632','Surendra Kumar Soni','2026-01-23 11:02:06'),(26,'ZFL0076960','Seema Pawan Kumar Pandey','Relationship Manager','Trading','Lucknow','seemap@adventz.zuarimoney.com','8983174523','kulbhushans@adventz.com','ZFL0076994','Kulbhushan Srivastava','2026-01-23 11:02:06'),(27,'ZFL0076964','Anil Kumar Sharma','Relationship Manager','Trading','Bhilwara','anils@adventz.zuarimoney.com','9460376335','brijeshs@adventz.zuarimoney.com','ZFL0076908','Brijesh Singh Hada','2026-01-23 11:02:06'),(28,'ZFL0076965','Yashwant Kumar Singh','Manager - Compliance','Back Office - DP & MF','Head Office','YashwantS@adventz.com','9871299035','avnish.gulati@adventz.com','ZFL0076979','Avnish Gulati','2026-01-23 11:02:06'),(29,'ZFL0076966','Abhay Singh Banodha','Relationship Manager','Trading','Kota','AbhayB@adventz.zuarimoney.com','9828102988','hemantg@adventz.zuarimoney.com','ZFL0076935','Hemant Gupta','2026-01-23 11:02:06'),(30,'ZFL0076967','Dharmendra Yadav','Branch Manager','Trading','Jaipur','DharmendraY@adventz.com','8529688830','neerajk@adventz.zuarimoney.com','ZCTL0003','Neeraj Kumar','2026-01-23 11:02:06'),(31,'ZFL0076968','Meghna Aggarwal','Head HR and Administration','Human Resource','Head Office','meghna.aggarwal@adventz.com','8283808998','avnish.gulati@adventz.com','ZFL0076979','Avnish Gulati','2026-01-23 11:02:06'),(32,'ZFL0076970','Karan Yadav','Relationship Manager','Trading','Jaipur','KaranK@adventz.zuarimoney.com','9166341808','DharmendraY@adventz.com','ZFL0076967','Dharmendra Yadav','2026-01-23 11:02:06'),(33,'ZFL0076971','Dharamveer Singh','Assistant Branch Manager','Trading','Gurgaon','DharamveerS@adventz.zuarimoney.com','7011087052','kunalp@adventz.zuarimoney.com','ZIL0076637','Kunal Pandey','2026-01-23 11:02:06'),(34,'ZFL0076973','Ashish Pareek','Relationship Manager','Trading','Jaipur','AshishP@adventz.zuarimoney.com','9352321654','DharmendraY@adventz.com','ZFL0076967','Dharmendra Yadav','2026-01-23 11:02:06'),(35,'ZFL0076975','Puneet Gupta','Executive','RMS - Commodity','Head Office','PuneetG@adventz.zuarimoney.com','8527204984','surendras@adventz.zuarimoney.com','ZIL0076632','Surendra Kumar Soni','2026-01-23 11:02:06'),(36,'ZFL0076977','Kamalesh R','Relationship Manager','Trading','Jaipur','KamaleshR@adventz.zuarimoney.com','9779005896','DharmendraY@adventz.com','ZFL0076967','Dharmendra Yadav','2026-01-23 11:02:06'),(37,'ZFL0076978','Sanjay Tayal','Senior Relationship Manager','Trading','Gurgaon','SanjayT@adventz.zuarimoney.com','7827660678','DharamveerS@adventz.zuarimoney.com','ZFL0076971','Dharamveer Singh','2026-01-23 11:02:06'),(38,'ZFL0076979','Avnish Gulati','Chief Executive Office','Management','Head Office','avnish.gulati@adventz.com','8803014272','','ZFLT001','Athar Shahab','2026-01-23 11:02:06'),(39,'ZFL0076982','Satwinder Singh','Relationship Manager','Trading','Jalandhar','satwinders@adventz.zuarimoney.com','9855202526','NishantS@adventz.com','ZFL0076993','Nishant Saini','2026-01-23 11:02:06'),(40,'ZFL0076983','Yogita','Junior Executive','Back Office - Trading','Head Office','yogita@adventz.zuarimoney.com','8076540779','nareshs@adventz.zuarimoney.com','ZIL0076124','Naresh Kumar Sahni','2026-01-23 11:02:06'),(41,'ZFL0076984','Arun Kalra','Senior Executive','Human Resource','Head Office','ArunK@adventz.zuarimoney.com','9541275737','meghna.aggarwal@adventz.com','ZFL0076968','Meghna Aggarwal','2026-01-23 11:02:06'),(42,'ZFL0076987','Neha Rawat','Assistant Manager','Secretarial','Head Office','NehaR@adventz.com','9650467196','avnish.gulati@adventz.com','ZFL0076979','Avnish Gulati','2026-01-23 11:02:06'),(43,'ZFL0076988','Raghav Daga','Relationship Executive','Trading','Bhilwara','RaghavD@adventz.zuarimoney.com','7665335757','brijeshs@adventz.zuarimoney.com','ZFL0076908','Brijesh Singh Hada','2026-01-23 11:02:06'),(44,'ZFL0076989','Sankar Das','Branch Manager','Trading','Kolkata','SankarD@adventz.com','7003448891','kunalp@adventz.zuarimoney.com','ZIL0076637','Kunal Pandey','2026-01-23 11:02:06'),(45,'ZFL0076990','Alok Ranjan Jha','Senior Relationship Manager','Trading','Kolkata','AlokJ@adventz.zuarimoney.com','9831022293','SankarD@adventz.com','ZFL0076989','Sankar Das','2026-01-23 11:02:06'),(46,'ZFL0076991','Vinay Sharma','Senior Relationship Manager','Trading','Kolkata','VinayS@adventz.zuarimoney.com','9830604521','SankarD@adventz.com','ZFL0076989','Sankar Das','2026-01-23 11:02:06'),(47,'ZFL0076992','Vikram Tandon','Senior Relationship Manager','Trading','Jalandhar','VikramT@adventz.zuarimoney.com','9872454661','NishantS@adventz.com','ZFL0076993','Nishant Saini','2026-01-23 11:02:06'),(48,'ZFL0076993','Nishant Saini','Branch Manager','Trading','Jalandhar','NishantS@adventz.com','9779974949','kunalp@adventz.zuarimoney.com','ZIL0076637','Kunal Pandey','2026-01-23 11:02:06'),(49,'ZFL0076994','Kulbhushan Srivastava','Branch Manager','Trading','Lucknow','kulbhushans@adventz.com','8858994396','neerajk@adventz.zuarimoney.com','ZCTL0003','Neeraj Kumar','2026-01-23 11:02:06'),(50,'ZFL0076995','Biswajit Chakraborty','Senior Relationship Manager','Trading','Kolkata','BiswajitC@adventz.zuarimoney.com','9382234311','SankarD@adventz.com','ZFL0076989','Sankar Das','2026-01-23 11:02:06'),(51,'ZFL0076996','Govind Singh','Executive','Back Office - DP & MF','Head Office','govinds@adventz.zuarimoney.com','8527070941','YashwantS@adventz.com','ZFL0076965','Yashwant Kumar Singh','2026-01-23 11:02:06'),(52,'ZFL0076997','Irfan Ansari','Relationship Manager','Trading','Udaipur','irfana@adventz.zuarimoney.com','9772318318','yashwantc@adventz.com','ZFL0076998','Yashwant Choudhary','2026-01-23 11:02:06'),(53,'ZFL0076998','Yashwant Choudhary','Branch Manager','Trading','Udaipur','yashwantc@adventz.com','9610036559','neerajk@adventz.zuarimoney.com','ZCTL0003','Neeraj Kumar','2026-01-23 11:02:06'),(54,'ZFL0076999','Subhasis Mukherjee','Senior Relationship Manager','Trading','Kolkata','SubhasisM@adventz.zuarimoney.com','9007466968','SankarD@adventz.com','ZFL0076989','Sankar Das','2026-01-23 11:02:06'),(55,'ZFL0077000','Abhishek Sehgal','Senior Relationship Manager','Trading','Lucknow','AbhishekSE@adventz.zuarimoney.com','8299875250','kulbhushans@adventz.com','ZFL0076994','Kulbhushan Srivastava','2026-01-23 11:02:06'),(56,'ZFL0077001','Sunil Kumar','Senior Relationship Manager','Trading','Noida','SunilK@adventz.zuarimoney.com','8929396937','dineshb@adventz.zuarimoney.com','ZIL0076784','Dinesh Belwal','2026-01-23 11:02:06'),(57,'ZFL0077002','Ravi Kumar Singh','Senior Relationship Manager','Trading','Noida','RaviS@adventz.zuarimoney.com','9310498088','dineshb@adventz.zuarimoney.com','ZIL0076784','Dinesh Belwal','2026-01-23 11:02:06'),(58,'ZFL0077003','Aditya Sharma','Relationship Executive','Trading','Noida','AdityaS@adventz.zuarimoney.com','9911703508','dineshb@adventz.zuarimoney.com','ZIL0076784','Dinesh Belwal','2026-01-23 11:02:06'),(59,'ZFL0077004','Gulab Sureshchanda Sharma','Senior Relationship Manager','Trading','Lucknow','GulabS@adventz.zuarimoney.com','8853195354','kulbhushans@adventz.com','ZFL0076994','Kulbhushan Srivastava','2026-01-23 11:02:06'),(60,'ZFL0077005','Anshika Agrawal','Customer Service Executive','Customer Care','Lucknow','AnshikaA@adventz.zuarimoney.com','7905400960','kulbhushans@adventz.com','ZFL0076994','Kulbhushan Srivastava','2026-01-23 11:02:06'),(61,'ZFL0077006','Praveen Mishra','Senior Relationship Manager','Trading','Kanpur','PraveenM@adventz.zuarimoney.com','9970174914','abhishekd@adventz.zuarimoney.com','ZIL0076766','Abhishek Dixit','2026-01-23 11:02:06'),(62,'ZFL0077007','Mayanshi Shah','Relationship Manager','Trading','Udaipur','MayanshiS@Adventz.zuarimoney.com','8619380300','yashwantc@adventz.com','ZFL0076998','Yashwant Choudhary','2026-01-23 11:02:06'),(63,'ZFL0077008','Rajesh Machhal','Head Customer Experience','Customer Care','Head Office','rajesh.machhal@adventz.com','9227217394','avnish.gulati@adventz.com','ZFL0076979','Avnish Gulati','2026-01-23 11:02:06'),(64,'ZFL0077009','Chetan Sahu','Relationship Manager','Trading','Udaipur','ChetanS@adventz.zuarimoney.com','7014358347','yashwantc@adventz.com','ZFL0076998','Yashwant Choudhary','2026-01-23 11:02:06'),(65,'ZFL0077010','Kshitij Sahu','Relationship Manager','Trading','Lucknow','KshitijS@adventz.zuarimoney.com','6307903784','kulbhushans@adventz.com','ZFL0076994','Kulbhushan Srivastava','2026-01-23 11:02:06'),(66,'ZFL0077011','Vijay Kumar Gola','Senior Executive - Central Dealing Desk','Trading','Head Office','VijayG@adventz.zuarimoney.com','9540762361','kunalp@adventz.zuarimoney.com','ZIL0076637','Kunal Pandey','2026-01-23 11:02:06'),(67,'ZFL0077012','Sachin Singh','Executive - KYC','Back Office - DP & MF','','SachinS@adventz.zuarimoney.com','8178138530','rams@adventz.zuarimoney.com','ZIL0076234','Ram Kumar Sharma','2026-01-23 11:02:06'),(68,'ZFLC001','Debasis Chatterjee','Consultant','','Kolkata','debasisc@adventz.zuarimoney.com','9330721002','SankarD@adventz.com','ZFL0076989','Sankar Das','2026-01-23 11:02:06'),(69,'ZFLC002','Pijush Dey','Senior Relationship Manager','Trading','Kolkata','piyushd@adventz.zuarimoney.com','9051640555','SankarD@adventz.com','ZFL0076989','Sankar Das','2026-01-23 11:02:06'),(70,'ZIL0076113','Intkhab Alam','Chief Manager','IT','Head Office','intkhaba@adventz.zuarimoney.com','9313600390','avnish.gulati@adventz.com','ZFL0076979','Avnish Gulati','2026-01-23 11:02:06'),(71,'ZIL0076116','M.S. Sajwan','Senior Executive','Back Office - DP & MF','Head Office','msajwan@adventz.zuarimoney.com','9871001291','YashwantS@adventz.com','ZFL0076965','Yashwant Kumar Singh','2026-01-23 11:02:06'),(72,'ZIL0076124','Naresh Kumar Sahni','Senior Manager','Back Office - Trading','Head Office','nareshs@adventz.zuarimoney.com','9911379808','YashwantS@adventz.com','ZFL0076965','Yashwant Kumar Singh','2026-01-23 11:02:06'),(73,'ZIL0076179','Umrav Singh Rawat','Senior Executive','Back Office - DP & MF','Head Office','umravr@adventz.zuarimoney.com','9911252324','YashwantS@adventz.com','ZFL0076965','Yashwant Kumar Singh','2026-01-23 11:02:06'),(74,'ZIL0076184','Raj Kumar','Assistant Manager','Back Office - DP & MF','Head Office','rajk@adventz.zuarimoney.com','9871219235','YashwantS@adventz.com','ZFL0076965','Yashwant Kumar Singh','2026-01-23 11:02:06'),(75,'ZIL0076232','Manoj Kumar Gupta','Senior Relationship Manager','Trading','Kanpur','manojg@adventz.zuarimoney.com','9236008289','abhishekd@adventz.zuarimoney.com','ZIL0076766','Abhishek Dixit','2026-01-23 11:02:06'),(76,'ZIL0076234','Ram Kumar Sharma','Assistant Manager','Back Office - DP & MF','Head Office','rams@adventz.zuarimoney.com','9311115221','YashwantS@adventz.com','ZFL0076965','Yashwant Kumar Singh','2026-01-23 11:02:06'),(77,'ZIL0076262','Seetanshu Kapoor','Senior Executive','Back Office - Trading','Head Office','seetanshuk@adventz.zuarimoney.com','9810247542','nareshs@adventz.zuarimoney.com','ZIL0076124','Naresh Kumar Sahni','2026-01-23 11:02:06'),(78,'ZIL0076265','Hemant Kumar Sharma','Relationship Manager','Trading','Agra','hemants@adventz.zuarimoney.com','9837210506','gauravp@adventz.zuarimoney.com','ZIL0076779','Gaurav Pathak','2026-01-23 11:02:06'),(79,'ZIL0076373','Ajay Kumar','Junior Executive','Back Office - DP & MF','Head Office','ajayk@adventz.zuarimoney.com','8802559778','YashwantS@adventz.com','ZFL0076965','Yashwant Kumar Singh','2026-01-23 11:02:06'),(80,'ZIL0076390','Ashutosh Kumar','Executive','Back Office - DP & MF','Head Office','ashutoshk@adventz.zuarimoney.com','9953335673','nareshs@adventz.zuarimoney.com','ZIL0076124','Naresh Kumar Sahni','2026-01-23 11:02:06'),(81,'ZIL0076472','Uday Lodh','Relationship Manager','Trading','Kolkata','udayl@adventz.zuarimoney.com','9143010552','SankarD@adventz.com','ZFL0076989','Sankar Das','2026-01-23 11:02:06'),(82,'ZIL0076494','Devi Shankar Solanki','Executive','Back Office - DP & MF','Kota','devishankars@adventz.zuarimoney.com','9529965132','hemantg@adventz.zuarimoney.com','ZFL0076935','Hemant Gupta','2026-01-23 11:02:06'),(83,'ZIL0076523','Nikesh Kumar Pandey','Deputy Manager','Accounts','Head Office','Nikeshp@adventz.zuarimoney.com','9560075692','PrachiJ@adventz.com','ZFL0076951','Prachi Jain','2026-01-23 11:02:06'),(84,'ZIL0076577','Raju Kumar Sahu','Relationship Manager','Trading','Kanpur','rajus@adventz.zuarimoney.com','8874773311','abhishekd@adventz.zuarimoney.com','ZIL0076766','Abhishek Dixit','2026-01-23 11:02:06'),(85,'ZIL0076597','Susanta Jana','Senior Relationship Manager','Trading','Kolkata','susantaj@adventz.zuarimoney.com','9831807679','SankarD@adventz.com','ZFL0076989','Sankar Das','2026-01-23 11:02:06'),(86,'ZIL0076632','Surendra Kumar Soni','Senior Manager','RMS - Equity','Head Office','surendras@adventz.zuarimoney.com','9999086174','avnish.gulati@adventz.com','ZFL0076979','Avnish Gulati','2026-01-23 11:02:06'),(87,'ZIL0076637','Kunal Pandey','Zonal Head','Trading','Head Office','kunalp@adventz.zuarimoney.com','9899860054','avnish.gulati@adventz.com','ZFL0076979','Avnish Gulati','2026-01-23 11:02:06'),(88,'ZIL0076641','Pankaj Kumar','Branch Manager','Trading','Head Office','Pankajk@adventz.zuarimoney.com','9911436344','kunalp@adventz.zuarimoney.com','ZIL0076637','Kunal Pandey','2026-01-23 11:02:06'),(89,'ZIL0076695','Manoj Kumar','Senior Relationship Manager','Trading','Head Office','ManojK@adventz.zuarimoney.com','9911555902','Pankajk@adventz.zuarimoney.com','ZIL0076641','Pankaj Kumar','2026-01-23 11:02:06'),(90,'ZIL0076717','Rohit Kumar Tiwari','Assistant Manager','IT','Head Office','rohitt@adventz.zuarimoney.com','9953258465','intkhaba@adventz.zuarimoney.com','ZIL0076113','Intkhab Alam','2026-01-23 11:02:06'),(91,'ZIL0076766','Abhishek Dixit','Senior Branch Manager','Trading','Kanpur','abhishekd@adventz.zuarimoney.com','9935905817','neerajk@adventz.zuarimoney.com','ZCTL0003','Neeraj Kumar','2026-01-23 11:02:06'),(92,'ZIL0076776','Abhishek Sharma','Assistant Manager','Back Office - DP & MF','Head Office','Abhisheks@adventz.zuarimoney.com','8178697346','YashwantS@adventz.com','ZFL0076965','Yashwant Kumar Singh','2026-01-23 11:02:06'),(93,'ZIL0076779','Gaurav Pathak','Branch Manager','Trading','Agra','gauravp@adventz.zuarimoney.com','9358882021','neerajk@adventz.zuarimoney.com','ZCTL0003','Neeraj Kumar','2026-01-23 11:02:06'),(94,'ZIL0076784','Dinesh Belwal','Branch Manager','Trading','Noida','dineshb@adventz.zuarimoney.com','9582877775','kunalp@adventz.zuarimoney.com','ZIL0076637','Kunal Pandey','2026-01-23 11:02:06'),(95,'ZIL0076796','Amit Dutta','Senior Relationship Manager','Trading','Kolkata','AMITD@ADVENTZ.ZUARIMONEY.COM','9748456755','SankarD@adventz.com','ZFL0076989','Sankar Das','2026-01-23 11:02:06'),(96,'ZIL0076816','Mithun Kukreja','Senior Relationship Manager','Trading','Head Office','MITHUNK@ADVENTZ.ZUARIMONEY.COM','9560514399','kunalp@adventz.zuarimoney.com','ZIL0076637','Kunal Pandey','2026-01-23 11:02:06'),(97,'ZIL0076824','Kulkesh Saxena','Assistant Manager','Accounts','Head Office','kulkeshs@adventz.zuarimoney.com','9359338944','PrachiJ@adventz.com','ZFL0076951','Prachi Jain','2026-01-23 11:02:06'),(98,'ZIL0076826','Lalit Mohan','Assistant Manager','Back Office - DP & MF','Head Office','LALITS@ADVENTZ.ZUARIMONEY.COM','9811259003','YashwantS@adventz.com','ZFL0076965','Yashwant Kumar Singh','2026-01-23 11:02:06'),(99,'ZIL0076834','Yamini Mathur','Senior Relationship Manager','Trading','Head Office','yaminim@adventz.zuarimoney.com','8826650892','Pankajk@adventz.zuarimoney.com','ZIL0076641','Pankaj Kumar','2026-01-23 11:02:06'),(100,'ZFL0077013','Honey Mishra','Branch Manager','Trading','Bhilwara','HoneyM@adventz.com','9828534698','neerajk@adventz.zuarimoney.com','ZCTL0003','Neeraj Kumar','2026-01-23 11:02:06'),(102,'ZFL001','Tejas Rai','Developer','IT','Gurugram','tejas.rai@adventz.com','8700986892','rohit@adventz.com','ZIL001','Rohit Sindhava','2026-01-23 11:51:48');
/*!40000 ALTER TABLE `employees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (2,'tejas.rai@adventz.com','$2a$10$fBEa6DsQBrAyfd88CCKVuOcIW9QOXx.wua5KoDca010KXDnm73R32','2026-01-23 11:58:15');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'nism'
--

--
-- Dumping routines for database 'nism'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-23 19:49:00
