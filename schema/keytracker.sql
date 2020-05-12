CREATE TABLE `batchTrackingTable_izyware_sqldashboard_rekey` (
  `recordid` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `originalId` bigint(20) NOT NULL,
  `tbl` char(30) NOT NULL,
  `newId` bigint(20) DEFAULT NULL,
  `processed` timestamp NULL DEFAULT NULL,
  UNIQUE KEY `originalId_newId` (`originalId`,`newId`),
  KEY `recordid` (`recordid`) USING BTREE,
  KEY `tbl` (`tbl`),
  KEY `processed` (`processed`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8
