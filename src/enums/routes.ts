enum Routes {
  LandingPage = "/",
  Login = "/login",
  UserPrefix = "/user",
  UserDashboard = `${UserPrefix}/dashboard`,
  UserWallets = `${UserPrefix}/wallets`,
  UserGoals = `${UserPrefix}/goals`,
  UserReports = `${UserPrefix}/reports`,
  UserSettings = `${UserPrefix}/settings`,
  UserAccountSettings = `${UserPrefix}/settings/account`,
  UserBillingSettings = `${UserPrefix}/settings/billing`,
  UserNotificationsSettings = `${UserPrefix}/settings/notifications`,
  UserDisplaySettings = `${UserPrefix}/settings/display`,
}

export default Routes;
