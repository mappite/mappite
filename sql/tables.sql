-- phpMyAdmin SQL Dump
-- 
-- Generation Time: Jan 02, 2021 at 03:03 PM


SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;


-- --------------------------------------------------------

--
-- Table structure for table `ROUTES`
--

CREATE TABLE `ROUTES` (
  `ROUTE_ID` int(10) UNSIGNED NOT NULL,
  `USER_ID` int(10) UNSIGNED NOT NULL,
  `NAME` varchar(255) COLLATE latin1_general_ci NOT NULL,
  `URL` text COLLATE latin1_general_ci,
  `PUBLIC_FLAG` char(1) COLLATE latin1_general_ci DEFAULT NULL,
  `CREATION_DATE` datetime DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `SHORTURLS`
--

CREATE TABLE `SHORTURLS` (
  `ID` int(10) UNSIGNED NOT NULL,
  `USER_KEY` char(60) COLLATE latin1_general_ci NOT NULL,
  `CDATE` datetime DEFAULT NULL,
  `URL` varchar(5120) COLLATE latin1_general_ci DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `TRACKERS` - experimental / not used
--

CREATE TABLE `TRACKERS` (
  `TRACKER_ID` int(10) UNSIGNED NOT NULL,
  `USER_ID` int(10) UNSIGNED NOT NULL,
  `TRACKER_CODE` varchar(16) COLLATE latin1_general_ci NOT NULL,
  `NAME` varchar(255) COLLATE latin1_general_ci NOT NULL,
  `LOGO` varchar(255) COLLATE latin1_general_ci NOT NULL,
  `PUBLIC_FLAG` char(1) COLLATE latin1_general_ci DEFAULT NULL,
  `PUBLIC_STARTDATE` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `PUBLIC_ENDDATE` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `CREATION_DATE` datetime DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `TRACKER_POINTS` - experimental / not used
--

CREATE TABLE `TRACKER_POINTS` (
  `TRACKER_ID` int(10) UNSIGNED NOT NULL,
  `TIMESTAMP` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `ELE` int(11) DEFAULT NULL,
  `SPEED` int(11) DEFAULT NULL,
  `LON` int(11) NOT NULL,
  `LAT` int(11) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `USERS`
--

CREATE TABLE `USERS` (
  `USER_ID` int(10) UNSIGNED NOT NULL,
  `EMAIL` varchar(255) COLLATE latin1_general_ci NOT NULL,
  `PWD` varchar(32) COLLATE latin1_general_ci NOT NULL DEFAULT 'x',
  `TOKEN` char(55) COLLATE latin1_general_ci NOT NULL,
  `TOKEN_DATE` datetime DEFAULT NULL,
  `TMPPWD` varchar(32) COLLATE latin1_general_ci DEFAULT NULL,
  `TMPPWD_DATE` datetime DEFAULT NULL,
  `CREATION_DATE` datetime DEFAULT NULL,
  `INFO` varchar(512) COLLATE latin1_general_ci DEFAULT NULL,
  `TYPE` varchar(1) COLLATE latin1_general_ci NOT NULL,
  `LANG` varchar(2) COLLATE latin1_general_ci DEFAULT NULL,
  `RENEWALS` int(11) NOT NULL DEFAULT '1'
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `ROUTES`
--
ALTER TABLE `ROUTES`
  ADD PRIMARY KEY (`ROUTE_ID`),
  ADD KEY `USER_ID` (`USER_ID`,`NAME`);

--
-- Indexes for table `SHORTURLS`
--
ALTER TABLE `SHORTURLS`
  ADD PRIMARY KEY (`ID`);

--
-- Indexes for table `TRACKERS`
--
ALTER TABLE `TRACKERS`
  ADD PRIMARY KEY (`TRACKER_ID`),
  ADD UNIQUE KEY `TRACKER_CODE` (`TRACKER_CODE`),
  ADD KEY `TRACKER_CODE_2` (`TRACKER_CODE`);

--
-- Indexes for table `TRACKER_POINTS`
--
ALTER TABLE `TRACKER_POINTS`
  ADD KEY `TRACKER_ID` (`TRACKER_ID`,`TIMESTAMP`);

--
-- Indexes for table `USERS`
--
ALTER TABLE `USERS`
  ADD PRIMARY KEY (`USER_ID`),
  ADD UNIQUE KEY `EMAIL` (`EMAIL`),
  ADD UNIQUE KEY `TOKEN` (`TOKEN`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `ROUTES`
--
ALTER TABLE `ROUTES`
  MODIFY `ROUTE_ID` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `SHORTURLS`
--
ALTER TABLE `SHORTURLS`
  MODIFY `ID` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `TRACKERS`
--
ALTER TABLE `TRACKERS`
  MODIFY `TRACKER_ID` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `USERS`
--
ALTER TABLE `USERS`
  MODIFY `USER_ID` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

